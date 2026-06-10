/**
 * @file page.tsx
 * @route /src/app/(platform)/sheds/[id]/page.tsx
 * @description Detalle de galpón: sensores, bombas, ventiladores y rangos de alerta.
 *              Arquitectura: un topic MQTT = un dispositivo = una función.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition, use } from "react";
import { PageHeader, BtnPrimary, BtnDanger } from "@/app/_ui/PageHeader";
import { Modal } from "@/app/_ui/Modal";
import { Field, inputCls, selectCls } from "@/app/_ui/Field";

interface Node { id: string; name: string; hardwareId: string; type: string; metric: string; isActive: boolean; }
interface Pump { id: string; name: string; hardwareId: string; pumpNumber: number; model?: string; isActive: boolean; }
interface Fan  { id: string; name: string; hardwareId: string; fanNumber: number; model?: string; isActive: boolean; }
interface AlertRange { metric: string; yellowLowMin: number; greenMin: number; greenMax: number; yellowHighMax: number; }
interface ShedDetail {
  id: string; name: string; location?: string; area?: number; latitude?: number; longitude?: number;
  organizationId: string;
  organization: { name: string; alertRanges: AlertRange[] };
  nodes: Node[]; pumps: Pump[]; fans: Fan[];
}

type Tab    = "nodes" | "pumps" | "fans" | "ranges";
type Params = Promise<{ id: string }>;

const defaultNode  = { name: "", hardwareId: "", type: "INTERIOR", metric: "TEMPERATURE" };
const defaultPump  = { name: "", hardwareId: "", pumpNumber: "1", model: "" };
const defaultFan   = { name: "", hardwareId: "", fanNumber: "1", model: "" };
const defaultRange = { metric: "TEMPERATURE", yellowLowMin: "16", greenMin: "20", greenMax: "32", yellowHighMax: "38" };

export default function ShedDetailPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [shed, setShed]       = useState<ShedDetail | null>(null);
  const [tab, setTab]         = useState<Tab>("nodes");
  const [modal, setModal]     = useState<"node" | "pump" | "fan" | "range" | null>(null);
  const [isPending, start]    = useTransition();
  const [error, setError]     = useState<string | null>(null);

  const [nodeForm, setNodeForm]   = useState(defaultNode);
  const [pumpForm, setPumpForm]   = useState(defaultPump);
  const [fanForm, setFanForm]     = useState(defaultFan);
  const [rangeForm, setRangeForm] = useState(defaultRange);

  async function load() {
    const r = await fetch(`/api/sheds/${id}`);
    if (r.ok) setShed(await r.json());
  }

  useEffect(() => { load(); }, [id]);

  function openModal(m: typeof modal) {
    setError(null);
    if (m === "pump") setPumpForm({ ...defaultPump, pumpNumber: String((shed?.pumps.length ?? 0) + 1) });
    if (m === "fan")  setFanForm({ ...defaultFan, fanNumber: String((shed?.fans.length ?? 0) + 1) });
    setModal(m);
  }

  function saveNode() {
    if (!nodeForm.hardwareId.trim()) { setError("El Hardware ID es obligatorio"); return; }
    if (!nodeForm.name.trim())       { setError("El nombre es obligatorio"); return; }
    start(async () => {
      const r = await fetch("/api/nodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...nodeForm, shedId: id }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error al crear"); return; }
      setModal(null); setNodeForm(defaultNode); load();
    });
  }

  function savePump() {
    if (!pumpForm.hardwareId.trim()) { setError("El Hardware ID es obligatorio"); return; }
    if (!pumpForm.name.trim())       { setError("El nombre es obligatorio"); return; }
    start(async () => {
      const r = await fetch("/api/pumps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pumpForm, pumpNumber: Number(pumpForm.pumpNumber), shedId: id }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error al crear"); return; }
      setModal(null); load();
    });
  }

  function saveFan() {
    if (!fanForm.hardwareId.trim()) { setError("El Hardware ID es obligatorio"); return; }
    if (!fanForm.name.trim())       { setError("El nombre es obligatorio"); return; }
    start(async () => {
      const r = await fetch("/api/fans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fanForm, fanNumber: Number(fanForm.fanNumber), shedId: id }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error al crear"); return; }
      setModal(null); load();
    });
  }

  function saveRange() {
    start(async () => {
      const r = await fetch("/api/alert-ranges", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: shed!.organizationId, metric: rangeForm.metric, yellowLowMin: Number(rangeForm.yellowLowMin), greenMin: Number(rangeForm.greenMin), greenMax: Number(rangeForm.greenMax), yellowHighMax: Number(rangeForm.yellowHighMax) }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); load();
    });
  }

  function del(url: string) {
    if (!confirm("¿Eliminar?")) return;
    start(async () => { await fetch(url, { method: "DELETE" }); load(); });
  }

  if (!shed) return <div className="text-[var(--text-muted)] text-sm">Cargando...</div>;

  const mapsUrl = shed.latitude && shed.longitude
    ? `https://www.google.com/maps?q=${shed.latitude},${shed.longitude}`
    : null;

  const TABS = [
    { key: "nodes",  label: `Sensores (${shed.nodes.length})` },
    { key: "pumps",  label: `Bombas (${shed.pumps.length})` },
    { key: "fans",   label: `Ventiladores (${shed.fans.length})` },
    { key: "ranges", label: "Rangos de alerta" },
  ] as const;

  return (
    <div>
      <PageHeader
        title={shed.name}
        description={`${shed.organization.name}${shed.location ? ` · ${shed.location}` : ""}${shed.area ? ` · ${shed.area} m²` : ""}`}
        action={mapsUrl
          ? <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-500 hover:text-emerald-400 transition">Ver en mapa ↗</a>
          : undefined}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as Tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t.key ? "border-emerald-500 text-emerald-500" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Sensores ── */}
      {tab === "nodes" && (
        <>
          <div className="flex justify-end mb-3"><BtnPrimary onClick={() => openModal("node")}>+ Agregar sensor</BtnPrimary></div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                {["Nombre","Hardware ID (topic)","Métrica","Ubicación","Estado",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {shed.nodes.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">Sin sensores registrados</td></tr>}
                {shed.nodes.map(n => (
                  <tr key={n.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{n.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{n.hardwareId}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${n.metric === "TEMPERATURE" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {n.metric === "TEMPERATURE" ? "Temperatura" : "Humedad"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${n.type === "INTERIOR" ? "bg-indigo-500/10 text-indigo-400" : "bg-teal-500/10 text-teal-400"}`}>
                        {n.type === "INTERIOR" ? "Interior" : "Exterior"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${n.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {n.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><BtnDanger onClick={() => del(`/api/nodes/${n.id}`)}>Eliminar</BtnDanger></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Bombas ── */}
      {tab === "pumps" && (
        <>
          <div className="flex justify-end mb-3"><BtnPrimary onClick={() => openModal("pump")}>+ Agregar bomba</BtnPrimary></div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                {["#","Nombre","Hardware ID (topic)","Modelo","Estado",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {shed.pumps.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">Sin bombas registradas</td></tr>}
                {shed.pumps.map(p => (
                  <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                    <td className="px-4 py-3 text-[var(--text-muted)]">{p.pumpNumber}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{p.hardwareId}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{p.model ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {p.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><BtnDanger onClick={() => del(`/api/pumps/${p.id}`)}>Eliminar</BtnDanger></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Ventiladores ── */}
      {tab === "fans" && (
        <>
          <div className="flex justify-end mb-3"><BtnPrimary onClick={() => openModal("fan")}>+ Agregar ventilador</BtnPrimary></div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                {["#","Nombre","Hardware ID (topic)","Modelo / Tamaño","Estado",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {shed.fans.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">Sin ventiladores registrados</td></tr>}
                {shed.fans.map(f => (
                  <tr key={f.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                    <td className="px-4 py-3 text-[var(--text-muted)]">{f.fanNumber}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{f.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{f.hardwareId}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{f.model ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {f.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><BtnDanger onClick={() => del(`/api/fans/${f.id}`)}>Eliminar</BtnDanger></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Rangos de alerta ── */}
      {tab === "ranges" && (
        <>
          <div className="flex justify-end mb-3"><BtnPrimary onClick={() => openModal("range")}>Configurar rango</BtnPrimary></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shed.organization.alertRanges.length === 0 && <p className="text-[var(--text-muted)] text-sm col-span-2">Sin rangos configurados.</p>}
            {shed.organization.alertRanges.map(r => (
              <div key={r.metric} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">{r.metric === "TEMPERATURE" ? "Temperatura (°C)" : "Humedad (%)"}</h3>
                <div className="space-y-2">
                  <RangeRow label="Rojo bajo"      value={`< ${r.yellowLowMin}`}               color="red" />
                  <RangeRow label="Amarillo bajo"  value={`${r.yellowLowMin} – ${r.greenMin}`}  color="yellow" />
                  <RangeRow label="Verde (óptimo)" value={`${r.greenMin} – ${r.greenMax}`}      color="green" />
                  <RangeRow label="Amarillo alto"  value={`${r.greenMax} – ${r.yellowHighMax}`} color="yellow" />
                  <RangeRow label="Rojo alto"      value={`> ${r.yellowHighMax}`}               color="red" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Modal: Agregar sensor ── */}
      <Modal open={modal === "node"} title="Agregar sensor" onClose={() => setModal(null)}>
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            Un sensor = un topic MQTT = una sola medida. Temperatura y humedad son sensores separados con IDs diferentes.
          </p>
          <Field label="Nombre">
            <input value={nodeForm.name} onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Temp. Interior 3" />
          </Field>
          <Field label="Hardware ID" description="Topic MQTT — publica solo esta métrica">
            <input value={nodeForm.hardwareId} onChange={e => setNodeForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="TEMP-INT-003" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Métrica">
              <select value={nodeForm.metric} onChange={e => setNodeForm(f => ({ ...f, metric: e.target.value }))} className={selectCls}>
                <option value="TEMPERATURE">Temperatura (°C)</option>
                <option value="HUMIDITY">Humedad (%)</option>
              </select>
            </Field>
            <Field label="Ubicación">
              <select value={nodeForm.type} onChange={e => setNodeForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
                <option value="INTERIOR">Interior</option>
                <option value="EXTERIOR">Exterior</option>
              </select>
            </Field>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveNode} disabled={isPending}>{isPending ? "Guardando..." : "Agregar sensor"}</BtnPrimary>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Agregar bomba ── */}
      <Modal open={modal === "pump"} title="Agregar bomba de agua" onClose={() => setModal(null)}>
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            La bomba recibe comandos on/off por su propio topic MQTT. No publica medidas.
          </p>
          <Field label="Nombre">
            <input value={pumpForm.name} onChange={e => setPumpForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Bomba 3" />
          </Field>
          <Field label="Hardware ID" description="Topic MQTT — recibe 'on' o 'off'">
            <input value={pumpForm.hardwareId} onChange={e => setPumpForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="PUMP-003" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número">
              <input type="number" min="1" value={pumpForm.pumpNumber} onChange={e => setPumpForm(f => ({ ...f, pumpNumber: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Modelo (opcional)">
              <input value={pumpForm.model} onChange={e => setPumpForm(f => ({ ...f, model: e.target.value }))} className={inputCls} placeholder="1/2 HP 2400 L/h" />
            </Field>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={savePump} disabled={isPending}>{isPending ? "Guardando..." : "Agregar bomba"}</BtnPrimary>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Agregar ventilador ── */}
      <Modal open={modal === "fan"} title="Agregar ventilador" onClose={() => setModal(null)}>
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-lg px-3 py-2">
            El ventilador recibe comandos on/off por su propio topic MQTT. No publica medidas.
          </p>
          <Field label="Nombre">
            <input value={fanForm.name} onChange={e => setFanForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Ventilador 3" />
          </Field>
          <Field label="Hardware ID" description="Topic MQTT — recibe 'on' o 'off'">
            <input value={fanForm.hardwareId} onChange={e => setFanForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="FAN-003" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número">
              <input type="number" min="1" value={fanForm.fanNumber} onChange={e => setFanForm(f => ({ ...f, fanNumber: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Modelo / Tamaño (opcional)">
              <input value={fanForm.model} onChange={e => setFanForm(f => ({ ...f, model: e.target.value }))} className={inputCls} placeholder='48" 1200 m³/h' />
            </Field>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveFan} disabled={isPending}>{isPending ? "Guardando..." : "Agregar ventilador"}</BtnPrimary>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Rango de alerta ── */}
      <Modal open={modal === "range"} title="Configurar rango de alerta" onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Métrica">
            <select value={rangeForm.metric} onChange={e => setRangeForm(f => ({ ...f, metric: e.target.value }))} className={selectCls}>
              <option value="TEMPERATURE">Temperatura (°C)</option>
              <option value="HUMIDITY">Humedad (%)</option>
            </select>
          </Field>
          <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] rounded-lg p-3">
            Rojo bajo → Amarillo bajo → <span className="text-emerald-400 font-medium">Verde</span> → Amarillo alto → Rojo alto
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Límite inf. amarillo"><input type="number" step="0.1" value={rangeForm.yellowLowMin} onChange={e => setRangeForm(f => ({ ...f, yellowLowMin: e.target.value }))} className={inputCls} /></Field>
            <Field label="Inicio verde"><input type="number" step="0.1" value={rangeForm.greenMin} onChange={e => setRangeForm(f => ({ ...f, greenMin: e.target.value }))} className={inputCls} /></Field>
            <Field label="Fin verde"><input type="number" step="0.1" value={rangeForm.greenMax} onChange={e => setRangeForm(f => ({ ...f, greenMax: e.target.value }))} className={inputCls} /></Field>
            <Field label="Límite sup. amarillo"><input type="number" step="0.1" value={rangeForm.yellowHighMax} onChange={e => setRangeForm(f => ({ ...f, yellowHighMax: e.target.value }))} className={inputCls} /></Field>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveRange} disabled={isPending}>{isPending ? "Guardando..." : "Guardar rango"}</BtnPrimary>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RangeRow({ label, value, color }: { label: string; value: string; color: "red" | "yellow" | "green" }) {
  const cls = { red: "text-red-400", yellow: "text-yellow-400", green: "text-emerald-400" }[color];
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`text-xs font-medium ${cls}`}>{label}</span>
      <span className="text-[var(--text-secondary)]">{value}</span>
    </div>
  );
}
