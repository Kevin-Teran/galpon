/**
 * @file JwtTokenService.ts
 * @route /src/authentication/infrastructure/JwtTokenService.ts
 * @description Generación y verificación de JWT de acceso y refresh.
 *              Los access tokens llevan type:"access" para evitar que un refresh
 *              token sea aceptado como access token en requireAuth.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Role } from "@/shared/types/roles";

export interface JwtPayload {
  sub:            string;
  email:          string;
  role:           Role;
  organizationId: string | null;
  jti:            string;
  type:           "access";
}

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("JWT_SECRET no está configurado. La aplicación no puede iniciar sin esta variable de entorno.");
}

const ACCESS_EXPIRY  = (process.env.JWT_EXPIRY         ?? "8h") as jwt.SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY ?? "7d") as jwt.SignOptions["expiresIn"];

export function signAccessToken(payload: Omit<JwtPayload, "jti" | "type">): {
  token: string;
  jti:   string;
} {
  const jti   = uuidv4();
  const token = jwt.sign({ ...payload, jti, type: "access" }, SECRET!, { expiresIn: ACCESS_EXPIRY });
  return { token, jti };
}

export function signRefreshToken(userId: string): {
  token:     string;
  jti:       string;
  expiresAt: Date;
} {
  const jti     = uuidv4();
  const token   = jwt.sign({ sub: userId, jti, type: "refresh" }, SECRET!, { expiresIn: REFRESH_EXPIRY });
  const decoded = jwt.decode(token) as { exp: number };
  return { token, jti, expiresAt: new Date(decoded.exp * 1000) };
}

/** Verifica un access token. Lanza si es inválido, expirado, o no es type:"access". */
export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, SECRET!) as JwtPayload;
  if (payload.type !== "access") {
    throw new Error("Tipo de token inválido — se esperaba access token");
  }
  return payload;
}
