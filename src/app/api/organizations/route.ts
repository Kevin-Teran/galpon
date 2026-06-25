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

const orgSchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().max(300).optional().nullable(),
  location:    z.string().max(150).optional().nullable(),
  phone:       z.string().max(30).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const where = payload.role === Role.SUPER_ADMIN ? {} : { id: payload.organizationId! };

    // Try with new fields first; fall back to base fields if migration not yet applied
    try {
      const orgs = await prisma.organization.findMany({
        where,
        select: {
          id: true, name: true, description: true, location: true, phone: true, createdAt: true,
          _count: { select: { sheds: true, users: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return Response.json(orgs);
    } catch {
      const orgs = await prisma.organization.findMany({
        where,
        select: { id: true, name: true, createdAt: true, _count: { select: { sheds: true, users: true } } },
        orderBy: { createdAt: "desc" },
      });
      return Response.json(orgs.map(o => ({ ...o, description: null, location: null, phone: null })));
    }
  } catch (err) { return apiErrorResponse(err); }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, Role.SUPER_ADMIN);
    const body = await req.json().catch(() => ({}));
    const data = orgSchema.parse(body);
    const org  = await prisma.organization.create({
      data: { name: data.name, description: data.description ?? null, location: data.location ?? null, phone: data.phone ?? null },
    });
    return Response.json(org, { status: 201 });
  } catch (err) { return apiErrorResponse(err); }
}
