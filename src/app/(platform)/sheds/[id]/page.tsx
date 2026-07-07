/**
 * @file page.tsx
 * @route /src/app/(platform)/sheds/[id]/page.tsx
 * @description Detalle de galpón: trazabilidad, gestión de nodos/ventiladores y rangos de alerta.
 * @author Kevin Mariano
 * @version 8.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BtnPrimary, BtnDanger, BtnSecondary, IconBtn } from "@/app/_ui/PageHeader";
import { Modal } from "@/app/_ui/Modal";
import { Field, inputCls, selectCls } from "@/app/_ui/Field";
import { IconEye, IconPencil, IconTrash, IconSettings, IconArrowLeft, IconPlus } from "@/app/_ui/Icons";

/* ── Tipos ── */
interface Sensor     { id: string; name: string; hardwareId: string; metric: string; side: string; isActive: boolean; }
interface Pump       { id: string; name: string; hardwareId: string; pumpNumber: number; model?: string; }
interface Fan        { id: string; name: string; hardwareId: string; fanNumber: number; model?: string; isActive: boolean; }
interface Node       { id: string; name: string; isActive: boolean; sensors: Sensor[]; pumps: Pump[]; }
interface AlertRange { metric: string; yellowLowMin: number; greenMin: number; greenMax: number; yellowHighMax: number; }
interface ShedDetail {
  id: string; name: string; location?: string; mapsUrl?: string; area?: number;
  organizationId: string;
  organization: { name: string; alertRanges: AlertRange[] };
  nodes: Node[];
  fans:  Fan[];
}
interface StatsData {
  alerts: { total: number; open: number };
  devices: { events: DeviceEvent[]; totalDurationByType: Record<string, number> };
  measurements: Measurement[];
}
interface Measurement { sensorId: string; value: number; metric: string; timestamp: string; sensor: { name: string }; }
interface DeviceEvent { id: string; deviceType: string; deviceHardwareId: string; reason: string; startedAt: string; endedAt?: string; durationSeconds?: number; }

type Tab    = "activity" | "nodes" | "fans" | "ranges";
type Params = Promise<{ id: string }>;

const emptyNode   = { name: "" };
const emptySensor = { name: "", hardwareId: "", metric: "TEMPERATURE", side: "EXTERIOR" };
const emptyPump   = { name: "", hardwareId: "", pumpNumber: "1", model: "" };
const emptyFan    = { name: "", hardwareId: "", fanNumber: "1", model: "" };
const emptyRange  = { metric: "TEMPERATURE", yellowLowMin: "16", greenMin: "20", greenMax: "32", yellowHighMax: "38" };

