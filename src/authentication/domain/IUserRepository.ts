/**
 * @file IUserRepository.ts
 * @route /src/authentication/domain/IUserRepository.ts
 * @description Contrato (puerto) del repositorio de usuarios.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { UserEntity, UserProps } from "./User.entity";

export type CreateUserInput = Omit<UserProps, "id" | "createdAt" | "updatedAt">;

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(input: CreateUserInput): Promise<UserEntity>;
  updatePushSubscription(id: string, subscription: object | null): Promise<void>;
  deleteSession(jti: string): Promise<void>;
  createSession(userId: string, jti: string, expiresAt: Date): Promise<void>;
  sessionExists(jti: string): Promise<boolean>;
}
