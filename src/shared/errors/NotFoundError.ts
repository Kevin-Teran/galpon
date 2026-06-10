/**
 * @file NotFoundError.ts
 * @route /src/shared/errors/NotFoundError.ts
 * @description Error 404 — recurso no encontrado.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`, 404, "NOT_FOUND");
  }
}
