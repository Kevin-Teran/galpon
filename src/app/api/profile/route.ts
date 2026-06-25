/**
 * @file route.ts
 * @route /src/app/api/profile/route.ts
 * @description GET /api/profile — perfil completo del usuario.
 *              PUT /api/profile — actualizar nombre.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireAuth, apiErrorResponse } from "@/shared/middleware/auth.middleware";

const updateSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
});

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const user    = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, organizationId: true, createdAt: true },
    });
    if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    return Response.json(user);
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const body    = await req.json().catch(() => ({}));
    const { name } = updateSchema.parse(body);

    await prisma.user.update({
      where:  { id: payload.sub },
      data:   { name },
      select: { id: true },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
