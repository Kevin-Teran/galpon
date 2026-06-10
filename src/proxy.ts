/**
 * @file proxy.ts
 * @route /src/proxy.ts
 * @description Proxy Next.js 16 — protege rutas de la plataforma y redirige según autenticación.
 * @author Kevin Mariano
 * @version 1.0.1
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

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons");

  const token = req.cookies.get("access_token")?.value;

  if (isPublic) return NextResponse.next();

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
