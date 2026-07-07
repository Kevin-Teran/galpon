/**
 * @file route.ts
 * @route /src/app/api/sheds/[id]/route.ts
 * @description GET | PUT | DELETE /api/sheds/[id]
 * @author Kevin Mariano
 * @version 2.1.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { JwtPayload } from "@/authentication/infrastructure/JwtTokenService";

const updateSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  location:    z.string().optional(),
  mapsUrl:     z.string().url().optional().or(z.literal("")),
  area:        z.number().positive().optional(),
});

function orgWhere(p: JwtPayload) {
  if ((p.role as Role) === Role.SUPER_ADMIN || !p.organizationId) return {};
  return { organizationId: p.organizationId };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRole(req, Role.OPERATOR);
    const { id }  = await params;
    const shed    = await prisma.shed.findFirst({
      where: { id, ...orgWhere(payload) },
      include: {
        nodes: {
          orderBy: { createdAt: "asc" },
          include: {
            sensors: { orderBy: [{ side: "asc" }, { metric: "asc" }] },
            pumps:   { orderBy: { pumpNumber: "asc" }, include: { pumpEvents: { where: { endedAt: null }, take: 1 } } },
          },
        },
        fans:  { orderBy: { fanNumber: "asc" }, include: { fanEvents: { where: { endedAt: null }, take: 1 } } },
        organization: { select: { name: true, alertRanges: true } },
      },
    });
    if (!shed) throw new NotFoundError("Galpón");
    return Response.json(shed);
  } catch (err) { return apiErrorResponse(err); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const { id }  = await params;
    const body    = await req.json().catch(() => ({}));
    const { mapsUrl, ...rest } = updateSchema.parse(body);

    const exists = await prisma.shed.findFirst({ where: { id, ...orgWhere(payload) }, select: { id: true } });
    if (!exists) throw new NotFoundError("Galpón");

    const shed = await prisma.shed.update({
      where: { id },
      data:  { ...rest, ...(mapsUrl !== undefined && { mapsUrl: mapsUrl || null }) },
    });
    return Response.json(shed);
  } catch (err) { return apiErrorResponse(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireRole(req, Role.ADMIN);
    const { id }  = await params;

    const exists = await prisma.shed.findFirst({ where: { id, ...orgWhere(payload) }, select: { id: true } });
    if (!exists) throw new NotFoundError("Galpón");

    await prisma.shed.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) { return apiErrorResponse(err); }
}
