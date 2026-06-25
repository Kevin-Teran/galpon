/**
 * @file audit.ts
 * @route /src/shared/audit/audit.ts
 * @description Helper para registrar eventos de auditoría en la base de datos.
 *              Los errores de logging nunca interrumpen el flujo principal.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { prisma } from "@/shared/database/prisma.client";
import { NextRequest } from "next/server";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_COMPLETE"
  | "TOKEN_INVALID"
  | "THEME_CHANGED";

export interface AuditEntry {
  action:         AuditAction;
  userId?:        string;
  organizationId?: string;
  ipAddress?:     string;
  userAgent?:     string;
  statusCode?:    number;
  details?:       Record<string, unknown>;
}

/** Extrae la IP real del cliente respetando proxies comunes. */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Extrae el User-Agent del cliente. */
export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") ?? "unknown";
}

/** Registra un evento en audit_logs. Nunca lanza — los errores se logean en consola. */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action:         entry.action,
        userId:         entry.userId         ?? null,
        organizationId: entry.organizationId ?? null,
        ipAddress:      entry.ipAddress      ?? null,
        userAgent:      entry.userAgent      ?? null,
        statusCode:     entry.statusCode     ?? null,
        // JSON.parse/stringify strips unknown types → compatible with Prisma's InputJsonValue
        details:        entry.details !== undefined
          ? JSON.parse(JSON.stringify(entry.details))
          : undefined,
      },
    });
  } catch (err) {
    console.error("[AUDIT] Error al registrar evento:", err);
  }
}
