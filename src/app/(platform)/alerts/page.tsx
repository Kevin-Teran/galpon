/**
 * @file page.tsx
 * @route /src/app/(platform)/alerts/page.tsx
 * @description Listado de alertas del sistema con resolución individual.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { PageHeader } from "@/app/_ui/PageHeader";

interface Alert {
  id: string;
  alertLevel: string;
  metric: string;
  value: number;
  createdAt: string;
  resolvedAt: string | null;
  node: { name: string; hardwareId: string; shed: { name: string } };
}

const LEVEL_STYLE: Record<string, string> = {
  RED_HIGH:    "bg-red-500/15 text-red-400 border-red-500/20",
  RED_LOW:     "bg-red-500/15 text-red-400 border-red-500/20",
  YELLOW_HIGH: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  YELLOW_LOW:  "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  GREEN:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const LEVEL_LABEL: Record<string, string> = {
  RED_HIGH: "Rojo Alto", RED_LOW: "Rojo Bajo",
  YELLOW_HIGH: "Amarillo Alto", YELLOW_LOW: "Amarillo Bajo", GREEN: "Verde",
};

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [filter, setFilter]   = useState<"all" | "open">("open");
  const [isPending, start]    = useTransition();

  async function load() {
    const r = await fetch(`/api/alerts${filter === "open" ? "?open=true" : ""}`);
    if (r.ok) setAlerts(await r.json());
  }

  useEffect(() => { load(); }, [filter]);

  function resolve(id: string) {
    start(async () => {
      await fetch(`/api/alerts/${id}`, { method: "PUT" });
      load();
    });
  }

  const open   = alerts.filter(a => !a.resolvedAt).length;
  const metric = (m: string) => m === "TEMPERATURE" ? "Temperatura" : "Humedad";
  const unit   = (m: string) => m === "TEMPERATURE" ? "°C" : "%";

  return (
    <div>
      <PageHeader title="Alertas" description={`${open} alerta${open !== 1 ? "s" : ""} activa${open !== 1 ? "s" : ""}`}
        action={
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
            {(["open","all"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 transition ${filter === f ? "bg-emerald-600 text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"}`}>
                {f === "open" ? "Activas" : "Todas"}
              </button>
            ))}
          </div>
        }
      />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              {["Nivel","Galpón / Nodo","Métrica","Valor","Fecha","Estado",""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">
                {filter === "open" ? "No hay alertas activas ✓" : "Sin alertas registradas"}
              </td></tr>
            )}
            {alerts.map(a => (
              <tr key={a.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LEVEL_STYLE[a.alertLevel] ?? ""}`}>
                    {LEVEL_LABEL[a.alertLevel] ?? a.alertLevel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)]">{a.node.shed.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{a.node.name}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{metric(a.metric)}</td>
                <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{a.value.toFixed(1)}{unit(a.metric)}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(a.createdAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-4 py-3">
                  {a.resolvedAt
                    ? <span className="text-xs text-emerald-400">Resuelta</span>
                    : <span className="text-xs text-red-400 font-medium">Activa</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {!a.resolvedAt && (
                    <button onClick={() => resolve(a.id)} disabled={isPending}
                      className="text-xs text-emerald-500 hover:text-emerald-400 transition disabled:opacity-50">
                      Resolver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
