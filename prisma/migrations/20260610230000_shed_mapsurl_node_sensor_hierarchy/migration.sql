-- ============================================================
-- Shed: quitar lat/lon/fanCount, agregar mapsUrl
-- Node: quitar hardwareId/metric (ahora es contenedor)
-- Sensor: nueva tabla (un topic = una métrica)
-- Measurement y Alert: nodeId → sensorId
-- ============================================================

-- 1. Actualizar sheds
ALTER TABLE "sheds" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "sheds" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "sheds" DROP COLUMN IF EXISTS "fanCount";
ALTER TABLE "sheds" ADD COLUMN IF NOT EXISTS "mapsUrl" TEXT;

-- 2. Limpiar measurements (FK y columnas antiguas)
ALTER TABLE "measurements" DROP CONSTRAINT IF EXISTS "measurements_nodeId_fkey";
DROP INDEX   IF EXISTS "measurements_nodeId_metric_timestamp_idx";
ALTER TABLE  "measurements" DROP COLUMN IF EXISTS "nodeId";

-- 3. Limpiar alerts (FK y columnas antiguas)
ALTER TABLE "alerts" DROP CONSTRAINT IF EXISTS "alerts_nodeId_fkey";
DROP INDEX   IF EXISTS "alerts_nodeId_createdAt_idx";
ALTER TABLE  "alerts" DROP COLUMN IF EXISTS "nodeId";

-- 4. Limpiar nodes (quitar hardwareId y metric)
DROP INDEX  IF EXISTS "nodes_hardwareId_key";
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "hardwareId";
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "metric";

-- 5. Crear tabla sensors
CREATE TABLE "sensors" (
  "id"          TEXT         NOT NULL,
  "nodeId"      TEXT         NOT NULL,
  "hardwareId"  TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "metric"      "Metric"     NOT NULL,
  "isActive"    BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sensors_hardwareId_key" ON "sensors"("hardwareId");
ALTER TABLE "sensors"
  ADD CONSTRAINT "sensors_nodeId_fkey"
  FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Agregar sensorId a measurements
ALTER TABLE "measurements" ADD COLUMN "sensorId" TEXT;
ALTER TABLE "measurements"
  ADD CONSTRAINT "measurements_sensorId_fkey"
  FOREIGN KEY ("sensorId") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "measurements_sensorId_metric_timestamp_idx"
  ON "measurements"("sensorId", "metric", "timestamp");

-- 7. Agregar sensorId a alerts
ALTER TABLE "alerts" ADD COLUMN "sensorId" TEXT;
ALTER TABLE "alerts"
  ADD CONSTRAINT "alerts_sensorId_fkey"
  FOREIGN KEY ("sensorId") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "alerts_sensorId_createdAt_idx"
  ON "alerts"("sensorId", "createdAt");
