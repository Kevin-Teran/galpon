/**
 * @file auth.middleware.ts
 * @route /src/shared/middleware/auth.middleware.ts
 * @description Helpers para validar JWT en API routes de Next.js App Router.
 *              Lee el token desde la cookie httpOnly "access_token".
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "@/authentication/infrastructure/JwtTokenService";
import { PrismaUserRepository } from "@/authentication/infrastructure/PrismaUserRepository";
import { UnauthorizedError, ForbiddenError } from "@/shared/errors/UnauthorizedError";
import { Role, hasMinimumRole } from "@/shared/types/roles";
import { AppError } from "@/shared/errors/AppError";

const userRepo = new PrismaUserRepository();

export async function requireAuth(req: NextRequest): Promise<JwtPayload> {
  const token =
    req.cookies.get("access_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) throw new UnauthorizedError();

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new UnauthorizedError("Token inválido o expirado");
  }

  const sessionValid = await userRepo.sessionExists(payload.jti);
  if (!sessionValid) throw new UnauthorizedError("Sesión inválida");

  return payload;
}

export async function requireRole(
  req: NextRequest,
  role: Role
): Promise<JwtPayload> {
  const payload = await requireAuth(req);
  if (!hasMinimumRole(payload.role as Role, role)) {
    throw new ForbiddenError("No tienes permisos suficientes");
  }
  return payload;
}

export function apiErrorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(
      { error: err.message, code: err.code },
      { status: err.statusCode }
    );
  }
  console.error("[API] Error inesperado:", err);
  return Response.json(
    { error: "Error interno del servidor", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
