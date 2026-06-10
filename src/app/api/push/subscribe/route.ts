/**
 * @file route.ts
 * @route /src/app/api/push/subscribe/route.ts
 * @description POST /api/push/subscribe — Guardar suscripción Web Push del usuario autenticado.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import {
  requireAuth,
  apiErrorResponse,
} from "@/shared/middleware/auth.middleware";
import { PrismaUserRepository } from "@/authentication/infrastructure/PrismaUserRepository";
import { ValidationError } from "@/shared/errors/ValidationError";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const payload = await requireAuth(req);
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object" || !("endpoint" in body)) {
      throw new ValidationError("Suscripción push inválida");
    }

    const userRepo = new PrismaUserRepository();
    await userRepo.updatePushSubscription(payload.sub, body as object);

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    const payload = await requireAuth(req);
    const userRepo = new PrismaUserRepository();
    await userRepo.updatePushSubscription(payload.sub, null);
    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
