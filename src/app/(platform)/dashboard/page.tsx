/**
 * @file page.tsx
 * @route /src/app/(platform)/dashboard/page.tsx
 * @description Dashboard principal — métricas clave y acceso rápido a secciones.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/authentication/infrastructure/JwtTokenService";
import { prisma } from "@/shared/database/prisma.client";
import { Role } from "@/shared/types/roles";

export const metadata = { title: "Dashboard — Galpon" };

async function getStats() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    const payload      = verifyToken(token);
    const isSuperAdmin = (payload.role as Role) === Role.SUPER_ADMIN;
    const orgWhere     = !isSuperAdmin && payload.organizationId
      ? { organizationId: payload.organizationId }
      : {};

    const [shedCount, sensorCount, openAlertCount, totalMeasurements] = await Promise.all([
      prisma.shed.count({ where: orgWhere }),
      prisma.sensor.count({ where: { isActive: true, node: { shed: orgWhere } } }),
      prisma.alert.count({ where: { resolvedAt: null, ...orgWhere } }),
      prisma.measurement.count({ where: { sensor: { node: { shed: orgWhere } }, timestamp: { gte: new Date(Date.now() - 86_400_000) } } }),
    ]);

    return { shedCount, sensorCount, openAlertCount, totalMeasurements };
  } catch {
    return { shedCount: 0, sensorCount: 0, openAlertCount: 0, totalMeasurements: 0 };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color: "emerald" | "cyan" | "amber" | "violet";
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    cyan:    "bg-cyan-500/10    text-cyan-400",
    amber:   "bg-amber-500/10   text-amber-400",
    violet:  "bg-violet-500/10  text-violet-400",
  };
  return (
    <div className="rounded-2xl border border-(--border) bg-(--bg-surface) p-5 flex gap-4 items-start">
      <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-(--text-muted) font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-(--text-primary) mt-0.5 tabular-nums">{value}</p>
        <p className="text-xs text-(--text-muted) mt-1">{sub}</p>
      </div>
    </div>
  );
}

function QuickCard({
  href, title, description, icon, color,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "emerald" | "cyan" | "amber" | "violet";
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
    cyan:    "bg-cyan-500/10    text-cyan-400    group-hover:bg-cyan-500/20",
    amber:   "bg-amber-500/10   text-amber-400   group-hover:bg-amber-500/20",
    violet:  "bg-violet-500/10  text-violet-400  group-hover:bg-violet-500/20",
  };
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-(--border) bg-(--bg-surface) p-5 flex flex-col gap-4 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-(--text-primary) group-hover:text-emerald-400 transition-colors">{title}</p>
        <p className="text-sm text-(--text-muted) mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-sm text-(--text-muted) group-hover:text-emerald-400 transition-colors mt-auto">
        <span>Ir a {title.toLowerCase()}</span>
        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const stats = await getStats();
  const now   = new Date();
  const dateStr = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Welcome header */}
      <div>
        <p className="text-sm text-(--text-muted) capitalize">{dateStr}</p>
        <h2 className="text-2xl font-bold text-(--text-primary) mt-0.5">Bienvenido a Galpon</h2>
        <p className="text-sm text-(--text-secondary) mt-1">
          Aquí está el resumen de tu operación avícola.
        </p>
      </div>

      {/* KPI Cards */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-(--text-muted) mb-3">
          Métricas clave
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Galpones"
            value={stats?.shedCount ?? "—"}
            sub="instalaciones registradas"
            color="emerald"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
              </svg>
            }
          />
          <StatCard
            label="Sensores activos"
            value={stats?.sensorCount ?? "—"}
            sub="dispositivos en línea"
            color="cyan"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            }
          />
          <StatCard
            label="Alertas abiertas"
            value={stats?.openAlertCount ?? "—"}
            sub={stats?.openAlertCount === 0 ? "sin incidencias activas" : "requieren atención"}
            color={stats && stats.openAlertCount > 0 ? "amber" : "emerald"}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            }
          />
          <StatCard
            label="Lecturas hoy"
            value={stats?.totalMeasurements?.toLocaleString("es-ES") ?? "—"}
            sub="mediciones últimas 24 h"
            color="violet"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Quick access */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-(--text-muted) mb-3">
          Acceso rápido
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickCard
            href="/monitoring"
            title="Monitoreo"
            description="Visualiza temperatura y humedad de todos los sensores en tiempo real."
            color="cyan"
            icon={
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            }
          />
          <QuickCard
            href="/sheds"
            title="Galpones"
            description="Administra instalaciones, nodos, sensores, bombas y ventiladores."
            color="emerald"
            icon={
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
              </svg>
            }
          />
          <QuickCard
            href="/alerts"
            title="Alertas"
            description="Revisa y resuelve alertas activas de temperatura y humedad fuera de rango."
            color="amber"
            icon={
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            }
          />
          <QuickCard
            href="/statistics"
            title="Estadísticas"
            description="Analiza históricos, tendencias y correlaciones entre sensores."
            color="violet"
            icon={
              <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            }
          />
        </div>
      </section>

      {/* System status */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-(--text-muted) mb-3">
          Estado del sistema
        </h3>
        <div className="rounded-2xl border border-(--border) bg-(--bg-surface) p-5">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-sm text-(--text-secondary)">Plataforma operativa</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-sm text-(--text-secondary)">Base de datos conectada</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-sm text-(--text-secondary)">Broker MQTT activo</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-sm text-(--text-secondary)">
                Migración pendiente
                {stats?.shedCount === 0 && " — ejecuta npx prisma migrate dev"}
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
