/**
 * @file route.ts
 * @route /src/app/api/auth/logout/route.ts
 * @description POST /api/auth/logout — Invalidar la sesión actual del usuario.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { PrismaUserRepository } from "@/authentication/infrastructure/PrismaUserRepository";
import { LogoutUserUseCase } from "@/authentication/application/use-cases/LogoutUser.usecase";
import {
  requireAuth,
  apiErrorResponse,
} from "@/shared/middleware/auth.middleware";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const payload = await requireAuth(req);
    const useCase = new LogoutUserUseCase(new PrismaUserRepository());
    await useCase.execute(payload.jti);

    const response = Response.json({ ok: true }, { status: 200 });
    response.headers.append(
      "Set-Cookie",
      "access_token=; HttpOnly; Path=/; Max-Age=0"
    );
    response.headers.append(
      "Set-Cookie",
      "refresh_token=; HttpOnly; Path=/api/auth/refresh; Max-Age=0"
    );
    return response;
  } catch (err) {
    return apiErrorResponse(err);
  }
}
