/**
 * @file route.ts
 * @route /src/app/api/alerts/[id]/route.ts
 * @description PUT /api/alerts/[id] — resolver alerta.
 * @author Kevin Mariano
 * @version 1.1.0
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
  if ((p.role as Role) === Role.SUPER_ADMIN || !p.organizationId) return {};
  return { organizationId: p.organizationId };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRole(req, Role.OPERATOR);
    const { id }  = await params;

    const exists = await prisma.alert.findFirst({ where: { id, ...orgWhere(payload) }, select: { id: true } });
    if (!exists) throw new NotFoundError("Alerta");

    const alert = await prisma.alert.update({
      where: { id },
      data:  { resolvedAt: new Date() },
    });
    return Response.json(alert);
  } catch (err) { return apiErrorResponse(err); }
}
