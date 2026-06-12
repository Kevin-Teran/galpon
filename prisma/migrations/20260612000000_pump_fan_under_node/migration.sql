-- ============================================================
-- Pump y Fan pasan de Shed → Node
-- Los datos de seed se borran para re-sembrar con la nueva FK
-- ============================================================

-- 1. Limpiar eventos y datos de seed (FK cascade no aplica en todos los engines)
DELETE FROM "device_events" WHERE "pumpId" IS NOT NULL OR "fanId" IS NOT NULL;
DELETE FROM "pumps";
DELETE FROM "fans";

-- 2. Pumps: shedId → nodeId
ALTER TABLE "pumps" DROP CONSTRAINT IF EXISTS "pumps_shedId_fkey";
ALTER TABLE "pumps" DROP COLUMN IF EXISTS "shedId";
ALTER TABLE "pumps" ADD COLUMN "nodeId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "pumps" ALTER COLUMN "nodeId" DROP DEFAULT;
ALTER TABLE "pumps"
  ADD CONSTRAINT "pumps_nodeId_fkey"
  FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Fans: shedId → nodeId
ALTER TABLE "fans" DROP CONSTRAINT IF EXISTS "fans_shedId_fkey";
ALTER TABLE "fans" DROP COLUMN IF EXISTS "shedId";
ALTER TABLE "fans" ADD COLUMN "nodeId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "fans" ALTER COLUMN "nodeId" DROP DEFAULT;
ALTER TABLE "fans"
  ADD CONSTRAINT "fans_nodeId_fkey"
  FOREIGN KEY ("nodeId") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
