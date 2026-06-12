/**
 * @file route.ts
 * @route /src/app/api/auth/login/route.ts
 * @description POST /api/auth/login — Autenticar usuario y emitir tokens JWT.
 *              Soporta rememberMe para extender la duración de la cookie.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { PrismaUserRepository } from "@/authentication/infrastructure/PrismaUserRepository";
import { LoginUserUseCase } from "@/authentication/application/use-cases/LoginUser.usecase";
import { apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { ValidationError } from "@/shared/errors/ValidationError";

const schema = z.object({
  email:      z.string().email(),
  password:   z.string().min(8),
  rememberMe: z.boolean().optional().default(false),
});

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Datos inválidos", parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { email, password, rememberMe } = parsed.data;
    const useCase = new LoginUserUseCase(new PrismaUserRepository());
    const result  = await useCase.execute({ email, password });

    // rememberMe → 30 días; normal → 8h (suficiente para una jornada laboral)
    const accessMaxAge  = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
    const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const secure = IS_PROD ? "; Secure" : "";

    const response = Response.json({ user: result.user }, { status: 200 });
    response.headers.append("Set-Cookie",
      `access_token=${result.accessToken}; HttpOnly; Path=/; SameSite=Strict${secure}; Max-Age=${accessMaxAge}`);
    response.headers.append("Set-Cookie",
      `refresh_token=${result.refreshToken}; HttpOnly; Path=/api/auth/refresh; SameSite=Strict${secure}; Max-Age=${refreshMaxAge}`);

    return response;
  } catch (err) {
    return apiErrorResponse(err);
  }
}
