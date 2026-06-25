/**
 * @file route.ts
 * @route /src/app/api/users/[id]/route.ts
 * @description PUT /api/users/[id] — actualizar nombre y rol.
 *              DELETE /api/users/[id] — eliminar usuario.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";
import { ForbiddenError } from "@/shared/errors/UnauthorizedError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { ValidationError } from "@/shared/errors/ValidationError";

const updateSchema = z.object({
  name:           z.string().min(2).max(100).optional(),
  role:           z.enum(["SUPER_ADMIN", "ADMIN", "OPERATOR"]).optional(),
  password:       z.string().min(8).max(128).optional(),
  organizationId: z.string().nullable().optional(),
});

function orgWhere(payload: { role: string; organizationId: string | null }) {
  if ((payload.role as Role) === Role.SUPER_ADMIN) return {};
  return { organizationId: payload.organizationId! };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload      = await requireRole(req, Role.ADMIN);
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const { id }       = await params;
    const body         = await req.json().catch(() => ({}));
    const data         = updateSchema.parse(body);

    const target = await prisma.user.findFirst({
      where:  { id, ...orgWhere(payload) },
      select: { id: true, role: true },
    });
    if (!target) throw new NotFoundError("Usuario");

    // Admin no puede tocar a un Super Admin ni promover a Super Admin
    if (!isSuperAdmin && (target.role === "SUPER_ADMIN" || data.role === "SUPER_ADMIN")) {
      throw new ForbiddenError("No tienes permiso para modificar este usuario");
    }

    // Nadie puede cambiar su propio rol
    if (id === payload.sub && data.role !== undefined) {
      throw new ValidationError("No puedes cambiar tu propio rol");
    }

    // Solo SA puede cambiar la organización
    if (data.organizationId !== undefined && !isSuperAdmin) {
      throw new ForbiddenError("Solo los Super Admin pueden cambiar la organización");
    }

    const { password, organizationId, ...rest } = data;
    const updateData: Record<string, unknown> = { ...rest, ...(rest.role ? { role: rest.role as Role } : {}) };
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    if (organizationId !== undefined) updateData.organizationId = organizationId ?? null;

    const user = await prisma.user.update({
      where:  { id },
      data:   updateData,
      select: { id: true, name: true, email: true, role: true, organizationId: true, createdAt: true, organization: { select: { name: true } } },
    });
    return Response.json(user);
  } catch (err) { return apiErrorResponse(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload      = await requireRole(req, Role.ADMIN);
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const { id }       = await params;

    if (id === payload.sub) throw new ValidationError("No puedes eliminarte a ti mismo");

    const target = await prisma.user.findFirst({
      where:  { id, ...orgWhere(payload) },
      select: { id: true, role: true },
    });
    if (!target) throw new NotFoundError("Usuario");

    if (!isSuperAdmin && target.role === "SUPER_ADMIN") {
      throw new ForbiddenError("No puedes eliminar a un Super Administrador");
    }

    await prisma.user.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) { return apiErrorResponse(err); }
}
