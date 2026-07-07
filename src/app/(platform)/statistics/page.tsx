/**
 * @file page.tsx
 * @route /src/app/(platform)/statistics/page.tsx
 * @description Estadísticas de alertas, eventos de dispositivos y últimas mediciones.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/app/_ui/PageHeader";

interface DeviceEvent {
  id: string; deviceType: string; deviceHardwareId: string;
  reason: string; startedAt: string; endedAt: string | null; durationSeconds: number | null;
}
interface Measurement {
  nodeId: string; metric: string; value: number; timestamp: string;
  node: { name: string; shed: { name: string } };
}
interface Stats {
  alerts:       { total: number; open: number };
  devices:      { events: DeviceEvent[]; totalDurationByType: Record<string, number> };
  measurements: Measurement[];
}

const REASON_COLOR: Record<string, string> = {
  RED_HIGH: "text-red-400", RED_LOW: "text-red-400",
  YELLOW_HIGH: "text-yellow-400", YELLOW_LOW: "text-yellow-400",
  GREEN: "text-emerald-400", MANUAL: "text-slate-400",
};
const REASON_LABEL: Record<string, string> = {
  RED_HIGH: "Rojo Alto", RED_LOW: "Rojo Bajo",
  YELLOW_HIGH: "Amarillo Alto", YELLOW_LOW: "Amarillo Bajo",
  GREEN: "Verde", MANUAL: "Manual",
};

function fmtDuration(s: number | null): string {
  if (!s) return "—";
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export default function StatisticsPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/statistics")
      .then(r => r.json())
      .then((data: Stats) => { setStats(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">Cargando estadísticas...</div>
  );
  if (!stats) return null;

  const pumpMs = stats.devices.totalDurationByType["PUMP"] ?? 0;
  const fanMs  = stats.devices.totalDurationByType["FAN"]  ?? 0;
  const pumpsActivations = stats.devices.events.filter(e => e.deviceType === "PUMP" && e.endedAt).length;
  const fansActivations  = stats.devices.events.filter(e => e.deviceType === "FAN"  && e.endedAt).length;

  return (
    <div>
      <PageHeader title="Estadísticas" description="Historial de actividad del sistema" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Alertas totales",    value: stats.alerts.total,  sub: `${stats.alerts.open} activas`,       color: "text-red-400" },
          { label: "Bombas activadas",   value: pumpsActivations,    sub: fmtDuration(pumpMs) + " total",       color: "text-blue-400" },
          { label: "Ventiladores activ.", value: fansActivations,    sub: fmtDuration(fanMs) + " total",        color: "text-purple-400" },
          { label: "Mediciones recib.",  value: stats.measurements.length, sub: "últimas registradas",          color: "text-amber-400" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <p className="text-xs text-[var(--text-muted)] mb-1">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent device events */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Eventos de dispositivos recientes</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {stats.devices.events.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] p-5">Sin eventos registrados</p>
            )}
            {stats.devices.events.slice(0, 10).map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{e.deviceHardwareId}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {e.deviceType === "PUMP" ? "Bomba" : "Ventilador"} ·{" "}
                    <span className={REASON_COLOR[e.reason] ?? ""}>{REASON_LABEL[e.reason] ?? e.reason}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--text-secondary)]">{fmtDuration(e.durationSeconds)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(e.startedAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent measurements */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Últimas mediciones</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                {["Nodo","Métrica","Valor","Hora"].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.measurements.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-[var(--text-muted)] text-sm">Sin mediciones</td></tr>
              )}
              {stats.measurements.slice(0, 15).map((m, i) => (
                <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                  <td className="px-4 py-2">
                    <p className="font-medium text-[var(--text-primary)] text-xs">{m.node.shed.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{m.node.name}</p>
                  </td>
                  <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">
                    {m.metric === "TEMPERATURE" ? "Temp." : "Hum."}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-[var(--text-primary)]">
                    {m.value.toFixed(1)}{m.metric === "TEMPERATURE" ? "°C" : "%"}
                  </td>
                  <td className="px-4 py-2 text-[10px] text-[var(--text-muted)]">
                    {new Date(m.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
