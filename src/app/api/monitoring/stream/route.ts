/**
 * @file route.ts
 * @route /src/app/api/monitoring/stream/route.ts
 * @description GET /api/monitoring/stream — Server-Sent Events con las últimas lecturas de sensores.
 *              Emite cada 5 s un snapshot con las mediciones más recientes por sensor.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { NextRequest } from "next/server";
import { prisma } from "@/shared/database/prisma.client";
import { requireAuth } from "@/shared/middleware/auth.middleware";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const shedId  = req.nextUrl.searchParams.get("shedId") ?? undefined;
  const encoder = new TextEncoder();
  let closed    = false;

  const stream = new ReadableStream({
    async start(controller) {
      async function emit() {
        if (closed) return;
        try {
          const measurements = await prisma.measurement.findMany({
            where: {
              sensor:    { node: shedId ? { shedId } : {} },
              timestamp: { gte: new Date(Date.now() - 60_000) },
            },
            orderBy: { timestamp: "desc" },
            take: 200,
            select: {
              sensorId:  true,
              metric:    true,
              value:     true,
              timestamp: true,
              sensor: {
                select: {
                  name:       true,
                  hardwareId: true,
                  side:       true,
                  node: { select: { name: true } },
                },
              },
            },
          });

          const openAlerts = await prisma.alert.count({
            where: {
              resolvedAt: null,
              ...(shedId && { sensor: { node: { shedId } } }),
            },
          });

          const data = JSON.stringify({ measurements, openAlerts, ts: Date.now() });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch { /* DB error no debe cerrar el stream */ }

        if (!closed) setTimeout(emit, 5000);
      }

      await emit();
    },
    cancel() { closed = true; },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
