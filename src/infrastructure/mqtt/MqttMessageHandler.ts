/**
 * @file MqttMessageHandler.ts
 * @route /src/infrastructure/mqtt/MqttMessageHandler.ts
 * @description Despachador de mensajes MQTT entrantes.
 *              Arquitectura: un topic = un sensor = una sola métrica.
 *              El campo node.metric determina qué mide el sensor; no se infiere del payload.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { getMqttClient } from "./MqttClient";
import { withIdempotency } from "@/shared/utils/idempotency";
import { prisma } from "@/shared/database/prisma.client";

/** Inicia la escucha de todos los sensores activos y despacha mediciones al dominio. */
export async function startMqttMessageHandler(): Promise<void> {
  const nodes = await prisma.node.findMany({
    where:  { isActive: true },
    select: { hardwareId: true, metric: true },
  });

  if (nodes.length === 0) {
    console.info("[MQTT] Sin sensores activos para suscribirse");
    return;
  }

  const mqttClient = getMqttClient();
  const topics     = nodes.map(n => n.hardwareId);

  mqttClient.subscribe(topics, { qos: 1 }, (err) => {
    if (err) console.error("[MQTT] Error al suscribirse:", err.message);
    else     console.info(`[MQTT] Suscrito a ${topics.length} sensor(es): ${topics.join(", ")}`);
  });

  // Mapa en memoria hardwareId → métrica para evitar una query por mensaje
  const metricByTopic = new Map(nodes.map(n => [n.hardwareId, n.metric]));

  mqttClient.on("message", async (topic, payload) => {
    const raw = payload.toString().trim();
    const key = `${topic}:${raw}:${Date.now()}`;

    await withIdempotency(key, async () => {
      await handleSensorReading(topic, raw, metricByTopic);
    });
  });
}

async function handleSensorReading(
  hardwareId: string,
  raw: string,
  metricByTopic: Map<string, string>,
): Promise<void> {
  const value = parseFloat(raw);
  if (isNaN(value)) {
    console.warn(`[MQTT] Valor no numérico en topic "${hardwareId}": "${raw}"`);
    return;
  }

  const metric = metricByTopic.get(hardwareId);
  if (!metric) {
    console.warn(`[MQTT] Topic desconocido: "${hardwareId}" — no hay sensor registrado con ese ID`);
    return;
  }

  const node = await prisma.node.findUnique({
    where:   { hardwareId },
    include: { shed: { select: { organizationId: true } } },
  });

  if (!node) return;

  await prisma.measurement.create({
    data: { nodeId: node.id, metric: node.metric, value, timestamp: new Date() },
  });

  console.info(`[MQTT] ${hardwareId} (${metric}) → ${value}`);

  // TODO: evaluar AlertRange y disparar alertas / actuadores si corresponde
}
