/**
 * @file seed.ts
 * @route /prisma/seed.ts
 * @description Seed inicial de la base de datos Galpon.
 *              Arquitectura: un topic MQTT = un sensor = una sola métrica.
 *              Sensores, bombas y ventiladores son entidades independientes.
 *              Es idempotente — se puede ejecutar múltiples veces sin duplicar datos.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ORG_ID  = "org-galpon-demo";
const SHED_ID = "shed-galpon-01";

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

  // ── 3. Admin de la organización ─────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin123456!", 12);
  await prisma.user.upsert({
    where:  { email: "admin@finca.com" },
    update: {},
    create: { email: "admin@finca.com", passwordHash: adminHash, name: "Administrador Finca", role: "ADMIN", organizationId: org.id },
  });
  console.log("  ✅ ADMIN        →  admin@finca.com   /  Admin123456!");

  // ── 4. Operador ─────────────────────────────────────────────────────────────
  const operatorHash = await bcrypt.hash("Operador123!", 12);
  await prisma.user.upsert({
    where:  { email: "operador@finca.com" },
    update: {},
    create: { email: "operador@finca.com", passwordHash: operatorHash, name: "Operador Finca", role: "OPERATOR", organizationId: org.id },
  });
  console.log("  ✅ OPERATOR     →  operador@finca.com /  Operador123!");

  // ── 5. Rangos de alerta ─────────────────────────────────────────────────────
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

  // ── 6. Galpón demo ──────────────────────────────────────────────────────────
  const shed = await prisma.shed.upsert({
    where:  { id: SHED_ID },
    update: {},
    create: {
      id: SHED_ID, organizationId: org.id, name: "Galpón 1",
      description: "Galpón principal de demostración",
      location: "Sede Principal — Bloque A",
      latitude: 10.391049, longitude: -75.479426, area: 500, fanCount: 2,
    },
  });
  console.log(`  ✅ Galpón       →  ${shed.name}  (id: ${shed.id})`);

  // ── 7. Sensores — un topic = una sola métrica ───────────────────────────────
  // Sensores de temperatura interiores
  await prisma.node.upsert({
    where:  { hardwareId: "TEMP-INT-001" },
    update: {},
    create: { shedId: shed.id, hardwareId: "TEMP-INT-001", name: "Temp. Interior 1", type: "INTERIOR", metric: "TEMPERATURE", isActive: true },
  });
  await prisma.node.upsert({
    where:  { hardwareId: "TEMP-INT-002" },
    update: {},
    create: { shedId: shed.id, hardwareId: "TEMP-INT-002", name: "Temp. Interior 2", type: "INTERIOR", metric: "TEMPERATURE", isActive: true },
  });

  // Sensores de humedad interiores
  await prisma.node.upsert({
    where:  { hardwareId: "HUM-INT-001" },
    update: {},
    create: { shedId: shed.id, hardwareId: "HUM-INT-001", name: "Hum. Interior 1", type: "INTERIOR", metric: "HUMIDITY", isActive: true },
  });
  await prisma.node.upsert({
    where:  { hardwareId: "HUM-INT-002" },
    update: {},
    create: { shedId: shed.id, hardwareId: "HUM-INT-002", name: "Hum. Interior 2", type: "INTERIOR", metric: "HUMIDITY", isActive: true },
  });

  // Sensores exteriores (referencia ambiental)
  await prisma.node.upsert({
    where:  { hardwareId: "TEMP-EXT-001" },
    update: {},
    create: { shedId: shed.id, hardwareId: "TEMP-EXT-001", name: "Temp. Exterior", type: "EXTERIOR", metric: "TEMPERATURE", isActive: true },
  });
  await prisma.node.upsert({
    where:  { hardwareId: "HUM-EXT-001" },
    update: {},
    create: { shedId: shed.id, hardwareId: "HUM-EXT-001", name: "Hum. Exterior", type: "EXTERIOR", metric: "HUMIDITY", isActive: true },
  });
  console.log("  ✅ Sensores     →  TEMP-INT-001/002, HUM-INT-001/002, TEMP-EXT-001, HUM-EXT-001");

  // ── 8. Bombas — topic independiente, solo recibe on/off ─────────────────────
  await prisma.pump.upsert({
    where:  { hardwareId: "PUMP-001" },
    update: {},
    create: { shedId: shed.id, hardwareId: "PUMP-001", name: "Bomba 1", pumpNumber: 1, isActive: true },
  });
  await prisma.pump.upsert({
    where:  { hardwareId: "PUMP-002" },
    update: {},
    create: { shedId: shed.id, hardwareId: "PUMP-002", name: "Bomba 2", pumpNumber: 2, isActive: true },
  });
  console.log("  ✅ Bombas       →  PUMP-001, PUMP-002");

  // ── 9. Ventiladores — topic independiente, solo recibe on/off ───────────────
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
  console.log("  ✅ Ventiladores →  FAN-001, FAN-002");

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
