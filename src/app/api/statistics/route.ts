/**
 * @file route.ts
 * @route /src/app/api/statistics/route.ts
 * @description GET /api/statistics — estadísticas de uso de dispositivos y mediciones.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma.client";
import { requireRole, apiErrorResponse } from "@/shared/middleware/auth.middleware";
import { Role } from "@/shared/types/roles";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, Role.OPERATOR);
    const sp      = req.nextUrl.searchParams;
    const shedId  = sp.get("shedId") ?? undefined;

    const alertWhere = payload.role !== Role.SUPER_ADMIN
      ? { organizationId: payload.organizationId! }
      : {};

    const deviceWhere = shedId
      ? { OR: [{ pump: { node: { shedId } } }, { fan: { shedId } }] } as object
      : {};

    const [
      totalAlerts,
      openAlerts,
      deviceEvents,
      lastMeasurements,
    ] = await Promise.all([
      prisma.alert.count({ where: alertWhere }),
      prisma.alert.count({ where: { ...alertWhere, resolvedAt: null } }),
      prisma.deviceEvent.findMany({
        where:   { ...deviceWhere, endedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take:    50,
        select: {
          id: true, deviceType: true, deviceHardwareId: true,
          reason: true, startedAt: true, endedAt: true, durationSeconds: true,
        },
      }),
      prisma.measurement.findMany({
        where:   { sensor: { node: shedId ? { shedId } : {} } },
        orderBy: { timestamp: "desc" },
        take:    200,
        select: {
          sensorId:  true,
          metric:    true,
          value:     true,
          timestamp: true,
          sensor:    { select: { name: true } },
        },
      }),
    ]);

    const totalDurationByType = deviceEvents.reduce<Record<string, number>>((acc, e) => {
      acc[e.deviceType] = (acc[e.deviceType] ?? 0) + (e.durationSeconds ?? 0);
      return acc;
    }, {});

    return Response.json({
      alerts:       { total: totalAlerts, open: openAlerts },
      devices:      { events: deviceEvents, totalDurationByType },
      measurements: lastMeasurements,
    });
  } catch (err) { return apiErrorResponse(err); }
}
