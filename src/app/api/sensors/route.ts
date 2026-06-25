/**
 * @file route.ts
 * @route /src/app/api/sensors/route.ts
 * @description GET /api/sensors | POST — sensores de un nodo (un topic = una métrica).
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";

const createSchema = z.object({
  nodeId:     z.string().min(1),
  hardwareId: z.string().min(1).max(100),
  name:       z.string().min(2).max(100),
  metric:     z.enum(["TEMPERATURE", "HUMIDITY"]),
  side:       z.enum(["INTERIOR", "EXTERIOR"]),
});

export async function GET(req: NextRequest) {
  try {
    const payload    = await requireRole(req, Role.OPERATOR);
    const nodeId     = req.nextUrl.searchParams.get("nodeId") ?? undefined;
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const orgFilter  = !isSuperAdmin && payload.organizationId
      ? { node: { shed: { organizationId: payload.organizationId } } }
      : {};

    const sensors = await prisma.sensor.findMany({
      where:   { ...(nodeId ? { nodeId } : {}), ...orgFilter },
      include: { node: { select: { name: true, shed: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(sensors);
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const body    = await req.json().catch(() => ({}));
    const data    = createSchema.parse(body);

    if ((payload.role as Role) !== Role.SUPER_ADMIN) {
      const node = await prisma.node.findFirst({
        where: { id: data.nodeId, shed: { organizationId: payload.organizationId! } },
        select: { id: true },
      });
      if (!node) return Response.json({ error: "Sin acceso a este nodo" }, { status: 403 });
    }

    const sensor = await prisma.sensor.create({ data });
    return Response.json(sensor, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
