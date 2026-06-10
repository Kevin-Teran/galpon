/**
 * @file LoginUser.usecase.ts
 * @route /src/authentication/application/use-cases/LoginUser.usecase.ts
 * @description Caso de uso: autenticar usuario con email y contraseña.
 *              Devuelve access token (JWT) y refresh token.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { IUserRepository } from "@/authentication/domain/IUserRepository";
import { verifyPassword } from "@/authentication/infrastructure/BcryptPasswordService";
import {
  signAccessToken,
  signRefreshToken,
} from "@/authentication/infrastructure/JwtTokenService";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string | null;
  };
}

export class LoginUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepo.findByEmail(input.email.toLowerCase().trim());
    if (!user) throw new UnauthorizedError("Credenciales incorrectas");

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Credenciales incorrectas");

    const { token: accessToken, jti } = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const { token: refreshToken, expiresAt } = signRefreshToken(user.id);
    await this.userRepo.createSession(user.id, jti, expiresAt);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
