/**
 * @file seed.ts
 * @route /prisma/seed.ts
 * @description Seed inicial. Jerarquía real del galpón:
 *              Galpón → Nodo (bloque) → {4 Sensores + Bomba}
 *              Galpón → Ventiladores (independientes del nodo)
 *
 *              Cada nodo representa un bloque físico del galpón.
 *              Tiene 4 sensores: temp/hum × cara exterior + cara interior del bloque.
 *              La bomba riega ese bloque para humidificar el interior.
 *              Los ventiladores pertenecen al galpón y se activan si la humidificación no basta.
 * @author Kevin Mariano
 * @version 4.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

const ORG_ID    = "org-galpon-demo";
const SHED_ID   = "shed-galpon-01";
const NODE_1_ID = "node-bloque-1";
const NODE_2_ID = "node-bloque-2";

async function main(): Promise<void> {
  console.log("🌱 Iniciando seed...\n");

  // ── 1. Super Administrador ──────────────────────────────────────────────────
  const superAdminHash = await bcrypt.hash("Admin123456!", 12);
  await prisma.user.upsert({
    where:  { email: "admin@galpon.app" },
    update: {},
    create: { email: "admin@galpon.app", passwordHash: superAdminHash, name: "Super Administrador", role: "SUPER_ADMIN", organizationId: null },
  });
  console.log("  ✅ SUPER_ADMIN  →  admin@galpon.app  /  Admin123456!");

  // ── 2. Organización demo ────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where:  { id: ORG_ID },
    update: {},
    create: { id: ORG_ID, name: "Finca Demo" },
  });
  console.log(`  ✅ Organización →  ${org.name}  (id: ${org.id})`);

  // ── 3. Admin ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin123456!", 12);
  await prisma.user.upsert({
    where:  { email: "admin@finca.com" },
    update: {},
    create: { email: "admin@finca.com", passwordHash: adminHash, name: "Administrador Finca", role: "ADMIN", organizationId: org.id },
  });
  console.log("  ✅ ADMIN        →  admin@finca.com   /  Admin123456!");

  // ── 4. Operador ──────────────────────────────────────────────────────────────
  const operatorHash = await bcrypt.hash("Operador123!", 12);
  await prisma.user.upsert({
    where:  { email: "operador@finca.com" },
    update: {},
    create: { email: "operador@finca.com", passwordHash: operatorHash, name: "Operador Finca", role: "OPERATOR", organizationId: org.id },
  });
  console.log("  ✅ OPERATOR     →  operador@finca.com /  Operador123!");

  // ── 5. Rangos de alerta ──────────────────────────────────────────────────────
  await prisma.alertRange.upsert({
    where:  { organizationId_metric: { organizationId: org.id, metric: "TEMPERATURE" } },
    update: {},
    create: { organizationId: org.id, metric: "TEMPERATURE", yellowLowMin: 16, greenMin: 20, greenMax: 32, yellowHighMax: 38 },
  });
  await prisma.alertRange.upsert({
    where:  { organizationId_metric: { organizationId: org.id, metric: "HUMIDITY" } },
    update: {},
    create: { organizationId: org.id, metric: "HUMIDITY", yellowLowMin: 35, greenMin: 50, greenMax: 75, yellowHighMax: 85 },
  });
  console.log("  ✅ Rangos de alerta (Temperatura + Humedad)");

  // ── 6. Galpón demo ───────────────────────────────────────────────────────────
  const shed = await prisma.shed.upsert({
    where:  { id: SHED_ID },
    update: {},
    create: {
      id: SHED_ID, organizationId: org.id, name: "Galpón 1",
      description: "Galpón principal de demostración",
      location: "Sede Principal — Bloque A",
      mapsUrl: "https://maps.app.goo.gl/VF2pfvuKChp9Apt67",
      area: 500,
    },
  });
  console.log(`  ✅ Galpón       →  ${shed.name}  (id: ${shed.id})`);

  // ── 7. Nodos — bloques físicos con sensores y bomba ──────────────────────────
  //
  //  Cada nodo = un bloque del galpón.
  //  El nodo está embebido en el bloque y tiene sensores en ambas caras:
  //    - Cara EXTERIOR: mide temperatura y humedad del ambiente externo
  //    - Cara INTERIOR: mide temperatura y humedad dentro del galpón
  //  La bomba riega ese bloque para humidificar el interior.

  const node1 = await prisma.node.upsert({
    where:  { id: NODE_1_ID },
    update: {},
    create: { id: NODE_1_ID, shedId: shed.id, name: "Bloque 1", isActive: true },
  });
  const node2 = await prisma.node.upsert({
    where:  { id: NODE_2_ID },
    update: {},
    create: { id: NODE_2_ID, shedId: shed.id, name: "Bloque 2", isActive: true },
  });
  console.log("  ✅ Nodos/Bloques →  Bloque 1, Bloque 2");

  // ── 8. Sensores — 4 por bloque (un topic = una métrica = un lado) ────────────

  // Bloque 1 — cara exterior
  await prisma.sensor.upsert({
    where:  { hardwareId: "B1-TEMP-EXT" },
    update: { side: "EXTERIOR", metric: "TEMPERATURE", name: "Temp. Exterior B1" },
    create: { nodeId: node1.id, hardwareId: "B1-TEMP-EXT", name: "Temp. Exterior B1", metric: "TEMPERATURE", side: "EXTERIOR", isActive: true },
  });
  await prisma.sensor.upsert({
    where:  { hardwareId: "B1-HUM-EXT" },
    update: { side: "EXTERIOR", metric: "HUMIDITY", name: "Hum. Exterior B1" },
    create: { nodeId: node1.id, hardwareId: "B1-HUM-EXT",  name: "Hum. Exterior B1",  metric: "HUMIDITY",    side: "EXTERIOR", isActive: true },
  });
  // Bloque 1 — cara interior
  await prisma.sensor.upsert({
    where:  { hardwareId: "B1-TEMP-INT" },
    update: { side: "INTERIOR", metric: "TEMPERATURE", name: "Temp. Interior B1" },
    create: { nodeId: node1.id, hardwareId: "B1-TEMP-INT", name: "Temp. Interior B1", metric: "TEMPERATURE", side: "INTERIOR", isActive: true },
  });
  await prisma.sensor.upsert({
    where:  { hardwareId: "B1-HUM-INT" },
    update: { side: "INTERIOR", metric: "HUMIDITY", name: "Hum. Interior B1" },
    create: { nodeId: node1.id, hardwareId: "B1-HUM-INT",  name: "Hum. Interior B1",  metric: "HUMIDITY",    side: "INTERIOR", isActive: true },
  });

  // Bloque 2 — cara exterior
  await prisma.sensor.upsert({
    where:  { hardwareId: "B2-TEMP-EXT" },
    update: { side: "EXTERIOR", metric: "TEMPERATURE", name: "Temp. Exterior B2" },
    create: { nodeId: node2.id, hardwareId: "B2-TEMP-EXT", name: "Temp. Exterior B2", metric: "TEMPERATURE", side: "EXTERIOR", isActive: true },
  });
  await prisma.sensor.upsert({
    where:  { hardwareId: "B2-HUM-EXT" },
    update: { side: "EXTERIOR", metric: "HUMIDITY", name: "Hum. Exterior B2" },
    create: { nodeId: node2.id, hardwareId: "B2-HUM-EXT",  name: "Hum. Exterior B2",  metric: "HUMIDITY",    side: "EXTERIOR", isActive: true },
  });
  // Bloque 2 — cara interior
  await prisma.sensor.upsert({
    where:  { hardwareId: "B2-TEMP-INT" },
    update: { side: "INTERIOR", metric: "TEMPERATURE", name: "Temp. Interior B2" },
    create: { nodeId: node2.id, hardwareId: "B2-TEMP-INT", name: "Temp. Interior B2", metric: "TEMPERATURE", side: "INTERIOR", isActive: true },
  });
  await prisma.sensor.upsert({
    where:  { hardwareId: "B2-HUM-INT" },
    update: { side: "INTERIOR", metric: "HUMIDITY", name: "Hum. Interior B2" },
    create: { nodeId: node2.id, hardwareId: "B2-HUM-INT",  name: "Hum. Interior B2",  metric: "HUMIDITY",    side: "INTERIOR", isActive: true },
  });
  console.log("  ✅ Sensores     →  4 por bloque (ext/int × temp/hum)");

  // ── 9. Bombas — una por bloque, riega ese bloque ─────────────────────────────
  await prisma.pump.upsert({
    where:  { hardwareId: "PUMP-B1" },
    update: {},
    create: { nodeId: node1.id, hardwareId: "PUMP-B1", name: "Bomba Bloque 1", pumpNumber: 1, isActive: true },
  });
  await prisma.pump.upsert({
    where:  { hardwareId: "PUMP-B2" },
    update: {},
    create: { nodeId: node2.id, hardwareId: "PUMP-B2", name: "Bomba Bloque 2", pumpNumber: 2, isActive: true },
  });
  console.log("  ✅ Bombas       →  PUMP-B1 (Bloque 1), PUMP-B2 (Bloque 2)");

  // ── 10. Ventiladores — del galpón, se activan si la humidificación no basta ──
  await prisma.fan.upsert({
    where:  { hardwareId: "FAN-001" },
    update: {},
    create: { shedId: shed.id, hardwareId: "FAN-001", name: "Ventilador 1", fanNumber: 1, isActive: true },
  });
  await prisma.fan.upsert({
    where:  { hardwareId: "FAN-002" },
    update: {},
    create: { shedId: shed.id, hardwareId: "FAN-002", name: "Ventilador 2", fanNumber: 2, isActive: true },
  });
  console.log("  ✅ Ventiladores →  FAN-001, FAN-002 (del galpón)");

  console.log("\n────────────────────────────────────────────────");
  console.log("  CREDENCIALES DE ACCESO");
  console.log("────────────────────────────────────────────────");
  console.log("  SUPER_ADMIN    admin@galpon.app        Admin123456!");
  console.log("  ADMIN          admin@finca.com         Admin123456!");
  console.log("  OPERATOR       operador@finca.com      Operador123!");
  console.log("────────────────────────────────────────────────");
  console.log("\n✅ Seed completado exitosamente.\n");
}

main()
  .catch((e) => { console.error("❌ Error en seed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
