/**
 * @file route.ts
 * @route /src/app/api/auth/theme/route.ts
 * @description PUT /api/auth/theme — Persiste la preferencia de tema del usuario en la DB.
 *              Complementa el localStorage del cliente con un registro servidor.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { PrismaUserRepository } from "@/authentication/infrastructure/PrismaUserRepository";
import { auditLog, getClientIp, getUserAgent } from "@/shared/audit/audit";
import { ValidationError } from "@/shared/errors/ValidationError";

const schema = z.object({
  theme: z.enum(["DARK", "LIGHT", "SYSTEM"]),
});

export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const payload = await requireAuth(req);
    const body    = await req.json().catch(() => ({}));
    const parsed  = schema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError("Tema inválido. Valores aceptados: DARK, LIGHT, SYSTEM");
    }

    const repo = new PrismaUserRepository();
    await repo.saveThemePreference(payload.sub, parsed.data.theme);

    await auditLog({
      action:    "THEME_CHANGED",
      userId:    payload.sub,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      statusCode: 200,
      details:   { theme: parsed.data.theme },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
