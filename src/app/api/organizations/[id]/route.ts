/**
 * @file route.ts
 * @route /src/app/api/organizations/[id]/route.ts
 * @description GET | PUT | DELETE /api/organizations/[id]
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
  name:        z.string().min(2).max(100),
  description: z.string().max(300).optional().nullable(),
  location:    z.string().max(150).optional().nullable(),
  phone:       z.string().max(30).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.ADMIN);
    const { id } = await params;
    try {
      const org = await prisma.organization.findUnique({
        where: { id },
        select: { id: true, name: true, description: true, location: true, phone: true, createdAt: true, _count: { select: { sheds: true, users: true } } },
      });
      if (!org) throw new NotFoundError("Organización");
      return Response.json(org);
    } catch (inner) {
      if ((inner as { name?: string }).name === "NotFoundError") throw inner;
      const org = await prisma.organization.findUnique({
        where: { id },
        select: { id: true, name: true, createdAt: true, _count: { select: { sheds: true, users: true } } },
      });
      if (!org) throw new NotFoundError("Organización");
      return Response.json({ ...org, description: null, location: null, phone: null });
    }
  } catch (err) { return apiErrorResponse(err); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.SUPER_ADMIN);
    const { id }  = await params;
    const body    = await req.json().catch(() => ({}));
    const data    = updateSchema.parse(body);
    // Try updating with new fields; fall back to name-only if migration not run
    try {
      const org = await prisma.organization.update({
        where: { id },
        data:  { name: data.name, description: data.description ?? null, location: data.location ?? null, phone: data.phone ?? null },
      });
      return Response.json(org);
    } catch {
      const org = await prisma.organization.update({ where: { id }, data: { name: data.name } });
      return Response.json(org);
    }
  } catch (err) { return apiErrorResponse(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, Role.SUPER_ADMIN);
    const { id } = await params;
    await prisma.organization.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) { return apiErrorResponse(err); }
}
