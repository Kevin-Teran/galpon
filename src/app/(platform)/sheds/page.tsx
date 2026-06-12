/**
 * @file page.tsx
 * @route /src/app/(platform)/sheds/page.tsx
 * @description Lista y CRUD de galpones.
 * @author Kevin Mariano
 * @version 3.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader, BtnPrimary, BtnDanger, IconBtn } from "@/app/_ui/PageHeader";
import { Modal } from "@/app/_ui/Modal";
import { Field, inputCls } from "@/app/_ui/Field";
import { IconEye, IconPencil, IconTrash, IconSettings, IconPlus } from "@/app/_ui/Icons";

interface Shed {
  id: string; name: string; description?: string; location?: string; mapsUrl?: string;
  area?: number;
  organization: { name: string };
  _count: { nodes: number; fans: number };
}
interface Org { id: string; name: string; }

const emptyForm = { organizationId: "", name: "", description: "", location: "", mapsUrl: "", area: "" };

export default function ShedsPage() {
  const [sheds, setSheds]     = useState<Shed[]>([]);
  const [orgs, setOrgs]       = useState<Org[]>([]);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Shed | null>(null);
  const [isPending, start]    = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [form, setForm]       = useState(emptyForm);

  async function load() {
    const [sr, or] = await Promise.all([fetch("/api/sheds"), fetch("/api/organizations")]);
    if (sr.ok) setSheds(await sr.json());
    if (or.ok) setOrgs(await or.json());
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, organizationId: orgs[0]?.id ?? "" });
    setError(null); setOpen(true);
  }
  function openEdit(s: Shed) {
    setEditing(s);
    setForm({ organizationId: "", name: s.name, description: s.description ?? "", location: s.location ?? "", mapsUrl: s.mapsUrl ?? "", area: s.area ? String(s.area) : "" });
    setError(null); setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    start(async () => {
      const shared = { name: form.name, description: form.description || undefined, location: form.location || undefined, mapsUrl: form.mapsUrl || undefined, area: form.area ? Number(form.area) : undefined };
      const body = editing ? shared : { organizationId: form.organizationId, ...shared };
      const r = await fetch(editing ? `/api/sheds/${editing.id}` : "/api/sheds", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setOpen(false); load();
    });
  }

  function handleDelete(s: Shed) {
    if (!confirm(`¿Eliminar "${s.name}"? Se borrarán todos sus nodos, sensores y datos.`)) return;
    start(async () => { await fetch(`/api/sheds/${s.id}`, { method: "DELETE" }); load(); });
  }

  return (
    <div>
      <PageHeader title="Galpones" description="Gestiona los galpones de la organización"
        action={<BtnPrimary onClick={openCreate}><IconPlus size={15} /> Nuevo galpón</BtnPrimary>} />

      {/* Tarjetas en móvil, tabla en desktop */}
      <div className="block sm:hidden space-y-3">
        {sheds.length === 0 && <p className="text-center py-10 text-[var(--text-muted)] text-sm">Sin galpones</p>}
        {sheds.map(s => (
          <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{s.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.organization.name}</p>
              </div>
              <div className="flex gap-1">
                <Link href={`/sheds/${s.id}`}><IconBtn icon={<IconEye />} label="Trazabilidad" variant="primary" /></Link>
                <Link href={`/sheds/${s.id}?tab=nodes`}><IconBtn icon={<IconSettings />} label="Gestionar" /></Link>
                <IconBtn icon={<IconPencil />} label="Editar" onClick={() => openEdit(s)} />
                <IconBtn icon={<IconTrash />} label="Eliminar" variant="danger" onClick={() => handleDelete(s)} />
              </div>
            </div>
            <div className="flex gap-3 text-xs text-[var(--text-muted)] flex-wrap">
              <span>{s._count.nodes} nodos</span>
              <span>{s._count.fans} ventiladores</span>
              {s.area && <span>{s.area} m²</span>}
              {s.location && <span className="truncate">{s.location}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              {["Galpón","Organización","Nodos","Ventiladores","Área","Ubicación",""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheds.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-[var(--text-muted)]">Sin galpones</td></tr>
            )}
            {sheds.map(s => (
              <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{s.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{s.organization.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{s._count.nodes}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{s._count.fans}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{s.area ? `${s.area} m²` : "—"}</td>
                <td className="px-4 py-3 text-[var(--text-muted)] max-w-[160px] truncate">
                  {s.mapsUrl
                    ? <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">{s.location || "Ver mapa"}</a>
                    : (s.location ?? "—")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/sheds/${s.id}`}><IconBtn icon={<IconEye />} label="Ver galpón" variant="primary" /></Link>
                    <IconBtn icon={<IconPencil />} label="Editar" onClick={() => openEdit(s)} />
                    <IconBtn icon={<IconTrash />} label="Eliminar" variant="danger" onClick={() => handleDelete(s)} />
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
          <Field label="Nombre">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Galpón 1" />
          </Field>
          <Field label="Descripción">
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Dirección">
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} placeholder="Sede principal, bloque A" />
          </Field>
          <Field label="Enlace Google Maps">
            <input type="url" value={form.mapsUrl} onChange={e => setForm(f => ({ ...f, mapsUrl: e.target.value }))} className={inputCls} placeholder="https://maps.app.goo.gl/..." />
          </Field>
          <Field label="Área (m²)">
            <input type="number" step="0.1" min="0" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className={inputCls} placeholder="500" />
          </Field>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">Cancelar</button>
            <BtnPrimary onClick={handleSave} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</BtnPrimary>
          </div>
        </div>
      </Modal>
    </div>
  );
}
