/**
 * @file route.ts
 * @route /src/app/api/fans/route.ts
 * @description GET /api/fans | POST — ventiladores del galpón (independientes de los nodos).
 * @author Kevin Mariano
 * @version 3.0.0
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
  fanNumber: z.number().int().min(1),
  model:     z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, Role.OPERATOR);
    const shedId = req.nextUrl.searchParams.get("shedId") ?? undefined;
    const fans   = await prisma.fan.findMany({
      where:   shedId ? { shedId } : {},
      include: { shed: { select: { name: true } } },
      orderBy: { fanNumber: "asc" },
    });
    return Response.json(fans);
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, Role.ADMIN);
    const body = await req.json().catch(() => ({}));
    const data = createSchema.parse(body);
    const fan  = await prisma.fan.create({ data });
    return Response.json(fan, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
