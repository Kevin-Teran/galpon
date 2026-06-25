/**
 * @file route.ts
 * @route /src/app/api/auth/me/route.ts
 * @description GET /api/auth/me — Devuelve perfil del usuario autenticado.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { requireAuth, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { prisma } from "@/shared/database/prisma.client";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    const user    = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, organizationId: true },
    });
    if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    return Response.json(user);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
