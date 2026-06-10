/**
 * @file PrismaUserRepository.ts
 * @route /src/authentication/infrastructure/PrismaUserRepository.ts
 * @description Implementación del IUserRepository usando Prisma ORM.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { prisma } from "@/shared/database/prisma.client";
import { UserEntity } from "../domain/User.entity";
import { CreateUserInput, IUserRepository } from "../domain/IUserRepository";
import { Role } from "@/shared/types/roles";

function toEntity(record: {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  organizationId: string | null;
  pushSubscription: unknown;
  createdAt: Date;
  updatedAt: Date;
}): UserEntity {
  return new UserEntity({
    id: record.id,
    email: record.email,
    passwordHash: record.passwordHash,
    name: record.name,
    role: record.role as Role,
    organizationId: record.organizationId,
    pushSubscription: record.pushSubscription as object | null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const record = await prisma.user.findUnique({ where: { id } });
    return record ? toEntity(record) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await prisma.user.findUnique({ where: { email } });
    return record ? toEntity(record) : null;
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    const record = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: input.role,
        organizationId: input.organizationId,
        pushSubscription: input.pushSubscription ?? undefined,
      },
    });
    return toEntity(record);
  }

  async updatePushSubscription(
    id: string,
    subscription: object | null
  ): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { pushSubscription: subscription ?? undefined },
    });
  }

  async createSession(
    userId: string,
    jti: string,
    expiresAt: Date
  ): Promise<void> {
    await prisma.userSession.create({ data: { userId, jti, expiresAt } });
  }

  async deleteSession(jti: string): Promise<void> {
    await prisma.userSession.deleteMany({ where: { jti } });
  }

  async sessionExists(jti: string): Promise<boolean> {
    const session = await prisma.userSession.findUnique({ where: { jti } });
    return !!session && session.expiresAt > new Date();
  }
}
