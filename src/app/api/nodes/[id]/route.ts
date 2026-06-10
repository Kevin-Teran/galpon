/**
 * @file route.ts
 * @route /src/app/api/nodes/[id]/route.ts
 * @description GET | PUT | DELETE /api/nodes/[id]
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
  name:     z.string().min(2).max(100).optional(),
  type:     z.enum(["INTERIOR", "EXTERIOR"]).optional(),
  metric:   z.enum(["TEMPERATURE", "HUMIDITY"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.OPERATOR);
    const { id } = await params;
    const node = await prisma.node.findUnique({
      where: { id },
      include: {
        measurements: { orderBy: { timestamp: "desc" }, take: 20 },
        shed: { select: { name: true } },
      },
    });
    if (!node) throw new NotFoundError("Nodo");
    return Response.json(node);
  } catch (err) { return apiErrorResponse(err); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.ADMIN);
    const { id } = await params;
    const body   = await req.json().catch(() => ({}));
    const data   = updateSchema.parse(body);
    const node   = await prisma.node.update({ where: { id }, data });
    return Response.json(node);
  } catch (err) { return apiErrorResponse(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.ADMIN);
    const { id } = await params;
    await prisma.node.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) { return apiErrorResponse(err); }
}
