/**
 * @file route.ts
 * @route /src/app/api/sheds/route.ts
 * @description GET /api/sheds | POST — listar y crear galpones.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";

const createSchema = z.object({
  organizationId: z.string(),
  name:           z.string().min(2).max(100),
  description:    z.string().optional(),
  location:       z.string().optional(),
  latitude:       z.number().optional(),
  longitude:      z.number().optional(),
  area:           z.number().positive().optional(),
  fanCount:       z.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.OPERATOR);
    const orgId   = payload.role === Role.SUPER_ADMIN
      ? req.nextUrl.searchParams.get("organizationId") ?? undefined
      : payload.organizationId!;

    const sheds = await prisma.shed.findMany({
      where:   orgId ? { organizationId: orgId } : {},
      include: { _count: { select: { nodes: true, fans: true } }, organization: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(sheds);
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const body    = await req.json().catch(() => ({}));
    const data    = createSchema.parse(body);

    if (payload.role !== Role.SUPER_ADMIN && payload.organizationId !== data.organizationId)
      return Response.json({ error: "Sin acceso a esta organización" }, { status: 403 });

    const shed = await prisma.shed.create({ data });
    return Response.json(shed, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
