/**
 * @file auto-controller.ts
 * @route /src/ml/auto-controller.ts
 * @description Control automático de bombas y ventiladores basado en el nivel
 *              de alerta actual y la predicción EWMA a 15 minutos.
 *
 *              Lógica:
 *                HUMEDAD  + INTERIOR → pump del nodo
 *                  LOW (YELLOW/RED)  → activar bomba
 *                  GREEN             → desactivar bomba
 *
 *                TEMPERATURA + INTERIOR → fans del galpón
 *                  HIGH (YELLOW/RED) → activar ventiladores
 *                  GREEN             → desactivar ventiladores
 *
 *              Si el nivel actual es GREEN pero la predicción indica riesgo
 *              en los próximos 15 minutos, los dispositivos se activan de
 *              forma preventiva.
 *
 *              Solo sensores INTERIOR controlan dispositivos; los EXTERIOR
 *              son de referencia ambiental.
 */

import { prisma } from "@/shared/database/prisma.client";
import { publishCommand } from "@/infrastructure/mqtt/MqttClient";
import { AlertLevel, EventReason, DeviceType, DeviceAction, Metric, SensorSide } from "@/generated/prisma";
import { type AlertRange } from "./alert-evaluator";
import { forecast } from "./forecasting";

const LEVEL_TO_REASON: Partial<Record<AlertLevel, EventReason>> = {
  [AlertLevel.YELLOW_LOW]:  EventReason.YELLOW_LOW,
  [AlertLevel.YELLOW_HIGH]: EventReason.YELLOW_HIGH,
  [AlertLevel.RED_LOW]:     EventReason.RED_LOW,
  [AlertLevel.RED_HIGH]:    EventReason.RED_HIGH,
};

export async function autoControl(
  sensorId: string,
  metric: Metric,
  side: SensorSide,
  nodeId: string,
  shedId: string,
  currentLevel: AlertLevel,
  alertRange: AlertRange,
): Promise<void> {
  if (side !== SensorSide.INTERIOR) return;

  const fc = await forecast(sensorId, alertRange);

  // Usa el nivel más urgente entre actual y predicho; si actual ya es no-GREEN, confía en él.
  const actionLevel = currentLevel !== AlertLevel.GREEN
    ? currentLevel
    : (fc?.predictedLevel ?? AlertLevel.GREEN);

  if (metric === Metric.HUMIDITY) {
    const pumps = await prisma.pump.findMany({
      where:  { nodeId, isActive: true },
      select: { id: true, hardwareId: true },
    });

    if (actionLevel === AlertLevel.YELLOW_LOW || actionLevel === AlertLevel.RED_LOW) {
      const reason = LEVEL_TO_REASON[actionLevel] ?? EventReason.YELLOW_LOW;
      await Promise.all(pumps.map(p => activatePump(p.id, p.hardwareId, reason)));
    } else if (actionLevel === AlertLevel.GREEN) {
      await Promise.all(pumps.map(p => deactivatePump(p.id, p.hardwareId)));
    }
  }

  if (metric === Metric.TEMPERATURE) {
    const fans = await prisma.fan.findMany({
      where:  { shedId, isActive: true },
      select: { id: true, hardwareId: true },
    });

    if (actionLevel === AlertLevel.YELLOW_HIGH || actionLevel === AlertLevel.RED_HIGH) {
      const reason = LEVEL_TO_REASON[actionLevel] ?? EventReason.YELLOW_HIGH;
      await Promise.all(fans.map(f => activateFan(f.id, f.hardwareId, reason)));
    } else if (actionLevel === AlertLevel.GREEN) {
      await Promise.all(fans.map(f => deactivateFan(f.id, f.hardwareId)));
    }
  }
}

// ─── Helpers privados ────────────────────────────────────────────────────────

async function activatePump(pumpId: string, hardwareId: string, reason: EventReason): Promise<void> {
  const running = await prisma.deviceEvent.findFirst({ where: { pumpId, endedAt: null } });
  if (running) return;

  await publishCommand(hardwareId, "on");
  await prisma.deviceEvent.create({
    data: {
      deviceHardwareId: hardwareId,
      deviceType:       DeviceType.PUMP,
      action:           DeviceAction.ON,
      reason,
      pumpId,
    },
  });
  console.info(`[ML] Bomba ${hardwareId} activada — ${reason}`);
}

async function deactivatePump(pumpId: string, hardwareId: string): Promise<void> {
  const running = await prisma.deviceEvent.findFirst({
    where:   { pumpId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!running) return;

  await publishCommand(hardwareId, "off");
  const duration = Math.round((Date.now() - running.startedAt.getTime()) / 1000);
  await prisma.deviceEvent.update({
    where: { id: running.id },
    data:  { endedAt: new Date(), durationSeconds: duration },
  });
  console.info(`[ML] Bomba ${hardwareId} desactivada — ${duration}s`);
}

async function activateFan(fanId: string, hardwareId: string, reason: EventReason): Promise<void> {
  const running = await prisma.deviceEvent.findFirst({ where: { fanId, endedAt: null } });
  if (running) return;

  await publishCommand(hardwareId, "on");
  await prisma.deviceEvent.create({
    data: {
      deviceHardwareId: hardwareId,
      deviceType:       DeviceType.FAN,
      action:           DeviceAction.ON,
      reason,
      fanId,
    },
  });
  console.info(`[ML] Ventilador ${hardwareId} activado — ${reason}`);
}

async function deactivateFan(fanId: string, hardwareId: string): Promise<void> {
  const running = await prisma.deviceEvent.findFirst({
    where:   { fanId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!running) return;

  await publishCommand(hardwareId, "off");
  const duration = Math.round((Date.now() - running.startedAt.getTime()) / 1000);
  await prisma.deviceEvent.update({
    where: { id: running.id },
    data:  { endedAt: new Date(), durationSeconds: duration },
  });
  console.info(`[ML] Ventilador ${hardwareId} desactivado — ${duration}s`);
}
