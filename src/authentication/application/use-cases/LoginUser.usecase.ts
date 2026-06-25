/**
 * @file LoginUser.usecase.ts
 * @route /src/authentication/application/use-cases/LoginUser.usecase.ts
 * @description Caso de uso: autenticar usuario con email y contraseña.
 *              Registra IP, user-agent e incrementa el contador de inicios de sesión.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { IUserRepository } from "@/authentication/domain/IUserRepository";
import { verifyPassword } from "@/authentication/infrastructure/BcryptPasswordService";
import { signAccessToken, signRefreshToken } from "@/authentication/infrastructure/JwtTokenService";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";

export interface LoginUserInput {
  email:      string;
  password:   string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginUserOutput {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:             string;
    email:          string;
    name:           string;
    role:           string;
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
      sub:            user.id,
      email:          user.email,
      role:           user.role,
      organizationId: user.organizationId,
    });

    const { token: refreshToken, expiresAt } = signRefreshToken(user.id);

    await Promise.all([
      this.userRepo.createSession({
        userId:    user.id,
        jti,
        expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      }),
      this.userRepo.incrementLoginCount(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id:             user.id,
        email:          user.email,
        name:           user.name,
        role:           user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
