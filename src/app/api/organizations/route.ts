/**
 * @file route.ts
 * @route /src/app/api/organizations/route.ts
 * @description GET /api/organizations — listar | POST — crear organización.
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

const createSchema = z.object({ name: z.string().min(2).max(100) });

export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const where = payload.role === Role.SUPER_ADMIN ? {} : { id: payload.organizationId! };
    const orgs = await prisma.organization.findMany({
      where,
      include: { _count: { select: { sheds: true, users: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(orgs);
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, Role.SUPER_ADMIN);
    const body = await req.json().catch(() => ({}));
    const { name } = createSchema.parse(body);
    const org = await prisma.organization.create({ data: { name } });
    return Response.json(org, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
