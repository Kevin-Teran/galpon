/**
 * @file route.ts
 * @route /src/app/api/alert-ranges/route.ts
 * @description PUT /api/alert-ranges — Crear o actualizar rangos de alerta de una organización.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";

const schema = z.object({
  organizationId: z.string(),
  metric:         z.enum(["TEMPERATURE", "HUMIDITY"]),
  yellowLowMin:   z.number(),
  greenMin:       z.number(),
  greenMax:       z.number(),
  yellowHighMax:  z.number(),
});

export async function PUT(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const body    = await req.json().catch(() => ({}));
    const data    = schema.parse(body);

    if (payload.role !== Role.SUPER_ADMIN && payload.organizationId !== data.organizationId)
      return Response.json({ error: "Sin acceso a esta organización" }, { status: 403 });

    const range = await prisma.alertRange.upsert({
      where:  { organizationId_metric: { organizationId: data.organizationId, metric: data.metric } },
      update: { yellowLowMin: data.yellowLowMin, greenMin: data.greenMin, greenMax: data.greenMax, yellowHighMax: data.yellowHighMax },
      create: data,
    });
    return Response.json(range);
  } catch (err) { return apiErrorResponse(err); }
}