export default function ShedDetailPage({ params }: { params: Params }) {
  const { id }       = use(params);
  const searchParams = useSearchParams();
  const router       = useRouter();

  const initialTab   = (searchParams.get("tab") as Tab) ?? "activity";
  const [shed, setShed]     = useState<ShedDetail | null>(null);
  const [stats, setStats]   = useState<StatsData | null>(null);
  const [tab, setTab]       = useState<Tab>(initialTab);
  const [modal, setModal]   = useState<"node" | "devices" | "fan" | "range" | null>(null);
  const [isPending, start]  = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [addingType, setAddingType] = useState<"sensor" | "pump" | null>(null);

  const [nodeForm,   setNodeForm]   = useState(emptyNode);
  const [sensorForm, setSensorForm] = useState(emptySensor);
  const [pumpForm,   setPumpForm]   = useState(emptyPump);
  const [fanForm,    setFanForm]    = useState(emptyFan);
  const [rangeForm,  setRangeForm]  = useState(emptyRange);

  async function load() {
    const r = await fetch(`/api/sheds/${id}`);
    if (!r.ok) return;
    const data: ShedDetail = await r.json();
    setShed(data);
    if (activeNode) setActiveNode(data.nodes.find(n => n.id === activeNode.id) ?? null);
  }

  async function loadStats() {
    const r = await fetch(`/api/statistics?shedId=${id}`);
    if (r.ok) setStats(await r.json());
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === "activity") loadStats(); }, [tab, id]);

  function changeTab(t: Tab) {
    setTab(t);
    const url = new URL(window.location.href);
    if (t === "activity") url.searchParams.delete("tab");
    else url.searchParams.set("tab", t);
    router.replace(url.pathname + url.search, { scroll: false });
  }

  function openDevices(node: Node) { setActiveNode(node); setAddingType(null); setError(null); setModal("devices"); }

  function act(fn: () => Promise<void>) {
    start(async () => { try { await fn(); } catch { setError("Error inesperado"); } });
  }

  function saveNode() {
    if (!nodeForm.name.trim()) { setError("Nombre obligatorio"); return; }
    act(async () => {
      const r = await fetch("/api/nodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shedId: id, name: nodeForm.name }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); setNodeForm(emptyNode); load();
    });
  }
  function saveSensor() {
    if (!sensorForm.name.trim() || !sensorForm.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    act(async () => {
      const r = await fetch("/api/sensors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodeId: activeNode!.id, ...sensorForm }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setSensorForm(emptySensor); setAddingType(null); setError(null); load();
    });
  }
  function savePump() {
    if (!pumpForm.name.trim() || !pumpForm.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    act(async () => {
      const r = await fetch("/api/pumps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodeId: activeNode!.id, name: pumpForm.name, hardwareId: pumpForm.hardwareId, pumpNumber: Number(pumpForm.pumpNumber), model: pumpForm.model || undefined }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setPumpForm(emptyPump); setAddingType(null); setError(null); load();
    });
  }
  function saveFan() {
    if (!fanForm.name.trim() || !fanForm.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    act(async () => {
      const r = await fetch("/api/fans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shedId: id, name: fanForm.name, hardwareId: fanForm.hardwareId, fanNumber: Number(fanForm.fanNumber), model: fanForm.model || undefined }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); setFanForm(emptyFan); load();
    });
  }
  function saveRange() {
    act(async () => {
      const r = await fetch("/api/alert-ranges", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: shed!.organizationId, metric: rangeForm.metric, yellowLowMin: Number(rangeForm.yellowLowMin), greenMin: Number(rangeForm.greenMin), greenMax: Number(rangeForm.greenMax), yellowHighMax: Number(rangeForm.yellowHighMax) }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); load();
    });
  }
  function del(url: string, msg: string) {
    if (!confirm(msg)) return;
    act(async () => { await fetch(url, { method: "DELETE" }); load(); });
  }

  if (!shed) return <p className="text-[var(--text-muted)] text-sm p-4">Cargando...</p>;

  const TABS = [
    { key: "activity", label: "Trazabilidad" },
    { key: "nodes",    label: `Nodos (${shed.nodes.length})` },
    { key: "fans",     label: `Ventiladores (${shed.fans.length})` },
    { key: "ranges",   label: "Alertas" },
  ] as const;

  return (
    <div>
      {/* Cabecera */}
      <Link href="/sheds" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition mb-4">
        <IconArrowLeft size={14} /> Galpones
      </Link>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{shed.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-[var(--text-secondary)]">
            <span>{shed.organization.name}</span>
            {shed.location && <span>· {shed.location}</span>}
            {shed.area     && <span>· {shed.area} m²</span>}
          </div>
        </div>
        {shed.mapsUrl && (
          <a href={shed.mapsUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-500 hover:text-amber-400 transition mt-1">
            Ver mapa ↗
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mb-5 border-b border-[var(--border)] overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => changeTab(t.key as Tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${tab === t.key ? "border-amber-500 text-amber-500" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Trazabilidad ── */}
      {tab === "activity" && (
        <div className="space-y-5">
          {/* Tarjetas resumen */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Alertas activas"   value={stats.alerts.open}   accent="text-red-400" />
              <StatCard label="Total alertas"     value={stats.alerts.total}  accent="text-yellow-400" />
              <StatCard label="Eventos bomba"     value={stats.devices.totalDurationByType["PUMP"] ? `${Math.round(stats.devices.totalDurationByType["PUMP"] / 60)} min` : "0"} accent="text-violet-400" />
              <StatCard label="Eventos ventilador" value={stats.devices.totalDurationByType["FAN"] ? `${Math.round(stats.devices.totalDurationByType["FAN"] / 60)} min` : "0"} accent="text-teal-400" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Mediciones recientes */}
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Mediciones recientes
              </h2>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                      <th className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">Sensor</th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">Valor</th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!stats || stats.measurements.length === 0
                      ? <tr><td colSpan={3} className="text-center py-6 text-xs text-[var(--text-muted)]">Sin mediciones en el último minuto</td></tr>
                      : stats.measurements.slice(0, 30).map((m, i) => (
                          <tr key={`${m.sensorId}-${m.timestamp}`} className={`border-b border-[var(--border)] transition ${i === 0 ? "bg-[var(--bg-subtle)]" : "hover:bg-[var(--bg-subtle)]"}`}>
                            <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)] truncate max-w-[120px]">{m.sensor.name}</td>
                            <td className="px-4 py-2.5 font-mono font-semibold text-xs">
                              {m.value.toFixed(1)}{m.metric === "TEMPERATURE" ? " °C" : " %"}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">
                              {new Date(m.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Eventos de dispositivos */}
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Eventos de dispositivos
              </h2>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                      <th className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">Dispositivo</th>
                      <th className="text-left px-4 py-2 font-medium text-[var(--text-secondary)]">Razón</th>
                      <th className="text-right px-4 py-2 font-medium text-[var(--text-secondary)]">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!stats || stats.devices.events.length === 0
                      ? <tr><td colSpan={3} className="text-center py-6 text-xs text-[var(--text-muted)]">Sin eventos registrados</td></tr>
                      : stats.devices.events.slice(0, 20).map(e => (
                          <tr key={e.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${e.deviceType === "PUMP" ? "bg-violet-500/10 text-violet-400" : "bg-teal-500/10 text-teal-400"}`}>
                                  {e.deviceType === "PUMP" ? "Bomba" : "Ventilador"}
                                </span>
                                <span className="font-mono text-xs text-[var(--text-muted)] truncate">{e.deviceHardwareId}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{e.reason}</td>
                            <td className="px-4 py-2.5 text-right text-xs font-mono text-[var(--text-muted)]">
                              {e.durationSeconds != null ? `${Math.round(e.durationSeconds)}s` : "—"}
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Nodos overview rápido */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Nodos</h2>
              <button onClick={() => changeTab("nodes")} className="text-xs text-amber-500 hover:text-amber-400 transition">Gestionar →</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shed.nodes.map(n => (
                <Link key={n.id} href={`/nodes/${n.id}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 hover:bg-[var(--bg-subtle)] transition block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-[var(--text-primary)]">{n.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${n.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                      {n.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{n.sensors.length} sensores · {n.pumps.length > 0 ? "con bomba" : "sin bomba"}</p>
                </Link>
              ))}
              {shed.nodes.length === 0 && <p className="text-xs text-[var(--text-muted)] col-span-3">Sin nodos — <button onClick={() => changeTab("nodes")} className="text-amber-500 hover:underline">ir a gestión</button></p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Gestión de Nodos ── */}
      {tab === "nodes" && (
        <>
          <div className="flex justify-end mb-4">
            <BtnPrimary onClick={() => { setError(null); setNodeForm(emptyNode); setModal("node"); }}>
              <IconPlus size={15} /> Agregar nodo
            </BtnPrimary>
          </div>
          <div className="space-y-3">
            {shed.nodes.length === 0 && <p className="text-center py-10 text-[var(--text-muted)] text-sm">Sin nodos</p>}
            {shed.nodes.map(node => {
              const ext  = node.sensors.filter(s => s.side === "EXTERIOR");
              const int  = node.sensors.filter(s => s.side === "INTERIOR");
              const pump = node.pumps[0] ?? null;
              return (
                <div key={node.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{node.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${node.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {node.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/nodes/${node.id}`}><IconBtn icon={<IconEye />} label="Ver nodo" variant="primary" /></Link>
                      <IconBtn icon={<IconSettings />} label="Gestionar dispositivos" onClick={() => openDevices(node)} />
                      <IconBtn icon={<IconTrash />} label="Eliminar nodo" variant="danger" onClick={() => del(`/api/nodes/${node.id}`, `¿Eliminar "${node.name}" y todos sus sensores y bomba?`)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
                    <SensorGroup label="Exterior" sensors={ext} cls="text-teal-400" />
                    <SensorGroup label="Interior" sensors={int} cls="text-indigo-400" />
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1.5">Bomba</p>
                      {pump
                        ? <p className="text-xs text-[var(--text-primary)]">{pump.name} <span className="font-mono text-[var(--text-muted)]">{pump.hardwareId}</span></p>
                        : <p className="text-xs text-[var(--text-muted)] italic">Sin bomba</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Ventiladores ── */}
      {tab === "fans" && (
        <>
          <div className="flex justify-end mb-4">
            <BtnPrimary onClick={() => { setError(null); setFanForm({ ...emptyFan, fanNumber: String(shed.fans.length + 1) }); setModal("fan"); }}>
              <IconPlus size={15} /> Agregar ventilador
            </BtnPrimary>
          </div>
          <div className="block sm:hidden space-y-2">
            {shed.fans.length === 0 && <p className="text-center py-8 text-[var(--text-muted)] text-sm">Sin ventiladores</p>}
            {shed.fans.map(f => (
              <div key={f.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{f.name}</p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">{f.hardwareId}{f.model ? ` · ${f.model}` : ""}</p>
                </div>
                <IconBtn icon={<IconTrash />} label="Eliminar" variant="danger" onClick={() => del(`/api/fans/${f.id}`, `¿Eliminar "${f.name}"?`)} />
              </div>
            ))}
          </div>
          <div className="hidden sm:block rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                {["#","Nombre","Hardware ID","Modelo","Estado",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {shed.fans.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">Sin ventiladores</td></tr>}
                {shed.fans.map(f => (
                  <tr key={f.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                    <td className="px-4 py-3 text-[var(--text-muted)]">{f.fanNumber}</td>
                    <td className="px-4 py-3 font-medium">{f.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{f.hardwareId}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{f.model ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                        {f.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <IconBtn icon={<IconTrash />} label="Eliminar" variant="danger" onClick={() => del(`/api/fans/${f.id}`, `¿Eliminar "${f.name}"?`)} />
                    </td>
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
          <div className="flex justify-end mb-3">
            <BtnPrimary onClick={() => { setError(null); setModal("range"); }}>Configurar rango</BtnPrimary>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shed.organization.alertRanges.length === 0 && <p className="text-[var(--text-muted)] text-sm col-span-2">Sin rangos configurados</p>}
            {shed.organization.alertRanges.map(r => (
              <div key={r.metric} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                <h3 className="font-semibold mb-4">{r.metric === "TEMPERATURE" ? "Temperatura (°C)" : "Humedad (%)"}</h3>
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

      {/* ── Modales ── */}
      <Modal open={modal === "node"} title="Nuevo nodo" onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Nombre"><input value={nodeForm.name} onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Nodo 1" autoFocus /></Field>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveNode} disabled={isPending}>{isPending ? "Guardando..." : "Crear"}</BtnPrimary>
          </div>
        </div>
      </Modal>

      <Modal open={modal === "devices" && !!activeNode} title={activeNode?.name ?? ""} onClose={() => { setModal(null); setActiveNode(null); setAddingType(null); }}>
        {activeNode && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Sensores ({activeNode.sensors.length}/4)</p>
                {activeNode.sensors.length < 4 && addingType !== "sensor" && (
                  <button onClick={() => { setSensorForm(emptySensor); setAddingType("sensor"); setError(null); }} className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-medium transition"><IconPlus size={12} /> Sensor</button>
                )}
              </div>
              {(["EXTERIOR","INTERIOR"] as const).map(side => {
                const items = activeNode.sensors.filter(s => s.side === side);
                if (!items.length) return null;
                return (
                  <div key={side} className="mb-2">
                    <p className="text-xs text-[var(--text-muted)] mb-1">{side === "EXTERIOR" ? "Exterior" : "Interior"}</p>
                    {items.map(s => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-subtle)] px-3 py-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <MetricBadge metric={s.metric} />
                          <span className="text-sm truncate">{s.name}</span>
                          <span className="font-mono text-xs text-[var(--text-muted)] hidden sm:inline">{s.hardwareId}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link href={`/sensors/${s.id}`}><IconBtn icon={<IconEye />} label="Ver sensor" variant="primary" /></Link>
                          <IconBtn icon={<IconTrash />} label="Eliminar sensor" variant="danger" onClick={() => del(`/api/sensors/${s.id}`, `¿Eliminar "${s.name}"?`)} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {activeNode.sensors.length === 0 && addingType !== "sensor" && <p className="text-xs text-[var(--text-muted)]">Sin sensores.</p>}
              {addingType === "sensor" && (
                <div className="mt-2 rounded-lg border border-[var(--border)] p-4 space-y-3">
                  <Field label="Nombre"><input value={sensorForm.name} onChange={e => setSensorForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Temp. Exterior N1" autoFocus /></Field>
                  <Field label="Hardware ID" description="Topic MQTT"><input value={sensorForm.hardwareId} onChange={e => setSensorForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="N1-TEMP-EXT" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Métrica">
                      <select value={sensorForm.metric} onChange={e => setSensorForm(f => ({ ...f, metric: e.target.value }))} className={selectCls}>
                        <option value="TEMPERATURE">Temperatura</option>
                        <option value="HUMIDITY">Humedad</option>
                      </select>
                    </Field>
                    <Field label="Posición">
                      <select value={sensorForm.side} onChange={e => setSensorForm(f => ({ ...f, side: e.target.value }))} className={selectCls}>
                        <option value="EXTERIOR">Exterior</option>
                        <option value="INTERIOR">Interior</option>
                      </select>
                    </Field>
                  </div>
                  {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setAddingType(null); setError(null); }} className="text-xs text-[var(--text-muted)]">Cancelar</button>
                    <BtnPrimary onClick={saveSensor} disabled={isPending}>{isPending ? "..." : "Agregar"}</BtnPrimary>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--border)]" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Bomba</p>
                {activeNode.pumps.length === 0 && addingType !== "pump" && (
                  <button onClick={() => { setPumpForm(emptyPump); setAddingType("pump"); setError(null); }} className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-medium transition"><IconPlus size={12} /> Bomba</button>
                )}
              </div>
              {activeNode.pumps.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 shrink-0">#{p.pumpNumber}</span>
                    <span className="text-sm truncate">{p.name}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)] hidden sm:inline">{p.hardwareId}</span>
                  </div>
                  <IconBtn icon={<IconTrash />} label="Eliminar bomba" variant="danger" onClick={() => del(`/api/pumps/${p.id}`, `¿Eliminar bomba "${p.name}"?`)} />
                </div>
              ))}
              {activeNode.pumps.length === 0 && addingType !== "pump" && <p className="text-xs text-[var(--text-muted)]">Sin bomba.</p>}
              {addingType === "pump" && (
                <div className="mt-2 rounded-lg border border-[var(--border)] p-4 space-y-3">
                  <Field label="Nombre"><input value={pumpForm.name} onChange={e => setPumpForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Bomba N1" autoFocus /></Field>
                  <Field label="Hardware ID" description="Topic MQTT"><input value={pumpForm.hardwareId} onChange={e => setPumpForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="PUMP-N1" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Número"><input type="number" min="1" value={pumpForm.pumpNumber} onChange={e => setPumpForm(f => ({ ...f, pumpNumber: e.target.value }))} className={inputCls} /></Field>
                    <Field label="Modelo"><input value={pumpForm.model} onChange={e => setPumpForm(f => ({ ...f, model: e.target.value }))} className={inputCls} placeholder="1/2 HP" /></Field>
                  </div>
                  {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setAddingType(null); setError(null); }} className="text-xs text-[var(--text-muted)]">Cancelar</button>
                    <BtnPrimary onClick={savePump} disabled={isPending}>{isPending ? "..." : "Agregar"}</BtnPrimary>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modal === "fan"} title="Nuevo ventilador" onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Nombre"><input value={fanForm.name} onChange={e => setFanForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Ventilador 1" autoFocus /></Field>
          <Field label="Hardware ID" description="Topic MQTT — envía 'on'/'off'"><input value={fanForm.hardwareId} onChange={e => setFanForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="FAN-001" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número"><input type="number" min="1" value={fanForm.fanNumber} onChange={e => setFanForm(f => ({ ...f, fanNumber: e.target.value }))} className={inputCls} /></Field>
            <Field label="Modelo"><input value={fanForm.model} onChange={e => setFanForm(f => ({ ...f, model: e.target.value }))} className={inputCls} /></Field>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveFan} disabled={isPending}>{isPending ? "Guardando..." : "Crear"}</BtnPrimary>
          </div>
        </div>
      </Modal>

      <Modal open={modal === "range"} title="Rango de alerta" onClose={() => setModal(null)}>
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
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveRange} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</BtnPrimary>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Sub-componentes ── */

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function SensorGroup({ label, sensors, cls }: { label: string; sensors: { id: string; hardwareId: string; metric: string }[]; cls: string }) {
  return (
    <div className="px-4 py-3">
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${cls}`}>{label}</p>
      {sensors.length === 0
        ? <p className="text-xs text-[var(--text-muted)] italic">—</p>
        : sensors.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 mb-1">
              <MetricBadge metric={s.metric} />
              <span className="font-mono text-xs text-[var(--text-muted)] truncate">{s.hardwareId}</span>
            </div>
          ))}
    </div>
  );
}

function MetricBadge({ metric }: { metric: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${metric === "TEMPERATURE" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>
      {metric === "TEMPERATURE" ? "T°" : "H%"}
    </span>
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
