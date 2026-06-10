-- ============================================================
-- Refactor: un topic = un sensor = una métrica
-- ============================================================

-- 1. Añadir columna metric a nodes (nullable primero para datos existentes)
ALTER TABLE "nodes" ADD COLUMN "metric" "Metric";
UPDATE "nodes" SET "metric" = 'TEMPERATURE';
ALTER TABLE "nodes" ALTER COLUMN "metric" SET NOT NULL;

-- 2. Eliminar columnas de flags booleanos del modelo antiguo
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "hasTemperatureSensor";
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "hasHumiditySensor";
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "hasPump";

-- 3. Crear tabla pumps
CREATE TABLE "pumps" (
  "id"          TEXT          NOT NULL,
  "shedId"      TEXT          NOT NULL,
  "hardwareId"  TEXT          NOT NULL,
  "name"        TEXT          NOT NULL,
  "pumpNumber"  INTEGER       NOT NULL,
  "model"       TEXT,
  "isActive"    BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pumps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pumps_hardwareId_key" ON "pumps"("hardwareId");
ALTER TABLE "pumps"
  ADD CONSTRAINT "pumps_shedId_fkey"
  FOREIGN KEY ("shedId") REFERENCES "sheds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Actualizar device_events: quitar nodeId, añadir pumpId
ALTER TABLE "device_events" DROP CONSTRAINT IF EXISTS "device_events_nodeId_fkey";
ALTER TABLE "device_events" DROP COLUMN  IF EXISTS "nodeId";
ALTER TABLE "device_events" ADD  COLUMN  "pumpId" TEXT;
ALTER TABLE "device_events"
  ADD CONSTRAINT "device_events_pumpId_fkey"
  FOREIGN KEY ("pumpId") REFERENCES "pumps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
