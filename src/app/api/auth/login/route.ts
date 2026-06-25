/**
 * @file route.ts
 * @route /src/app/api/auth/login/route.ts
 * @description POST /api/auth/login — Autenticar usuario y emitir tokens JWT.
 *              Registra IP, user-agent y resultado en audit_logs.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { PrismaUserRepository } from "@/authentication/infrastructure/PrismaUserRepository";
import { LoginUserUseCase } from "@/authentication/application/use-cases/LoginUser.usecase";
import { apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { ValidationError } from "@/shared/errors/ValidationError";
import { auditLog, getClientIp, getUserAgent } from "@/shared/audit/audit";

const schema = z.object({
  email:      z.string().email(),
  password:   z.string().min(8),
  rememberMe: z.boolean().optional().default(false),
});

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest): Promise<Response> {
  const ip        = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Datos inválidos", parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { email, password, rememberMe } = parsed.data;
    const useCase = new LoginUserUseCase(new PrismaUserRepository());
    const result  = await useCase.execute({ email, password, ipAddress: ip, userAgent });

    await auditLog({
      action:         "LOGIN_SUCCESS",
      userId:         result.user.id,
      organizationId: result.user.organizationId ?? undefined,
      ipAddress:      ip,
      userAgent,
      statusCode:     200,
    });

    const accessMaxAge  = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
    const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const secure        = IS_PROD ? "; Secure" : "";

    const response = Response.json({ user: result.user }, { status: 200 });
    response.headers.append("Set-Cookie",
      `access_token=${result.accessToken}; HttpOnly; Path=/; SameSite=Strict${secure}; Max-Age=${accessMaxAge}`);
    response.headers.append("Set-Cookie",
      `refresh_token=${result.refreshToken}; HttpOnly; Path=/api/auth/refresh; SameSite=Strict${secure}; Max-Age=${refreshMaxAge}`);

    return response;
  } catch (err) {
    await auditLog({
      action:     "LOGIN_FAILED",
      ipAddress:  ip,
      userAgent,
      statusCode: 401,
      details:    { reason: err instanceof Error ? err.message : "unknown" },
    });
    return apiErrorResponse(err);
  }
}
