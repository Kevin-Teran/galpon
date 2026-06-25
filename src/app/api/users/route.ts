/**
 * @file route.ts
 * @route /src/app/api/users/route.ts
 * @description GET /api/users — lista de usuarios (scope por org).
 *              POST /api/users — crear usuario.
 *              ADMIN ve solo su org · SUPER_ADMIN ve todo.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { hashPassword } from "@/authentication/infrastructure/BcryptPasswordService";
import { Role } from "@/shared/types/roles";
import { ForbiddenError } from "@/shared/errors/UnauthorizedError";

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  organizationId: true, createdAt: true,
  organization: { select: { name: true } },
} as const;

const createSchema = z.object({
  name:           z.string().min(2).max(100),
  email:          z.string().email(),
  password:       z.string().min(8, "Mínimo 8 caracteres"),
  role:           z.enum(["SUPER_ADMIN", "ADMIN", "OPERATOR"]),
  organizationId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const payload      = await requireRole(req, Role.ADMIN);
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const filterOrgId  = req.nextUrl.searchParams.get("organizationId") ?? undefined;

    const where = isSuperAdmin
      ? (filterOrgId ? { organizationId: filterOrgId } : {})
      : { organizationId: payload.organizationId! };

    const users = await prisma.user.findMany({
      where,
      select:  USER_SELECT,
      orderBy: { createdAt: "desc" },
    });

    return Response.json(users);
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    const payload      = await requireRole(req, Role.ADMIN);
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const body         = await req.json().catch(() => ({}));
    const data         = createSchema.parse(body);

    // Admin no puede crear Super Admins
    if (data.role === "SUPER_ADMIN" && !isSuperAdmin) {
      throw new ForbiddenError("No puedes crear un Super Administrador");
    }

    const organizationId = isSuperAdmin
      ? (data.organizationId ?? null)
      : payload.organizationId!;

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: { name: data.name, email: data.email.toLowerCase().trim(), passwordHash, role: data.role as Role, organizationId },
      select: USER_SELECT,
    });

    return Response.json(user, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
