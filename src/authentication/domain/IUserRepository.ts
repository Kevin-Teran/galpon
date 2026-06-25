/**
 * @file IUserRepository.ts
 * @route /src/authentication/domain/IUserRepository.ts
 * @description Contrato (puerto) del repositorio de usuarios.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { UserEntity, UserProps } from "./User.entity";

export type CreateUserInput = Omit<UserProps, "id" | "createdAt" | "updatedAt">;

export interface CreateSessionInput {
  userId:    string;
  jti:       string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(input: CreateUserInput): Promise<UserEntity>;
  updatePushSubscription(id: string, subscription: object | null): Promise<void>;
  createSession(input: CreateSessionInput): Promise<void>;
  deleteSession(jti: string): Promise<void>;
  closeSession(jti: string, reason: "LOGOUT" | "PASSWORD_RESET"): Promise<void>;
  sessionExists(jti: string): Promise<boolean>;
  incrementLoginCount(userId: string): Promise<void>;
  saveThemePreference(userId: string, theme: "DARK" | "LIGHT" | "SYSTEM"): Promise<void>;
}
