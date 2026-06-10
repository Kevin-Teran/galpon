/**
 * @file route.ts
 * @route /src/app/api/alerts/route.ts
 * @description GET /api/alerts — listar alertas con filtros.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.OPERATOR);
    const sp      = req.nextUrl.searchParams;
    const onlyOpen = sp.get("open") === "true";

    const alerts = await prisma.alert.findMany({
      where: {
        ...(payload.role !== Role.SUPER_ADMIN && { organizationId: payload.organizationId! }),
        ...(onlyOpen && { resolvedAt: null }),
      },
      include: { node: { select: { name: true, hardwareId: true, shed: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json(alerts);
  } catch (err) { return apiErrorResponse(err); }
}
