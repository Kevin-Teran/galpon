/**
 * @file route.ts
 * @route GET /api/organizations/[id]/summary
 * @description Resumen de actividad de una organización: conteos + sesiones activas + audit trail.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";
import { NotFoundError } from "@/shared/errors/NotFoundError";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.SUPER_ADMIN);
    const { id } = await params;

    const org = await prisma.organization.findUnique({
      where:  { id },
      select: { id: true },
    });
    if (!org) throw new NotFoundError("Organización");

    // Users in this org
    const users = await prisma.user.findMany({
      where:  { organizationId: id },
      select: { id: true },
    });
    const userIds = users.map(u => u.id);

    // Active sessions across org users
    const activeSessionCount = await prisma.userSession.count({
      where: { userId: { in: userIds }, endedAt: null, expiresAt: { gt: new Date() } },
    });

    // Open alerts
    let openAlertCount = 0;
    try {
      openAlertCount = await prisma.alert.count({ where: { organizationId: id, resolvedAt: null } });
    } catch { openAlertCount = 0; }

    // Recent audit logs for this org's users (SA only)
    let recentLogs: { action: string; ipAddress: string | null; statusCode: number | null; createdAt: Date; user: { name: string } | null }[] | null = null;
    try {
      recentLogs = await prisma.auditLog.findMany({
        where:   { organizationId: id },
        orderBy: { createdAt: "desc" },
        take:    20,
        select:  {
          action: true, ipAddress: true, statusCode: true, createdAt: true,
          user:   { select: { name: true } },
        },
      });
    } catch { recentLogs = []; }

    return Response.json({ activeSessionCount, openAlertCount, recentLogs });
  } catch (err) { return apiErrorResponse(err); }
}
