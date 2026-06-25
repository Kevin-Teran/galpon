/**
 * @file route.ts
 * @route /src/app/api/users/[id]/activity/route.ts
 * @description GET /api/users/[id]/activity — trazabilidad del usuario.
 *              Super Admin: historial completo de audit_logs.
 *              Admin: resumen reducido (sesiones y último acceso).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { JwtPayload } from "@/authentication/infrastructure/JwtTokenService";

function orgWhere(p: JwtPayload) {
  if ((p.role as Role) === Role.SUPER_ADMIN) return {};
  return { organizationId: p.organizationId! };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload      = await requireRole(req, Role.ADMIN);
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const { id }       = await params;

    // Verify org ownership
    const target = await prisma.user.findFirst({
      where:  { id, ...orgWhere(payload) },
      select: { id: true, name: true },
    });
    if (!target) throw new NotFoundError("Usuario");

    // Active sessions (not expired, not closed)
    const activeSessions = await prisma.userSession.count({
      where: { userId: id, endedAt: null, expiresAt: { gt: new Date() } },
    });

    // Last session info
    const lastSession = await prisma.userSession.findFirst({
      where:   { userId: id },
      orderBy: { createdAt: "desc" },
      select:  { createdAt: true, ipAddress: true, endedAt: true, endReason: true },
    });

    // loginCount may be 0 if migration not yet applied to DB
    let loginCount = 0;
    try {
      const u = await prisma.user.findUnique({ where: { id }, select: { loginCount: true } });
      loginCount = u?.loginCount ?? 0;
    } catch { loginCount = 0; }

    // Full audit logs — only for Super Admin
    let recentLogs = null;
    if (isSuperAdmin) {
      try {
        recentLogs = await prisma.auditLog.findMany({
          where:   { userId: id },
          orderBy: { createdAt: "desc" },
          take:    25,
          select:  { action: true, ipAddress: true, userAgent: true, statusCode: true, createdAt: true, details: true },
        });
      } catch { recentLogs = []; }
    }

    return Response.json({
      loginCount,
      activeSessions,
      lastLogin:   lastSession?.createdAt    ?? null,
      lastIp:      lastSession?.ipAddress     ?? null,
      lastEndedAt: lastSession?.endedAt       ?? null,
      lastReason:  lastSession?.endReason     ?? null,
      recentLogs,
    });
  } catch (err) { return apiErrorResponse(err); }
}
