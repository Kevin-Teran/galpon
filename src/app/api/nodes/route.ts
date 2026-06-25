/**
 * @file route.ts
 * @route /src/app/api/nodes/route.ts
 * @description GET /api/nodes | POST — nodos físicos de un galpón (contenedores de sensores).
 * @author Kevin Mariano
 * @version 3.1.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";

const createSchema = z.object({
  shedId: z.string().min(1),
  name:   z.string().min(2).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.OPERATOR);
    const shedId  = req.nextUrl.searchParams.get("shedId") ?? undefined;
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const orgFilter = !isSuperAdmin && payload.organizationId
      ? { shed: { organizationId: payload.organizationId } }
      : {};

    const nodes = await prisma.node.findMany({
      where:   { ...(shedId ? { shedId } : {}), ...orgFilter },
      include: {
        shed:    { select: { name: true } },
        sensors: { orderBy: { createdAt: "asc" } },
        pumps:   { orderBy: { pumpNumber: "asc" } },
        _count:  { select: { sensors: true, pumps: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(nodes);
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const body    = await req.json().catch(() => ({}));
    const data    = createSchema.parse(body);

    if ((payload.role as Role) !== Role.SUPER_ADMIN) {
      const shed = await prisma.shed.findFirst({
        where: { id: data.shedId, organizationId: payload.organizationId! },
        select: { id: true },
      });
      if (!shed) return Response.json({ error: "Sin acceso a este galpón" }, { status: 403 });
    }

    const node = await prisma.node.create({
      data,
      include: { _count: { select: { sensors: true, pumps: true } } },
    });
    return Response.json(node, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
