/**
 * @file route.ts
 * @route /src/app/api/sheds/[id]/route.ts
 * @description GET | PUT | DELETE /api/sheds/[id]
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
import { NotFoundError } from "@/shared/errors/NotFoundError";

const updateSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  location:    z.string().optional(),
  latitude:    z.number().optional(),
  longitude:   z.number().optional(),
  area:        z.number().positive().optional(),
  fanCount:    z.number().int().min(0).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.OPERATOR);
    const { id } = await params;
    const shed = await prisma.shed.findUnique({
      where: { id },
      include: {
        nodes:  { orderBy: { createdAt: "asc" } },
        pumps:  { orderBy: { pumpNumber: "asc" } },
        fans:   { orderBy: { fanNumber: "asc" } },
        organization: { select: { name: true, alertRanges: true } },
      },
    });
    if (!shed) throw new NotFoundError("Galpón");
    return Response.json(shed);
  } catch (err) { return apiErrorResponse(err); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.ADMIN);
    const { id } = await params;
    const body   = await req.json().catch(() => ({}));
    const data   = updateSchema.parse(body);
    const shed   = await prisma.shed.update({ where: { id }, data });
    return Response.json(shed);
  } catch (err) { return apiErrorResponse(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.ADMIN);
    const { id } = await params;
    await prisma.shed.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) { return apiErrorResponse(err); }
}
