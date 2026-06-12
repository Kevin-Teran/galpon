-- ============================================================
-- 1. Crear enum SensorSide (INTERIOR | EXTERIOR)
-- 2. Agregar side a sensors (cara del bloque)
-- 3. Quitar type de nodes (ya no es INTERIOR|EXTERIOR el nodo)
-- 4. Ventiladores vuelven al galpón (shedId) y salen del nodo
-- 5. Limpiar seed data para re-sembrar con nueva estructura
-- ============================================================

-- 1. Crear enum SensorSide
DO $$ BEGIN
  CREATE TYPE "SensorSide" AS ENUM ('INTERIOR', 'EXTERIOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Limpiar datos de seed (se re-crean con prisma db seed)
DELETE FROM "measurements";
DELETE FROM "alerts";
DELETE FROM "device_events";
DELETE FROM "sensors";
DELETE FROM "pumps";
DELETE FROM "fans";
DELETE FROM "nodes";

-- 3. Agregar columna side a sensors
ALTER TABLE "sensors" ADD COLUMN IF NOT EXISTS "side" "SensorSide" NOT NULL DEFAULT 'INTERIOR';
ALTER TABLE "sensors" ALTER COLUMN "side" DROP DEFAULT;

-- 4. Quitar type de nodes
ALTER TABLE "nodes" DROP COLUMN IF EXISTS "type";

-- 5. Fans: nodeId → shedId
ALTER TABLE "fans" DROP CONSTRAINT IF EXISTS "fans_nodeId_fkey";
ALTER TABLE "fans" DROP COLUMN IF EXISTS "nodeId";
ALTER TABLE "fans" ADD COLUMN "shedId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "fans" ALTER COLUMN "shedId" DROP DEFAULT;
ALTER TABLE "fans"
  ADD CONSTRAINT "fans_shedId_fkey"
  FOREIGN KEY ("shedId") REFERENCES "sheds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Quitar enum NodeType si ya no está referenciado en ninguna tabla
-- (lo dejamos — puede usarse en futuras migraciones o reportes)
