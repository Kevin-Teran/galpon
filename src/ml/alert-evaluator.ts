/**
 * @file alert-evaluator.ts
 * @route /src/ml/alert-evaluator.ts
 * @description Clasificación de valores en niveles de alerta y gestión automática
 *              de registros Alert en la base de datos.
 *
 *              Estructura de rangos (ascendente):
 *                value < yellowLowMin          → RED_LOW
 *                [yellowLowMin, greenMin)       → YELLOW_LOW
 *                [greenMin, greenMax]           → GREEN
 *                (greenMax, yellowHighMax]      → YELLOW_HIGH
 *                value > yellowHighMax          → RED_HIGH
 */

import { prisma } from "@/shared/database/prisma.client";
import { AlertLevel, Metric } from "@/generated/prisma";

export type AlertRange = {
  yellowLowMin:  number;
  greenMin:      number;
  greenMax:      number;
  yellowHighMax: number;
};

export function classifyLevel(value: number, range: AlertRange): AlertLevel {
  if (value < range.yellowLowMin)   return AlertLevel.RED_LOW;
  if (value < range.greenMin)       return AlertLevel.YELLOW_LOW;
  if (value <= range.greenMax)      return AlertLevel.GREEN;
  if (value <= range.yellowHighMax) return AlertLevel.YELLOW_HIGH;
  return AlertLevel.RED_HIGH;
}

/**
 * Evalúa el valor actual contra los rangos y sincroniza los registros Alert:
 * - GREEN → resuelve todas las alertas abiertas del sensor.
 * - non-GREEN + mismo nivel ya abierto → no hace nada.
 * - non-GREEN + nivel distinto → cierra las anteriores y abre una nueva.
 */
export async function evaluateAndAlert(
  sensorId: string,
  organizationId: string,
  metric: Metric,
  value: number,
  alertRange: AlertRange,
): Promise<AlertLevel> {
  const level = classifyLevel(value, alertRange);
  const now   = new Date();

  if (level === AlertLevel.GREEN) {
    await prisma.alert.updateMany({
      where: { sensorId, resolvedAt: null },
      data:  { resolvedAt: now },
    });
    return level;
  }

  const existing = await prisma.alert.findFirst({
    where: { sensorId, alertLevel: level, resolvedAt: null },
  });

  if (!existing) {
    await prisma.alert.updateMany({
      where: { sensorId, resolvedAt: null },
      data:  { resolvedAt: now },
    });
    await prisma.alert.create({
      data: { organizationId, sensorId, metric, alertLevel: level, value },
    });
  }

  return level;
}
