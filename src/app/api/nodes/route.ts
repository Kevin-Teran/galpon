/**
 * @file route.ts
 * @route /src/app/api/nodes/route.ts
 * @description GET /api/nodes | POST — sensores (un topic = una métrica).
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";

const createSchema = z.object({
  shedId:    z.string().min(1),
  hardwareId: z.string().min(1).max(100),
  name:      z.string().min(2).max(100),
  type:      z.enum(["INTERIOR", "EXTERIOR"]),
  metric:    z.enum(["TEMPERATURE", "HUMIDITY"]),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, Role.OPERATOR);
    const shedId = req.nextUrl.searchParams.get("shedId") ?? undefined;
    const nodes  = await prisma.node.findMany({
      where:   shedId ? { shedId } : {},
      include: { shed: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(nodes);
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, Role.ADMIN);
    const body = await req.json().catch(() => ({}));
    const data = createSchema.parse(body);
    const node = await prisma.node.create({ data });
    return Response.json(node, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
