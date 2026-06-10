/**
 * @file metrics.ts
 * @route /src/shared/types/metrics.ts
 * @description Tipos de métricas monitoreadas en los galpones.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

export enum Metric {
  TEMPERATURE = "TEMPERATURE",
  HUMIDITY = "HUMIDITY",
}

export const METRIC_UNITS: Record<Metric, string> = {
  [Metric.TEMPERATURE]: "°C",
  [Metric.HUMIDITY]: "%",
};
