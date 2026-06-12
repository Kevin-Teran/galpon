/**
 * @file page.tsx
 * @route /src/app/(platform)/sensors/[id]/page.tsx
 * @description Trazabilidad de sensor: última lectura, historial y alertas activas.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { BtnPrimary, IconBtn } from "@/app/_ui/PageHeader";
import { Modal } from "@/app/_ui/Modal";
import { Field, inputCls, selectCls } from "@/app/_ui/Field";
import { IconPencil, IconArrowLeft } from "@/app/_ui/Icons";

interface Measurement { id: string; value: number; metric: string; timestamp: string; }
interface Alert       { id: string; alertLevel: string; value: number; createdAt: string; }
interface SensorDetail {
  id: string; name: string; hardwareId: string; metric: string; side: string;
  isActive: boolean; createdAt: string;
  node: { id: string; name: string; shed: { id: string; name: string } };
  measurements: Measurement[];
  alerts: Alert[];
}

type Params = Promise<{ id: string }>;

const LEVEL_LABEL: Record<string, string> = {
  GREEN: "Verde", YELLOW_LOW: "Amarillo bajo", YELLOW_HIGH: "Amarillo alto",
  RED_LOW: "Rojo bajo", RED_HIGH: "Rojo alto",
};
const LEVEL_CLS: Record<string, string> = {
  GREEN: "bg-emerald-500/10 text-emerald-400",
  YELLOW_LOW: "bg-yellow-500/10 text-yellow-400",
  YELLOW_HIGH: "bg-yellow-500/10 text-yellow-400",
  RED_LOW: "bg-red-500/10 text-red-400",
  RED_HIGH: "bg-red-500/10 text-red-400",
};

export default function SensorDetailPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [sensor, setSensor]     = useState<SensorDetail | null>(null);
  const [modal, setModal]       = useState(false);
  const [isPending, start]      = useTransition();
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm]         = useState({ name: "", hardwareId: "", metric: "", side: "", isActive: "true" });

  async function load() {
    const r = await fetch(`/api/sensors/${id}`);
    if (r.ok) setSensor(await r.json());
  }
  useEffect(() => { load(); }, [id]);

  function openEdit() {
    if (!sensor) return;
    setForm({ name: sensor.name, hardwareId: sensor.hardwareId, metric: sensor.metric, side: sensor.side, isActive: sensor.isActive ? "true" : "false" });
    setError(null);
    setModal(true);
  }

  function saveEdit() {
    if (!form.name.trim() || !form.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    start(async () => {
      const r = await fetch(`/api/sensors/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, hardwareId: form.hardwareId, metric: form.metric, side: form.side, isActive: form.isActive === "true" }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(false); load();
    });
  }

  if (!sensor) return <p className="text-[var(--text-muted)] text-sm p-4">Cargando...</p>;

  const unit = sensor.metric === "TEMPERATURE" ? "°C" : "%";
  const last  = sensor.measurements[0];

  return (
    <div>
      {/* Retroceso */}
      <Link href={`/nodes/${sensor.node.id}`} className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition mb-4">
        <IconArrowLeft size={14} /> {sensor.node.name}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{sensor.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${sensor.metric === "TEMPERATURE" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>
              {sensor.metric === "TEMPERATURE" ? "Temperatura" : "Humedad"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${sensor.side === "EXTERIOR" ? "bg-teal-500/10 text-teal-400" : "bg-indigo-500/10 text-indigo-400"}`}>
              {sensor.side === "EXTERIOR" ? "Exterior" : "Interior"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${sensor.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
              {sensor.isActive ? "Activo" : "Inactivo"}
            </span>
            <span className="font-mono text-xs text-[var(--text-muted)]">{sensor.hardwareId}</span>
          </div>
        </div>
        <IconBtn icon={<IconPencil />} label="Editar sensor" onClick={openEdit} />
      </div>

      {/* Última lectura */}
      {last && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Última lectura</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {last.value.toFixed(1)}<span className="text-lg text-[var(--text-secondary)] ml-1">{unit}</span>
            </p>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-right">
            {new Date(last.timestamp).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Historial */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Historial ({sensor.measurements.length})
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                  <th className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">Fecha y hora</th>
                  <th className="text-right px-4 py-2 font-medium text-[var(--text-secondary)]">Valor</th>
                </tr>
              </thead>
              <tbody>
                {sensor.measurements.length === 0 && (
                  <tr><td colSpan={2} className="text-center py-6 text-[var(--text-muted)] text-xs">Sin mediciones</td></tr>
                )}
                {sensor.measurements.map((m, i) => (
                  <tr key={m.id} className={`border-b border-[var(--border)] transition ${i === 0 ? "bg-[var(--bg-subtle)]" : "hover:bg-[var(--bg-subtle)]"}`}>
                    <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">
                      {new Date(m.timestamp).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-[var(--text-primary)]">
                      {m.value.toFixed(1)} {unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas activas */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Alertas activas ({sensor.alerts.length})
          </h2>
          <div className="space-y-2">
            {sensor.alerts.length === 0 && <p className="text-xs text-[var(--text-muted)] italic">Sin alertas activas</p>}
            {sensor.alerts.map(a => (
              <div key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${LEVEL_CLS[a.alertLevel] ?? "bg-slate-500/10 text-slate-400"}`}>
                  {LEVEL_LABEL[a.alertLevel] ?? a.alertLevel}
                </span>
                <p className="font-mono text-sm font-semibold mt-1">{a.value.toFixed(1)} {unit}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {new Date(a.createdAt).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: editar sensor */}
      <Modal open={modal} title="Editar sensor" onClose={() => setModal(false)}>
        <div className="space-y-4">
          <Field label="Nombre"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} autoFocus /></Field>
          <Field label="Hardware ID" description="Topic MQTT"><input value={form.hardwareId} onChange={e => setForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Métrica">
              <select value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} className={selectCls}>
                <option value="TEMPERATURE">Temperatura (°C)</option>
                <option value="HUMIDITY">Humedad (%)</option>
              </select>
            </Field>
            <Field label="Posición">
              <select value={form.side} onChange={e => setForm(f => ({ ...f, side: e.target.value }))} className={selectCls}>
                <option value="EXTERIOR">Exterior</option>
                <option value="INTERIOR">Interior</option>
              </select>
            </Field>
          </div>
          <Field label="Estado">
            <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value }))} className={selectCls}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </Field>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(false)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveEdit} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</BtnPrimary>
          </div>
        </div>
      </Modal>
    </div>
  );
}
