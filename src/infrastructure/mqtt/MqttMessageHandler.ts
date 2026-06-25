/**
 * @file MqttMessageHandler.ts
 * @route /src/infrastructure/mqtt/MqttMessageHandler.ts
 * @description Despachador de mensajes MQTT entrantes.
 *              Arquitectura: un topic = un sensor = una sola métrica.
 *              El campo sensor.metric determina qué mide cada topic; no se infiere del payload.
 *
 *              Pipeline ML por cada medición entrante:
 *                1. Anomaly detection (Z-score) — lecturas anómalas se almacenan
 *                   pero no pasan al pipeline de alertas/actuadores.
 *                2. Alert evaluation — clasifica el valor y crea/resuelve Alert en DB.
 *                3. Auto-control     — activa o desactiva bombas/ventiladores según
 *                                     nivel actual y predicción EWMA a 15 minutos.
 * @author Kevin Mariano
 * @version 4.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { getMqttClient } from "./MqttClient";
import { withIdempotency } from "@/shared/utils/idempotency";
import { prisma } from "@/shared/database/prisma.client";
import { type Metric, type SensorSide } from "@/generated/prisma";
import { detectAnomaly } from "@/ml/anomaly";
import { evaluateAndAlert } from "@/ml/alert-evaluator";
import { autoControl } from "@/ml/auto-controller";

type SensorInfo = {
  id:             string;
  metric:         Metric;
  side:           SensorSide;
  nodeId:         string;
  shedId:         string;
  organizationId: string;
};

/** Inicia la escucha de todos los sensores activos y despacha mediciones al dominio. */
export async function startMqttMessageHandler(): Promise<void> {
  const sensors = await prisma.sensor.findMany({
    where:  { isActive: true },
    select: {
      hardwareId: true,
      id:         true,
      metric:     true,
      side:       true,
      nodeId:     true,
      node: { select: { shedId: true, shed: { select: { organizationId: true } } } },
    },
  });

  if (sensors.length === 0) {
    console.info("[MQTT] Sin sensores activos para suscribirse");
    return;
  }

  const mqttClient = getMqttClient();
  const topics     = sensors.map(s => s.hardwareId);

  mqttClient.subscribe(topics, { qos: 1 }, (err) => {
    if (err) console.error("[MQTT] Error al suscribirse:", err.message);
    else     console.info(`[MQTT] Suscrito a ${topics.length} sensor(es): ${topics.join(", ")}`);
  });

  // Mapa en memoria hardwareId → contexto completo del sensor (evita una query por mensaje)
  const sensorByTopic = new Map<string, SensorInfo>(
    sensors.map(s => [s.hardwareId, {
      id:             s.id,
      metric:         s.metric,
      side:           s.side,
      nodeId:         s.nodeId,
      shedId:         s.node.shedId,
      organizationId: s.node.shed.organizationId,
    }])
  );

  mqttClient.on("message", async (topic, payload) => {
    const raw = payload.toString().trim();
    const key = `${topic}:${raw}:${Date.now()}`;

    await withIdempotency(key, async () => {
      await handleSensorReading(topic, raw, sensorByTopic);
    });
  });
}

async function handleSensorReading(
  hardwareId: string,
  raw: string,
  sensorByTopic: Map<string, SensorInfo>,
): Promise<void> {
  const value = parseFloat(raw);
  if (isNaN(value)) {
    console.warn(`[MQTT] Valor no numérico en topic "${hardwareId}": "${raw}"`);
    return;
  }

  const info = sensorByTopic.get(hardwareId);
  if (!info) {
    console.warn(`[MQTT] Topic desconocido: "${hardwareId}" — no hay sensor registrado con ese ID`);
    return;
  }

  // 1. Anomaly detection
  const { isAnomaly, zScore } = await detectAnomaly(info.id, value);
  if (isAnomaly) {
    console.warn(`[ML] Anomalía en ${hardwareId}: valor=${value}, Z=${zScore.toFixed(2)} — pipeline omitido`);
  }

  // Siempre almacenar la medición (incluso anómalas para trazabilidad)
  await prisma.measurement.create({
    data: { sensorId: info.id, metric: info.metric, value, timestamp: new Date() },
  });

  console.info(`[MQTT] ${hardwareId} (${info.metric}) → ${value}${isAnomaly ? " [anomalía]" : ""}`);

  if (isAnomaly) return;

  // 2. Alert evaluation + 3. Auto-control
  try {
    const alertRange = await prisma.alertRange.findUnique({
      where: { organizationId_metric: { organizationId: info.organizationId, metric: info.metric } },
    });

    if (!alertRange) return;

    const currentLevel = await evaluateAndAlert(
      info.id, info.organizationId, info.metric, value, alertRange,
    );

    await autoControl(
      info.id, info.metric, info.side,
      info.nodeId, info.shedId,
      currentLevel, alertRange,
    );
  } catch (err) {
    console.error(`[ML] Error en pipeline para ${hardwareId}:`, err);
  }
}
