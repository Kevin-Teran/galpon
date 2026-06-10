/**
 * @file route.ts
 * @route /src/app/api/fans/[id]/route.ts
 * @description GET | PUT | DELETE /api/fans/[id]
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
  name:      z.string().min(2).max(100).optional(),
  fanNumber: z.number().int().min(1).optional(),
  isActive:  z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.OPERATOR);
    const { id } = await params;
    const fan = await prisma.fan.findUnique({ where: { id }, include: { shed: { select: { name: true } } } });
    if (!fan) throw new NotFoundError("Ventilador");
    return Response.json(fan);
  } catch (err) { return apiErrorResponse(err); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.ADMIN);
    const { id } = await params;
    const body   = await req.json().catch(() => ({}));
    const data   = updateSchema.parse(body);
    const fan    = await prisma.fan.update({ where: { id }, data });
    return Response.json(fan);
  } catch (err) { return apiErrorResponse(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.ADMIN);
    const { id } = await params;
    await prisma.fan.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) { return apiErrorResponse(err); }
}
