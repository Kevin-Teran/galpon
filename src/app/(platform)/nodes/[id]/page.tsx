/**
 * @file page.tsx
 * @route /src/app/(platform)/nodes/[id]/page.tsx
 * @description Detalle de nodo: sensores Exterior/Interior y bomba con edición individual.
 * @author Kevin Mariano
 * @version 3.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { BtnPrimary, IconBtn } from "@/app/_ui/PageHeader";
import { Modal } from "@/app/_ui/Modal";
import { Field, inputCls, selectCls } from "@/app/_ui/Field";
import { IconEye, IconPencil, IconTrash, IconArrowLeft, IconPlus } from "@/app/_ui/Icons";

interface Sensor { id: string; name: string; hardwareId: string; metric: string; side: string; isActive: boolean; }
interface Pump   { id: string; name: string; hardwareId: string; pumpNumber: number; model?: string; isActive: boolean; }
interface NodeDetail {
  id: string; name: string; isActive: boolean; createdAt: string;
  shed: { id: string; name: string };
  sensors: Sensor[];
  pumps:   Pump[];
}

type ModalType = "addSensor" | "editSensor" | "addPump" | "editPump" | "editNode" | null;
type Params    = Promise<{ id: string }>;

const emptySensor = { name: "", hardwareId: "", metric: "TEMPERATURE", side: "EXTERIOR", isActive: "true" };
const emptyPump   = { name: "", hardwareId: "", pumpNumber: "1", model: "", isActive: "true" };

export default function NodeDetailPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [node, setNode]         = useState<NodeDetail | null>(null);
  const [modal, setModal]       = useState<ModalType>(null);
  const [isPending, start]      = useTransition();
  const [error, setError]       = useState<string | null>(null);

  const [sensorForm, setSensorForm]     = useState(emptySensor);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [pumpForm, setPumpForm]         = useState(emptyPump);
  const [editingPump, setEditingPump]   = useState<Pump | null>(null);
  const [editName, setEditName]         = useState("");

  async function load() {
    const r = await fetch(`/api/nodes/${id}`);
    if (r.ok) setNode(await r.json());
  }
  useEffect(() => { load(); }, [id]);

  function act(fn: () => Promise<void>) {
    start(async () => { try { await fn(); } catch { setError("Error inesperado"); } });
  }

  function openAddSensor()         { setSensorForm(emptySensor); setError(null); setModal("addSensor"); }
  function openEditSensor(s: Sensor) {
    setEditingSensor(s);
    setSensorForm({ name: s.name, hardwareId: s.hardwareId, metric: s.metric, side: s.side, isActive: s.isActive ? "true" : "false" });
    setError(null); setModal("editSensor");
  }
  function openAddPump()           { setPumpForm(emptyPump); setError(null); setModal("addPump"); }
  function openEditPump(p: Pump)   {
    setEditingPump(p);
    setPumpForm({ name: p.name, hardwareId: p.hardwareId, pumpNumber: String(p.pumpNumber), model: p.model ?? "", isActive: p.isActive ? "true" : "false" });
    setError(null); setModal("editPump");
  }

  function saveAddSensor() {
    if (!sensorForm.name.trim() || !sensorForm.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    act(async () => {
      const r = await fetch("/api/sensors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodeId: id, name: sensorForm.name, hardwareId: sensorForm.hardwareId, metric: sensorForm.metric, side: sensorForm.side }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); load();
    });
  }

  function saveEditSensor() {
    if (!sensorForm.name.trim() || !sensorForm.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    act(async () => {
      const r = await fetch(`/api/sensors/${editingSensor!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: sensorForm.name, hardwareId: sensorForm.hardwareId, metric: sensorForm.metric, side: sensorForm.side, isActive: sensorForm.isActive === "true" }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); load();
    });
  }

  function saveAddPump() {
    if (!pumpForm.name.trim() || !pumpForm.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    act(async () => {
      const r = await fetch("/api/pumps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodeId: id, name: pumpForm.name, hardwareId: pumpForm.hardwareId, pumpNumber: Number(pumpForm.pumpNumber), model: pumpForm.model || undefined }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); load();
    });
  }

  function saveEditPump() {
    if (!pumpForm.name.trim() || !pumpForm.hardwareId.trim()) { setError("Nombre y Hardware ID obligatorios"); return; }
    act(async () => {
      const r = await fetch(`/api/pumps/${editingPump!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: pumpForm.name, hardwareId: pumpForm.hardwareId, pumpNumber: Number(pumpForm.pumpNumber), model: pumpForm.model || undefined, isActive: pumpForm.isActive === "true" }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); load();
    });
  }

  function saveEditNode() {
    if (!editName.trim()) { setError("Nombre obligatorio"); return; }
    act(async () => {
      const r = await fetch(`/api/nodes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setModal(null); load();
    });
  }

  function del(url: string, msg: string) {
    if (!confirm(msg)) return;
    act(async () => { await fetch(url, { method: "DELETE" }); load(); });
  }

  if (!node) return <p className="text-[var(--text-muted)] text-sm p-4">Cargando...</p>;

  const ext  = node.sensors.filter(s => s.side === "EXTERIOR");
  const int  = node.sensors.filter(s => s.side === "INTERIOR");
  const pump = node.pumps[0] ?? null;

  return (
    <div>
      <Link href={`/sheds/${node.shed.id}`} className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition mb-4">
        <IconArrowLeft size={14} /> {node.shed.name}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{node.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${node.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
              {node.isActive ? "Activo" : "Inactivo"}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{node.sensors.length} sensores · {node.pumps.length > 0 ? "con bomba" : "sin bomba"}</span>
          </div>
        </div>
        <IconBtn icon={<IconPencil />} label="Editar nodo" onClick={() => { setEditName(node.name); setError(null); setModal("editNode"); }} />
      </div>

      {/* ── Sensores ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Sensores ({node.sensors.length}/4)
          </h2>
          {node.sensors.length < 4 && (
            <BtnPrimary onClick={openAddSensor}><IconPlus size={14} /> Agregar sensor</BtnPrimary>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["EXTERIOR","INTERIOR"] as const).map(side => {
            const items = side === "EXTERIOR" ? ext : int;
            return (
              <div key={side} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                <div className={`px-4 py-2.5 border-b border-[var(--border)] ${side === "EXTERIOR" ? "bg-teal-500/5" : "bg-indigo-500/5"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${side === "EXTERIOR" ? "text-teal-400" : "text-indigo-400"}`}>
                    {side === "EXTERIOR" ? "Exterior" : "Interior"}
                  </p>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {items.length === 0 && <p className="px-4 py-3 text-xs text-[var(--text-muted)] italic">Sin sensores</p>}
                  {items.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-subtle)] transition">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${s.metric === "TEMPERATURE" ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"}`}>
                            {s.metric === "TEMPERATURE" ? "Temperatura" : "Humedad"}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                            {s.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name}</p>
                        <p className="font-mono text-xs text-[var(--text-muted)]">{s.hardwareId}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Link href={`/sensors/${s.id}`}><IconBtn icon={<IconEye />} label="Ver trazabilidad" variant="primary" /></Link>
                        <IconBtn icon={<IconPencil />} label="Editar sensor" onClick={() => openEditSensor(s)} />
                        <IconBtn icon={<IconTrash />} label="Eliminar sensor" variant="danger" onClick={() => del(`/api/sensors/${s.id}`, `¿Eliminar sensor "${s.name}"?`)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bomba ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Bomba de riego</h2>
          {!pump && (
            <BtnPrimary onClick={openAddPump}><IconPlus size={14} /> Agregar bomba</BtnPrimary>
          )}
        </div>
        {pump ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 shrink-0">#{pump.pumpNumber}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{pump.name}</p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">{pump.hardwareId}{pump.model ? ` · ${pump.model}` : ""}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${pump.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                  {pump.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconBtn icon={<IconPencil />} label="Editar bomba" onClick={() => openEditPump(pump)} />
                <IconBtn icon={<IconTrash />} label="Eliminar bomba" variant="danger" onClick={() => del(`/api/pumps/${pump.id}`, `¿Eliminar bomba "${pump.name}"?`)} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Sin bomba asignada.</p>
        )}
      </section>

      {/* ── Modales ── */}

      {/* Agregar sensor */}
      <Modal open={modal === "addSensor"} title="Nuevo sensor" onClose={() => setModal(null)}>
        <SensorForm form={sensorForm} setForm={setSensorForm} error={error} onCancel={() => setModal(null)} onSave={saveAddSensor} isPending={isPending} />
      </Modal>

      {/* Editar sensor */}
      <Modal open={modal === "editSensor"} title={`Editar · ${editingSensor?.name ?? ""}`} onClose={() => setModal(null)}>
        <SensorForm form={sensorForm} setForm={setSensorForm} error={error} onCancel={() => setModal(null)} onSave={saveEditSensor} isPending={isPending} showStatus />
      </Modal>

      {/* Agregar bomba */}
      <Modal open={modal === "addPump"} title="Nueva bomba" onClose={() => setModal(null)}>
        <PumpForm form={pumpForm} setForm={setPumpForm} error={error} onCancel={() => setModal(null)} onSave={saveAddPump} isPending={isPending} nodeName={node.name} />
      </Modal>

      {/* Editar bomba */}
      <Modal open={modal === "editPump"} title={`Editar · ${editingPump?.name ?? ""}`} onClose={() => setModal(null)}>
        <PumpForm form={pumpForm} setForm={setPumpForm} error={error} onCancel={() => setModal(null)} onSave={saveEditPump} isPending={isPending} nodeName={node.name} showStatus />
      </Modal>

      {/* Editar nodo */}
      <Modal open={modal === "editNode"} title="Editar nodo" onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Field label="Nombre"><input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} autoFocus /></Field>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(null)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={saveEditNode} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</BtnPrimary>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Formularios reutilizables ── */

