/**
 * @file JwtTokenService.ts
 * @route /src/authentication/infrastructure/JwtTokenService.ts
 * @description Generación y verificación de JWT de acceso y refresh.
 *              El campo jti permite invalidar tokens individuales (logout).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Role } from "@/shared/types/roles";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string | null;
  jti: string;
}

const SECRET = process.env.JWT_SECRET ?? "CHANGE_ME";
const ACCESS_EXPIRY = (process.env.JWT_EXPIRY ?? "15m") as jwt.SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY ?? "7d") as jwt.SignOptions["expiresIn"];

export function signAccessToken(payload: Omit<JwtPayload, "jti">): {
  token: string;
  jti: string;
} {
  const jti = uuidv4();
  const token = jwt.sign({ ...payload, jti }, SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
  return { token, jti };
}

export function signRefreshToken(userId: string): {
  token: string;
  jti: string;
  expiresAt: Date;
} {
  const jti = uuidv4();
  const token = jwt.sign({ sub: userId, jti, type: "refresh" }, SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
  const decoded = jwt.decode(token) as { exp: number };
  return { token, jti, expiresAt: new Date(decoded.exp * 1000) };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
