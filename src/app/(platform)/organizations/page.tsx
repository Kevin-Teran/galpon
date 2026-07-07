/**
 * @file page.tsx
 * @route /src/app/(platform)/organizations/page.tsx
 * @description Gestión de organizaciones (solo SUPER_ADMIN).
 * @author Kevin Mariano
 * @version 3.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgRow {
  id:          string;
  name:        string;
  description: string | null;
  location:    string | null;
  phone:       string | null;
  _count:      { sheds: number; users: number };
  createdAt:   string;
}

interface LogEntry {
  action:     string;
  ipAddress:  string | null;
  statusCode: number | null;
  createdAt:  string;
  user:       { name: string } | null;
}

interface OrgSummary {
  activeSessionCount: number;
  openAlertCount:     number;
  recentLogs:         LogEntry[] | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOG_STYLES: Record<string, { dot: string; label: string }> = {
  LOGIN_SUCCESS:           { dot: "bg-emerald-400", label: "Inicio de sesión"       },
  LOGIN_FAILED:            { dot: "bg-red-400",     label: "Intento fallido"         },
  LOGOUT:                  { dot: "bg-slate-400",   label: "Cierre de sesión"        },
  TOKEN_INVALID:           { dot: "bg-amber-400",   label: "Token inválido"          },
  THEME_CHANGED:           { dot: "bg-blue-400",    label: "Cambio de tema"          },
  PASSWORD_RESET_REQUEST:  { dot: "bg-violet-400",  label: "Solicitud de reset"      },
  PASSWORD_RESET_COMPLETE: { dot: "bg-violet-400",  label: "Contraseña restablecida" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "Ahora mismo";
  if (mins < 60) return `hace ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function formatIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  if (ip === "::1" || ip === "127.0.0.1") return "localhost";
  return ip;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-(--text-secondary) mb-1.5">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full rounded-xl border border-(--border) bg-(--bg-subtle) px-3.5 py-2.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition disabled:opacity-50"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} rows={3}
      className="w-full rounded-xl border border-(--border) bg-(--bg-subtle) px-3.5 py-2.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition resize-none"
    />
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full ${wide ? "md:max-w-lg" : "md:max-w-md"} md:rounded-2xl rounded-t-2xl border border-(--border) bg-(--bg-surface) shadow-2xl max-h-[92dvh] flex flex-col`}>
        <div className="md:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-(--border)" />
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--border) shrink-0">
          <h3 className="text-sm font-semibold text-(--text-primary)">{title}</h3>
          <button onClick={onClose} className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--bg-subtle)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-5 space-y-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {text}
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex-1 rounded-xl border border-(--border) bg-(--bg-subtle) px-4 py-3 text-center">
      <p className={`text-xl font-bold ${accent ?? "text-(--text-primary)"}`}>{value}</p>
      <p className="text-xs text-(--text-muted) mt-0.5">{label}</p>
    </div>
  );
}

// ─── Summary Modal ────────────────────────────────────────────────────────────

function SummaryModal({ org, onClose }: { org: OrgRow; onClose: () => void }) {
  const [data, setData]       = useState<OrgSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organizations/${org.id}/summary`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [org.id]);

  return (
    <Modal title={`Resumen — ${org.name}`} onClose={onClose} wide>
      {loading || !data ? (
        <div className="flex items-center justify-center h-32 text-(--text-muted) text-sm">Cargando resumen…</div>
      ) : (
        <div className="space-y-5">

          {/* Info chips */}
          {(org.description || org.location || org.phone) && (
            <div className="rounded-xl border border-(--border) bg-(--bg-subtle) px-4 py-3 space-y-1.5">
              {org.description && <p className="text-sm text-(--text-secondary)">{org.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--text-muted)">
                {org.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {org.location}
                  </span>
                )}
                {org.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    {org.phone}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-3">
            <StatChip label="Galpones"        value={org._count.sheds}        accent="text-emerald-400" />
            <StatChip label="Usuarios"         value={org._count.users}        accent="text-blue-400"    />
            <StatChip label="Sesiones activas" value={data.activeSessionCount} accent={data.activeSessionCount > 0 ? "text-emerald-400" : undefined} />
            <StatChip label="Alertas abiertas" value={data.openAlertCount}     accent={data.openAlertCount > 0 ? "text-amber-400" : undefined} />
          </div>

          {/* Recent audit trail */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-(--text-muted) mb-2">Actividad reciente</p>
            {!data.recentLogs || data.recentLogs.length === 0 ? (
              <p className="text-sm text-(--text-muted) text-center py-4">Sin registros de actividad</p>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-(--border) divide-y divide-(--border)">
                {data.recentLogs.map((log, i) => {
                  const style = LOG_STYLES[log.action] ?? { dot: "bg-slate-400", label: log.action };
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-(--text-primary) font-medium">{style.label}</p>
                        <p className="text-[11px] text-(--text-muted) truncate">
                          {log.user?.name ?? "Usuario eliminado"}
                          {formatIp(log.ipAddress) && <span className="font-mono ml-1">· {formatIp(log.ipAddress)}</span>}
                        </p>
                      </div>
                      <span className="text-[11px] text-(--text-muted) whitespace-nowrap shrink-0 pt-0.5">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrganizationsPage() {
  const [orgs, setOrgs]         = useState<OrgRow[]>([]);
  const [loading, setLoading]   = useState(true);

  // Modals
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<OrgRow | null>(null);
  const [viewingOrg, setViewingOrg] = useState<OrgRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [fName, setFName]           = useState("");
  const [fDesc, setFDesc]           = useState("");
  const [fLocation, setFLocation]   = useState("");
  const [fPhone, setFPhone]         = useState("");
  const [formErr, setFormErr]       = useState<string | null>(null);
  const [savePending, startSave]    = useTransition();
  const [deletePending, startDelete] = useTransition();

  // Filter + pagination
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/organizations");
      if (r.ok) setOrgs(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    orgs.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.location ?? "").toLowerCase().includes(search.toLowerCase())),
    [orgs, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice(page * pageSize, (page + 1) * pageSize);
  useEffect(() => { setPage(0); }, [search, pageSize]);

  function openCreate() {
    setEditing(null);
    setFName(""); setFDesc(""); setFLocation(""); setFPhone("");
    setFormErr(null); setShowForm(true);
  }

  function openEdit(o: OrgRow) {
    setEditing(o);
    setFName(o.name); setFDesc(o.description ?? ""); setFLocation(o.location ?? ""); setFPhone(o.phone ?? "");
    setFormErr(null); setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setFormErr(null);
    startSave(async () => {
      const url    = editing ? `/api/organizations/${editing.id}` : "/api/organizations";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        fName.trim(),
          description: fDesc.trim()     || null,
          location:    fLocation.trim() || null,
          phone:       fPhone.trim()    || null,
        }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setFormErr(d.error ?? "Error al guardar"); return; }
      setShowForm(false); load();
    });
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      await fetch(`/api/organizations/${id}`, { method: "DELETE" });
      setDeletingId(null);
      setOrgs(prev => prev.filter(o => o.id !== id));
    });
  }

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-(--text-muted) shrink-0">Fincas y organizaciones registradas en el sistema</p>
        <button onClick={openCreate}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva organización
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted) pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ubicación…"
            className="w-full rounded-xl border border-(--border) bg-(--bg-surface) pl-9 pr-8 py-2.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) transition-colors p-0.5 rounded">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
          className="rounded-xl border border-(--border) bg-(--bg-surface) px-3.5 py-2.5 text-sm text-(--text-primary) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition">
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-(--border) bg-(--bg-surface) overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-(--text-muted) text-sm">Cargando organizaciones…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-(--text-muted)">
            <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <p className="text-sm">{orgs.length === 0 ? "No hay organizaciones registradas" : "Sin resultados para la búsqueda"}</p>
            {orgs.length > 0 && (
              <button onClick={() => setSearch("")} className="text-xs text-amber-400 hover:underline">Limpiar búsqueda</button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border)">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Organización</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Galpones</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Usuarios</th>
                <th className="hidden md:table-cell px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Ubicación</th>
                <th className="hidden sm:table-cell px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Creada</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {paginated.map(o => {
                const isConfirmDelete = deletingId === o.id;
                return (
                  <tr key={o.id} className="hover:bg-(--bg-subtle)/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-(--text-primary) truncate">{o.name}</p>
                          {o.description && (
                            <p className="text-xs text-(--text-muted) truncate max-w-48">{o.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-(--text-primary)">{o._count.sheds}</span>
                      <span className="text-xs text-(--text-muted) ml-1">galpón{o._count.sheds !== 1 ? "es" : ""}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-(--text-primary)">{o._count.users}</span>
                      <span className="text-xs text-(--text-muted) ml-1">usuario{o._count.users !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-xs text-(--text-muted)">
                      {o.location
                        ? <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                            {o.location}
                          </span>
                        : <span className="text-(--text-muted)">—</span>
                      }
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5 text-xs text-(--text-muted) tabular-nums whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      {isConfirmDelete ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-(--text-muted)">¿Eliminar?</span>
                          <button onClick={() => handleDelete(o.id)} disabled={deletePending}
                            className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                            Sí
                          </button>
                          <button onClick={() => setDeletingId(null)}
                            className="rounded-lg bg-(--bg-subtle) px-2.5 py-1 text-xs font-semibold text-(--text-secondary) hover:bg-(--bg-base) transition-colors">
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver resumen */}
                          <button onClick={() => setViewingOrg(o)}
                            className="rounded-lg p-1.5 text-(--text-muted) hover:text-blue-400 hover:bg-blue-500/8 transition-colors" title="Ver resumen">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                          {/* Editar */}
                          <button onClick={() => openEdit(o)}
                            className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          {/* Eliminar */}
                          <button onClick={() => setDeletingId(o.id)}
                            className="rounded-lg p-1.5 text-(--text-muted) hover:text-red-400 hover:bg-red-500/8 transition-colors" title="Eliminar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-(--border) text-sm">
            <p className="text-(--text-muted) tabular-nums">
              {filtered.length === orgs.length
                ? `${filtered.length} organización${filtered.length !== 1 ? "es" : ""}`
                : `${filtered.length} de ${orgs.length}`
              }
              {totalPages > 1 && ` · pág. ${page + 1} de ${totalPages}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(0)} disabled={page === 0}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
                  </svg>
                </button>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                  .reduce<(number | "…")[]>((acc, i, idx, arr) => {
                    if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(i); return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "…"
                      ? <span key={`e-${idx}`} className="px-1 text-(--text-muted) select-none">…</span>
                      : <button key={item} onClick={() => setPage(item as number)}
                          className={`min-w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === item ? "bg-amber-500/15 text-amber-400 font-semibold" : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle)"}`}>
                          {(item as number) + 1}
                        </button>
                  )
                }
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <Modal title={editing ? "Editar organización" : "Nueva organización"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <FieldLabel>Nombre <span className="text-red-400">*</span></FieldLabel>
              <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="Finca El Paraíso" required minLength={2} autoFocus />
            </div>
            <div>
              <FieldLabel>Descripción <span className="text-(--text-muted) font-normal">(opcional)</span></FieldLabel>
              <Textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Breve descripción de la organización o finca…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Ubicación</FieldLabel>
                <Input value={fLocation} onChange={e => setFLocation(e.target.value)} placeholder="Ciudad, Región" />
              </div>
              <div>
                <FieldLabel>Teléfono</FieldLabel>
                <Input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="+57 300 000 0000" />
              </div>
            </div>
            {formErr && <ErrorMsg text={formErr} />}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-(--text-secondary) hover:bg-(--bg-subtle) transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={savePending}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
              >
                {savePending && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {savePending ? "Guardando…" : editing ? "Guardar cambios" : "Crear organización"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Summary modal */}
      {viewingOrg && (
        <SummaryModal org={viewingOrg} onClose={() => setViewingOrg(null)} />
      )}

    </div>
  );
}
