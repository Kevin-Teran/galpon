/**
 * @file RegisterUser.usecase.ts
 * @route /src/authentication/application/use-cases/RegisterUser.usecase.ts
 * @description Caso de uso: registrar un nuevo usuario (solo SUPER_ADMIN puede crear admins).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { IUserRepository } from "@/authentication/domain/IUserRepository";
import { hashPassword } from "@/authentication/infrastructure/BcryptPasswordService";
import { ConflictError } from "@/shared/errors/ConflictError";
import { Role } from "@/shared/types/roles";

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
  role: Role;
  organizationId?: string | null;
}

export class RegisterUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<{ id: string }> {
    const existing = await this.userRepo.findByEmail(
      input.email.toLowerCase().trim()
    );
    if (existing) throw new ConflictError("El email ya está registrado");

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepo.create({
      email: input.email.toLowerCase().trim(),
      passwordHash,
      name: input.name,
      role: input.role,
      organizationId: input.organizationId ?? null,
      pushSubscription: null,
    });

    return { id: user.id };
  }
}
