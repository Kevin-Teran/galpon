/**
 * @file route.ts
 * @route /src/app/api/auth/reset-password/route.ts
 * @description POST /api/auth/reset-password — Verifica token y actualiza contraseña.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { hashPassword } from "@/authentication/infrastructure/BcryptPasswordService";
import { apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { ValidationError } from "@/shared/errors/ValidationError";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Datos inválidos");

    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) throw new UnauthorizedError("Token inválido o expirado");

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data:  {
        passwordHash,
        resetPasswordToken:  null,
        resetPasswordExpiry: null,
      },
    });

    // Invalidar todas las sesiones activas del usuario
    await prisma.userSession.deleteMany({ where: { userId: user.id } });

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
