/**
 * @file route.ts
 * @route /src/app/api/pumps/[id]/route.ts
 * @description GET | PUT | DELETE /api/pumps/[id]
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
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { JwtPayload } from "@/authentication/infrastructure/JwtTokenService";

const updateSchema = z.object({
  name:       z.string().min(2).max(100).optional(),
  hardwareId: z.string().min(1).max(100).optional(),
  pumpNumber: z.number().int().min(1).optional(),
  model:      z.string().max(100).optional(),
  isActive:   z.boolean().optional(),
});

function orgWhere(p: JwtPayload) {
  if ((p.role as Role) === Role.SUPER_ADMIN || !p.organizationId) return {};
  return { node: { shed: { organizationId: p.organizationId } } };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRole(req, Role.OPERATOR);
    const { id }  = await params;
    const pump    = await prisma.pump.findFirst({
      where:   { id, ...orgWhere(payload) },
      include: { node: { select: { name: true } } },
    });
    if (!pump) throw new NotFoundError("Bomba");
    return Response.json(pump);
  } catch (err) { return apiErrorResponse(err); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const { id }  = await params;
    const body    = await req.json().catch(() => ({}));
    const data    = updateSchema.parse(body);

    const exists = await prisma.pump.findFirst({ where: { id, ...orgWhere(payload) }, select: { id: true } });
    if (!exists) throw new NotFoundError("Bomba");

    const pump = await prisma.pump.update({ where: { id }, data });
    return Response.json(pump);
  } catch (err) { return apiErrorResponse(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const { id }  = await params;

    const exists = await prisma.pump.findFirst({ where: { id, ...orgWhere(payload) }, select: { id: true } });
    if (!exists) throw new NotFoundError("Bomba");

    await prisma.pump.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) { return apiErrorResponse(err); }
}
