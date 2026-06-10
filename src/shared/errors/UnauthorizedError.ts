/**
 * @file UnauthorizedError.ts
 * @route /src/shared/errors/UnauthorizedError.ts
 * @description Error 401 — no autenticado, o 403 — sin permisos suficientes.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(message, 403, "FORBIDDEN");
  }
}
