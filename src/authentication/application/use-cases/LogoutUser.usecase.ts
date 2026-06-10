/**
 * @file LogoutUser.usecase.ts
 * @route /src/authentication/application/use-cases/LogoutUser.usecase.ts
 * @description Caso de uso: invalidar la sesión JWT del usuario (logout).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { IUserRepository } from "@/authentication/domain/IUserRepository";

export class LogoutUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(jti: string): Promise<void> {
    await this.userRepo.deleteSession(jti);
  }
}
