/**
 * @file forecasting.ts
 * @route /src/ml/forecasting.ts
 * @description Predicción de valores futuros de sensores usando EWMA
 *              (Exponential Weighted Moving Average) con estimación de tendencia
 *              por regresión lineal sobre la cola de la serie suavizada.
 *
 *              Parámetros clave:
 *                ALPHA = 0.3  — factor de suavizado (mayor = más reactivo)
 *                HORIZON = 15 — minutos adelante a predecir
 */

import { prisma } from "@/shared/database/prisma.client";
import { AlertLevel } from "@/generated/prisma";
import { type AlertRange, classifyLevel } from "./alert-evaluator";

const ALPHA           = 0.3;
const WINDOW          = 15;
const MIN_SAMPLES     = 5;
const SLOPE_TAIL      = 5;
const TREND_THRESHOLD = 0.05; // unidades por minuto para considerar tendencia

export interface ForecastResult {
  predictedValue: number;
  trend: "rising" | "falling" | "stable";
  predictedLevel: AlertLevel;
}

export async function forecast(
  sensorId: string,
  alertRange: AlertRange,
  horizonMinutes = 15,
): Promise<ForecastResult | null> {
  const recent = await prisma.measurement.findMany({
    where:   { sensorId },
    orderBy: { timestamp: "desc" },
    take:    WINDOW,
    select:  { value: true, timestamp: true },
  });

  if (recent.length < MIN_SAMPLES) return null;

  const ordered = [...recent].reverse(); // de más antiguo a más reciente
  const vals    = ordered.map(m => m.value);
  const times   = ordered.map(m => m.timestamp.getTime());

  // EWMA
  const ewma: number[] = [vals[0]];
  for (let i = 1; i < vals.length; i++)
    ewma.push(ALPHA * vals[i] + (1 - ALPHA) * ewma[i - 1]);

  // pendiente por regresión lineal sobre la cola del EWMA
  const tail = ewma.slice(-SLOPE_TAIL);
  const n    = tail.length;
  const xMu  = (n - 1) / 2;
  const yMu  = tail.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMu) * (tail[i] - yMu);
    den += (i - xMu) ** 2;
  }
  const slopePerInterval = den > 0 ? num / den : 0;

  // convertir pendiente de "por intervalo" a "por minuto"
  const avgIntervalMs  = times.length > 1
    ? (times[times.length - 1] - times[0]) / (times.length - 1)
    : 60_000;
  const slopePerMinute = avgIntervalMs > 0
    ? slopePerInterval / (avgIntervalMs / 60_000)
    : 0;

  const predicted = ewma[ewma.length - 1] + slopePerMinute * horizonMinutes;

  const trend: ForecastResult["trend"] =
    slopePerMinute >  TREND_THRESHOLD ? "rising"  :
    slopePerMinute < -TREND_THRESHOLD ? "falling" : "stable";

  return {
    predictedValue: predicted,
    trend,
    predictedLevel: classifyLevel(predicted, alertRange),
  };
}
