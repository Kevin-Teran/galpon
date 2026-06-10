/**
 * @file page.tsx
 * @route /src/app/(platform)/organizations/page.tsx
 * @description Página CRUD de organizaciones (solo SUPER_ADMIN).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { PageHeader, BtnPrimary, BtnDanger } from "@/app/_ui/PageHeader";
import { Modal } from "@/app/_ui/Modal";
import { Field, inputCls } from "@/app/_ui/Field";

interface Org { id: string; name: string; _count: { sheds: number; users: number }; createdAt: string; }

export default function OrganizationsPage() {
  const [orgs, setOrgs]       = useState<Org[]>([]);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Org | null>(null);
  const [name, setName]       = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [isPending, start]    = useTransition();

  async function load() {
    const r = await fetch("/api/organizations");
    if (r.ok) setOrgs(await r.json());
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setName(""); setError(null); setOpen(true); }
  function openEdit(o: Org) { setEditing(o); setName(o.name); setError(null); setOpen(true); }

  function handleSave() {
    if (!name.trim()) { setError("El nombre es requerido"); return; }
    start(async () => {
      const url    = editing ? `/api/organizations/${editing.id}` : "/api/organizations";
      const method = editing ? "PUT" : "POST";
      const r      = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Error"); return; }
      setOpen(false); load();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta organización? Se eliminarán todos sus galpones y datos.")) return;
    start(async () => { await fetch(`/api/organizations/${id}`, { method: "DELETE" }); load(); });
  }

  return (
    <div>
      <PageHeader
        title="Organizaciones"
        description="Gestiona las fincas u organizaciones registradas"
        action={<BtnPrimary onClick={openCreate}>+ Nueva organización</BtnPrimary>}
      />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Galpones</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Usuarios</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Creada</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[var(--text-muted)]">Sin organizaciones</td></tr>
            )}
            {orgs.map(o => (
              <tr key={o.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] transition">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{o.name}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{o._count.sheds}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{o._count.users}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(o.createdAt).toLocaleDateString("es")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(o)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Editar</button>
                    <BtnDanger onClick={() => handleDelete(o.id)}>Eliminar</BtnDanger>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? "Editar organización" : "Nueva organización"} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Field label="Nombre" error={error ?? undefined}>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Finca El Paraíso" />
          </Field>
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
