/**
 * @file ValidationError.ts
 * @route /src/shared/errors/ValidationError.ts
 * @description Error 422 — datos de entrada inválidos.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { AppError } from "./AppError";

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(message = "Datos inválidos", fields?: Record<string, string[]>) {
    super(message, 422, "VALIDATION_ERROR");
    this.fields = fields;
  }
}