type SensorFormState = { name: string; hardwareId: string; metric: string; side: string; isActive: string };

function SensorForm({ form, setForm, error, onCancel, onSave, isPending, showStatus = false }: {
  form: SensorFormState; setForm: React.Dispatch<React.SetStateAction<SensorFormState>>;
  error: string | null; onCancel: () => void; onSave: () => void; isPending: boolean; showStatus?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Nombre">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Temp. Exterior N1" autoFocus />
      </Field>
      <Field label="Hardware ID" description="Topic MQTT — publica un único valor">
        <input value={form.hardwareId} onChange={e => setForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="N1-TEMP-EXT" />
      </Field>
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
      {showStatus && (
        <Field label="Estado">
          <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value }))} className={selectCls}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </Field>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm text-[var(--text-muted)]">Cancelar</button>
        <BtnPrimary onClick={onSave} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</BtnPrimary>
      </div>
    </div>
  );
}

type PumpFormState = { name: string; hardwareId: string; pumpNumber: string; model: string; isActive: string };

function PumpForm({ form, setForm, error, onCancel, onSave, isPending, nodeName, showStatus = false }: {
  form: PumpFormState; setForm: React.Dispatch<React.SetStateAction<PumpFormState>>;
  error: string | null; onCancel: () => void; onSave: () => void; isPending: boolean; nodeName: string; showStatus?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Nombre">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder={`Bomba ${nodeName}`} autoFocus />
      </Field>
      <Field label="Hardware ID" description="Topic MQTT — recibe 'on'/'off'">
        <input value={form.hardwareId} onChange={e => setForm(f => ({ ...f, hardwareId: e.target.value.trim() }))} className={inputCls} placeholder="PUMP-N1" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Número">
          <input type="number" min="1" value={form.pumpNumber} onChange={e => setForm(f => ({ ...f, pumpNumber: e.target.value }))} className={inputCls} />
        </Field>
        <Field label="Modelo">
          <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className={inputCls} placeholder="1/2 HP" />
        </Field>
      </div>
      {showStatus && (
        <Field label="Estado">
          <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value }))} className={selectCls}>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        </Field>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-sm text-[var(--text-muted)]">Cancelar</button>
        <BtnPrimary onClick={onSave} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</BtnPrimary>
      </div>
    </div>
  );
}
