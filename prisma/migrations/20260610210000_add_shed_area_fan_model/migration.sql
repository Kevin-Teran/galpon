-- AlterTable: add area (m²) to sheds
ALTER TABLE "sheds" ADD COLUMN "area" DOUBLE PRECISION;

-- AlterTable: add model/description to fans
ALTER TABLE "fans" ADD COLUMN "model" TEXT;
