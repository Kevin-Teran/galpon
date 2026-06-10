/**
 * @file prisma.client.ts
 * @route /src/shared/database/prisma.client.ts
 * @description Singleton del cliente Prisma para toda la aplicación.
 *              Prisma 7 usa engine type "client" (Wasm) que requiere un adapter de DB.
 *              Se usa @prisma/adapter-pg con el driver nativo de PostgreSQL.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 * @copyright Galpon
 */

import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada en las variables de entorno");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
