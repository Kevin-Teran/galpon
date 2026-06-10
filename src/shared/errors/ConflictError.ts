/**
 * @file ConflictError.ts
 * @route /src/shared/errors/ConflictError.ts
 * @description Error 409 — conflicto de recursos (ej. email o hardwareId duplicado).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { AppError } from "./AppError";

export class ConflictError extends AppError {
  constructor(message = "El recurso ya existe") {
    super(message, 409, "CONFLICT");
  }
}
