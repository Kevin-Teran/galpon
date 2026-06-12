/**
 * @file proxy.ts
 * @route /src/proxy.ts
 * @description Proxy Next.js 16 — protege rutas de la plataforma y redirige según autenticación.
 *              Detecta tokens expirados mediante decodificación del payload JWT (sin verificar firma).
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/offline",
  "/sw.js",
  "/manifest.json",
];

/** Decodifica el payload del JWT sin verificar la firma (compatible con Edge runtime). */
function jwtExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const raw     = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(raw)) as { exp?: number };
    if (!payload.exp) return true;
    return Math.floor(Date.now() / 1000) > payload.exp;
  } catch {
    return true;
  }
}

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons");

  if (isPublic) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;

  if (!token || jwtExpired(token)) {
    const res = NextResponse.redirect(new URL(`/login?from=${pathname}`, req.url));
    if (token) res.cookies.delete("access_token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
