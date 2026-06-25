/**
 * @file route.ts
 * @route /src/app/api/auth/logout/route.ts
 * @description POST /api/auth/logout — Invalidar la sesión actual del usuario.
 *              Marca la sesión con endedAt y endReason=LOGOUT en la DB.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { PrismaUserRepository } from "@/authentication/infrastructure/PrismaUserRepository";
import { LogoutUserUseCase } from "@/authentication/application/use-cases/LogoutUser.usecase";
import { requireAuth, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { auditLog, getClientIp, getUserAgent } from "@/shared/audit/audit";

const IS_PROD = process.env.NODE_ENV === "production";
const secure  = IS_PROD ? "; Secure" : "";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const payload = await requireAuth(req);
    const repo    = new PrismaUserRepository();

    await Promise.all([
      new LogoutUserUseCase(repo).execute(payload.jti),
      repo.closeSession(payload.jti, "LOGOUT"),
      auditLog({
        action:         "LOGOUT",
        userId:         payload.sub,
        organizationId: payload.organizationId ?? undefined,
        ipAddress:      getClientIp(req),
        userAgent:      getUserAgent(req),
        statusCode:     200,
      }),
    ]);

    const response = Response.json({ ok: true }, { status: 200 });
    response.headers.append("Set-Cookie",
      `access_token=; HttpOnly; Path=/; SameSite=Strict${secure}; Max-Age=0`);
    response.headers.append("Set-Cookie",
      `refresh_token=; HttpOnly; Path=/api/auth/refresh; SameSite=Strict${secure}; Max-Age=0`);
    return response;
  } catch (err) {
    return apiErrorResponse(err);
  }
}
