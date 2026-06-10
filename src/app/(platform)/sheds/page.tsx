/**
 * @file page.tsx
 * @route /src/app/(platform)/sheds/page.tsx
 * @description Página CRUD de galpones con acceso a nodos y ventiladores.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader, BtnPrimary, BtnDanger, BtnSecondary } from "@/app/_ui/PageHeader";
import { Modal } from "@/app/_ui/Modal";
import { Field, inputCls } from "@/app/_ui/Field";

interface Shed {
  id: string; name: string; description?: string; location?: string;
  fanCount: number; organization: { name: string };
  _count: { nodes: number; fans: number }; createdAt: string;
}
interface Org { id: string; name: string; }

export default function ShedsPage() {
  const [sheds, setSheds]     = useState<Shed[]>([]);
  const [orgs, setOrgs]       = useState<Org[]>([]);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Shed | null>(null);
  const [isPending, start]    = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [form, setForm]       = useState({ organizationId: "", name: "", description: "", location: "", latitude: "", longitude: "", area: "", fanCount: "0" });

  async function load() {
    const [sr, or] = await Promise.all([fetch("/api/sheds"), fetch("/api/organizations")]);
    if (sr.ok) setSheds(await sr.json());
    if (or.ok) setOrgs(await or.json());
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ organizationId: orgs[0]?.id ?? "", name: "", description: "", location: "", latitude: "", longitude: "", area: "", fanCount: "0" });
    setError(null); setOpen(true);
  }
  function openEdit(s: Shed) {
    setEditing(s);
    setForm({ organizationId: "", name: s.name, description: s.description ?? "", location: s.location ?? "", latitude: "", longitude: "", area: "", fanCount: String(s.fanCount) });
    setError(null); setOpen(true);
  }

  function handleSave() {
    start(async () => {
      const body = editing
        ? { name: form.name, description: form.description, location: form.location, fanCount: Number(form.fanCount) }
        : {
            ...form,
            latitude:  form.latitude  ? Number(form.latitude)  : undefined,
            longitude: form.longitude ? Number(form.longitude) : undefined,
            area:      form.area      ? Number(form.area)      : undefined,
            fanCount:  Number(form.fanCount),
          };
      const url    = editing ? `/api/sheds/${editing.id}` : "/api/sheds";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setOpen(false); load();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar galpón? Se eliminarán todos sus nodos y datos.")) return;
    start(async () => { await fetch(`/api/sheds/${id}`, { method: "DELETE" }); load(); });
  }

  return (
    <div>
      <PageHeader title="Galpones" description="Gestiona los galpones y sus dispositivos"
        action={<BtnPrimary onClick={openCreate}>+ Nuevo galpón</BtnPrimary>} />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              {["Nombre","Organización","Nodos","Fans","Ubicación",""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheds.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-[var(--text-muted)]">Sin galpones</td></tr>
            )}
            {sheds.map(s => (
              <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{s.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{s.organization.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{s._count.nodes}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{s._count.fans}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] truncate max-w-[160px]">{s.location ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Link href={`/sheds/${s.id}`}><BtnSecondary>Ver</BtnSecondary></Link>
                    <button onClick={() => openEdit(s)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Editar</button>
                    <BtnDanger onClick={() => handleDelete(s.id)}>Eliminar</BtnDanger>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? "Editar galpón" : "Nuevo galpón"} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          {!editing && (
            <Field label="Organización">
              <select value={form.organizationId} onChange={e => setForm(f => ({ ...f, organizationId: e.target.value }))} className={inputCls}>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Nombre"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Galpón 1" /></Field>
          <Field label="Descripción"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></Field>
          <Field label="Ubicación (texto)"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} placeholder="Bloque A — Sede Principal" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitud"><input type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} className={inputCls} placeholder="10.3910" /></Field>
            <Field label="Longitud"><input type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} className={inputCls} placeholder="-75.4794" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Área (m²)"><input type="number" step="0.1" min="0" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className={inputCls} placeholder="500" /></Field>
            <Field label="Ventiladores"><input type="number" min="0" value={form.fanCount} onChange={e => setForm(f => ({ ...f, fanCount: e.target.value }))} className={inputCls} /></Field>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition">Cancelar</button>
            <BtnPrimary onClick={handleSave} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</BtnPrimary>
          </div>
        </div>
      </Modal>
    </div>
  );
}
