/**
 * @file anomaly.ts
 * @route /src/ml/anomaly.ts
 * @description Detección de anomalías en mediciones de sensores usando Z-score.
 *              Una lectura se marca como anómala si se desvía más de Z_THRESHOLD
 *              desviaciones estándar respecto a la media de la ventana reciente.
 *              Con menos de MIN_SAMPLES mediciones históricas no se activa.
 */

import { prisma } from "@/shared/database/prisma.client";

const WINDOW      = 20;
const MIN_SAMPLES = 10;
const Z_THRESHOLD = 3.5;

export interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
}

export async function detectAnomaly(
  sensorId: string,
  value: number,
): Promise<AnomalyResult> {
  const recent = await prisma.measurement.findMany({
    where:   { sensorId },
    orderBy: { timestamp: "desc" },
    take:    WINDOW,
    select:  { value: true },
  });

  if (recent.length < MIN_SAMPLES) return { isAnomaly: false, zScore: 0 };

  const vals = recent.map(m => m.value);
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);

  if (std < 0.001) return { isAnomaly: false, zScore: 0 };

  const z = Math.abs((value - mean) / std);
  return { isAnomaly: z > Z_THRESHOLD, zScore: z };
}
