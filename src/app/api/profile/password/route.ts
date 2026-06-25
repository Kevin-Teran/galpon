/**
 * @file route.ts
 * @route /src/app/api/profile/password/route.ts
 * @description PUT /api/profile/password — cambiar contraseña verificando la actual.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireAuth, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { hashPassword, verifyPassword } from "@/authentication/infrastructure/BcryptPasswordService";
import { ValidationError } from "@/shared/errors/ValidationError";
import { NotFoundError } from "@/shared/errors/NotFoundError";

const schema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
  newPassword:     z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string().min(1),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path:    ["confirmPassword"],
});

export async function PUT(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const body    = await req.json().catch(() => ({}));
    const data    = schema.parse(body);

    const user = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new NotFoundError("Usuario");

    const valid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError("La contraseña actual es incorrecta");

    const newHash = await hashPassword(data.newPassword);
    await prisma.user.update({
      where:  { id: user.id },
      data:   { passwordHash: newHash },
      select: { id: true },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
