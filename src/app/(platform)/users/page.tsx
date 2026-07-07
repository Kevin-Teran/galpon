/**
 * @file page.tsx
 * @route /src/app/(platform)/users/page.tsx
 * @description Gestión de usuarios por organización.
 *              Super Admin: todos los usuarios · Admin: solo su organización.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState, useTransition, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  organization: { name: string } | null;
  createdAt: string;
}
interface OrgRow { id: string; name: string }
interface Me    { id: string; role: string }

interface LogEntry {
  action:     string;
  ipAddress:  string | null;
  userAgent:  string | null;
  statusCode: number | null;
  createdAt:  string;
}
interface ActivityData {
  loginCount:    number;
  activeSessions: number;
  lastLogin:     string | null;
  lastIp:        string | null;
  recentLogs:    LogEntry[] | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN:       "Administrador",
  OPERATOR:    "Operador",
};

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  ADMIN:       "bg-blue-500/10   text-blue-400   ring-blue-500/20",
  OPERATOR:    "bg-slate-500/10  text-slate-400  ring-slate-500/20",
};

const LOG_STYLES: Record<string, { dot: string; label: string }> = {
  LOGIN_SUCCESS:            { dot: "bg-emerald-400", label: "Inicio de sesión"       },
  LOGIN_FAILED:             { dot: "bg-red-400",     label: "Intento fallido"         },
  LOGOUT:                   { dot: "bg-slate-400",   label: "Cierre de sesión"        },
  TOKEN_INVALID:            { dot: "bg-amber-400",   label: "Token inválido"          },
  THEME_CHANGED:            { dot: "bg-blue-400",    label: "Cambio de tema"          },
  PASSWORD_RESET_REQUEST:   { dot: "bg-violet-400",  label: "Solicitud de reset"      },
  PASSWORD_RESET_COMPLETE:  { dot: "bg-violet-400",  label: "Contraseña restablecida" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  if (ip === "::1" || ip === "127.0.0.1") return "localhost";
  return ip;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "Ahora mismo";
  if (mins < 60)  return `hace ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ROLE_BADGE[role] ?? ROLE_BADGE.OPERATOR}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
      <span className="text-sm font-semibold text-amber-400">{name[0]?.toUpperCase()}</span>
    </div>
  );
}

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

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className="w-full rounded-xl border border-(--border) bg-(--bg-subtle) px-3.5 py-2.5 text-sm text-(--text-primary) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition disabled:opacity-50"
    />
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full ${wide ? "md:max-w-lg" : "md:max-w-md"} md:rounded-2xl rounded-t-2xl border border-(--border) bg-(--bg-surface) shadow-2xl max-h-[92dvh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--border) shrink-0">
          {/* Drag handle visual hint — only on small screens */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-(--border) md:hidden" />
          <h3 className="text-sm font-semibold text-(--text-primary)">{title}</h3>
          <button onClick={onClose} className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--bg-subtle)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Scrollable body */}
        <div className="px-5 py-5 space-y-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function SubmitBtn({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button type="submit" disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
    >
      {pending && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
      {pending ? pendingLabel : label}
    </button>
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

// ─── Activity Modal ───────────────────────────────────────────────────────────

function ActivityModal({
  user,
  data,
  loading,
  isSuperAdmin,
  onClose,
}: {
  user:         UserRow;
  data:         ActivityData | null;
  loading:      boolean;
  isSuperAdmin: boolean;
  onClose:      () => void;
}) {
  return (
    <Modal title={`Actividad — ${user.name}`} onClose={onClose} wide>
      {loading || !data ? (
        <div className="flex items-center justify-center h-32 text-(--text-muted) text-sm">Cargando actividad…</div>
      ) : (
        <div className="space-y-5">

          {/* Stat chips */}
          <div className="flex gap-3">
            <StatChip label="Inicios de sesión" value={data.loginCount}     accent="text-amber-400" />
            <StatChip label="Sesiones activas"  value={data.activeSessions} accent={data.activeSessions > 0 ? "text-amber-400" : "text-(--text-primary)"} />
          </div>

          {/* Last login */}
          {data.lastLogin && (
            <div className="rounded-xl border border-(--border) bg-(--bg-subtle) px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-(--text-secondary)">Último acceso</span>
              <div className="text-right">
                <span className="text-(--text-primary) font-medium">{timeAgo(data.lastLogin)}</span>
                {formatIp(data.lastIp) && (
                  <p className="text-[11px] text-(--text-muted) mt-0.5 font-mono">{formatIp(data.lastIp)}</p>
                )}
              </div>
            </div>
          )}

          {/* Full audit log (SA only) */}
          {isSuperAdmin && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-(--text-muted) mb-2">Historial de acciones</p>
              {!data.recentLogs || data.recentLogs.length === 0 ? (
                <p className="text-sm text-(--text-muted) text-center py-4">Sin registros disponibles</p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-(--border) divide-y divide-(--border)">
                  {data.recentLogs.map((log, i) => {
                    const style = LOG_STYLES[log.action] ?? { dot: "bg-slate-400", label: log.action };
                    return (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-(--text-primary) font-medium">{style.label}</p>
                          {formatIp(log.ipAddress) && (
                            <p className="text-[11px] text-(--text-muted) font-mono truncate">{formatIp(log.ipAddress)}</p>
                          )}
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
          )}

          {/* Admin reduced note */}
          {!isSuperAdmin && (
            <p className="text-xs text-(--text-muted) text-center">
              El historial de acciones detallado está disponible para Super Admins.
            </p>
          )}

        </div>
      )}
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]           = useState<UserRow[]>([]);
  const [orgs, setOrgs]             = useState<OrgRow[]>([]);
  const [me, setMe]                 = useState<Me | null>(null);
  const [loading, setLoading]       = useState(true);

  // Filter + pagination
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterOrg, setFilterOrg]   = useState("");
  const [page, setPage]             = useState(0);
  const [pageSize, setPageSize]     = useState(10);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState<UserRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Activity modal
  const [viewingUser, setViewingUser]     = useState<UserRow | null>(null);
  const [activityData, setActivityData]   = useState<ActivityData | null>(null);
  const [activityLoading, setActLoading]  = useState(false);

  // Form error
  const [formErr, setFormErr]       = useState<string | null>(null);

  // Create form
  const [cName, setCName]           = useState("");
  const [cEmail, setCEmail]         = useState("");
  const [cPass, setCPass]           = useState("");
  const [cRole, setCRole]           = useState("OPERATOR");
  const [cOrg, setCOrg]             = useState("");
  const [createPending, startCreate] = useTransition();

  // Edit form
  const [eName, setEName]           = useState("");
  const [eRole, setERole]           = useState("");
  const [eEmail, setEEmail]         = useState("");
  const [eOrg, setEOrg]             = useState("");   // organizationId
  const [eOrgName, setEOrgName]     = useState<string | null>(null);
  const [ePass, setEPass]           = useState("");
  const [ePassShow, setEPassShow]   = useState(false);
  const [editPending, startEdit]    = useTransition();

  // Delete
  const [deletePending, startDelete] = useTransition();

  const isSuperAdmin = me?.role === "SUPER_ADMIN";

  const filtered = useMemo(() => users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole && u.role !== filterRole) return false;
    if (filterOrg && u.organizationId !== filterOrg) return false;
    return true;
  }), [users, search, filterRole, filterOrg]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Reset to page 0 when filters or page size change
  useEffect(() => { setPage(0); }, [search, filterRole, filterOrg, pageSize]);

  const roleOptions = isSuperAdmin
    ? [["SUPER_ADMIN", "Super Admin"], ["ADMIN", "Administrador"], ["OPERATOR", "Operador"]]
    : [["ADMIN", "Administrador"], ["OPERATOR", "Operador"]];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, meRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/auth/me"),
      ]);
      const meData = meRes.ok ? await meRes.json() : null;
      if (uRes.ok)  setUsers(await uRes.json());
      if (meData)   setMe(meData);

      if (meData?.role === "SUPER_ADMIN") {
        const oRes = await fetch("/api/organizations");
        if (oRes.ok) setOrgs(await oRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setCName(""); setCEmail(""); setCPass(""); setCRole("OPERATOR"); setCOrg(orgs[0]?.id ?? "");
    setFormErr(null); setShowCreate(true);
  }

  function openEdit(u: UserRow) {
    setEName(u.name);
    setERole(u.role);
    setEEmail(u.email);
    setEOrg(u.organizationId ?? "");
    setEOrgName(u.organization?.name ?? null);
    setEPass("");
    setEPassShow(false);
    setFormErr(null);
    setEditing(u);
  }

  function handleERoleChange(val: string) {
    setERole(val);
    // Super Admin no tiene org; al cambiar a SA se limpia la selección
    if (val === "SUPER_ADMIN") setEOrg("");
  }

  async function openActivity(u: UserRow) {
    setViewingUser(u);
    setActivityData(null);
    setActLoading(true);
    try {
      const res = await fetch(`/api/users/${u.id}/activity`);
      if (res.ok) setActivityData(await res.json());
    } finally {
      setActLoading(false);
    }
  }

  function handleCRoleChange(val: string) {
    setCRole(val);
    if (val === "SUPER_ADMIN") setCOrg("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setFormErr(null);
    startCreate(async () => {
      const orgId = (isSuperAdmin && cRole !== "SUPER_ADMIN") ? (cOrg || null) : null;
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName, email: cEmail, password: cPass, role: cRole, organizationId: orgId }),
      });
      if (res.ok) { setShowCreate(false); load(); }
      else { const d = await res.json().catch(() => ({})); setFormErr(d.error ?? "Error al crear usuario"); }
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault(); setFormErr(null);
    if (!editing) return;
    const isEditingSelf = editing.id === me?.id;
    startEdit(async () => {
      const body: Record<string, unknown> = { name: eName };
      if (!isEditingSelf) body.role = eRole;
      if (ePass) body.password = ePass;
      // SA puede cambiar org (null cuando rol es SA, id cuando es ADMIN/OPERATOR)
      if (isSuperAdmin) {
        body.organizationId = eRole === "SUPER_ADMIN" ? null : (eOrg || null);
      }
      const res = await fetch(`/api/users/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { setEditing(null); load(); }
      else { const d = await res.json().catch(() => ({})); setFormErr(d.error ?? "Error al actualizar"); }
    });
  }

  async function handleDelete(id: string) {
    startDelete(async () => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) { setDeletingId(null); setUsers(prev => prev.filter(u => u.id !== id)); }
      else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Error al eliminar"); }
    });
  }

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-(--text-muted) shrink-0">
          {isSuperAdmin ? "Todos los usuarios del sistema" : "Usuarios de tu organización"}
        </p>
        <button onClick={openCreate}
          className="shrink-0 flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Crear usuario
        </button>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted) pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo…"
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

        {/* Role filter */}
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="w-full lg:w-auto rounded-xl border border-(--border) bg-(--bg-surface) px-3.5 py-2.5 text-sm text-(--text-primary) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition">
          <option value="">Todos los roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Administrador</option>
          <option value="OPERATOR">Operador</option>
        </select>

        {/* Org filter — SA only */}
        {isSuperAdmin && orgs.length > 0 && (
          <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
            className="w-full lg:w-auto rounded-xl border border-(--border) bg-(--bg-surface) px-3.5 py-2.5 text-sm text-(--text-primary) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition">
            <option value="">Todas las organizaciones</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}

        {/* Page size */}
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
          className="w-full lg:w-auto rounded-xl border border-(--border) bg-(--bg-surface) px-3.5 py-2.5 text-sm text-(--text-primary) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 transition">
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-(--border) bg-(--bg-surface) overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-(--text-muted) text-sm">Cargando usuarios…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-(--text-muted)">
            <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <p className="text-sm">{users.length === 0 ? "No hay usuarios registrados" : "Sin resultados para los filtros aplicados"}</p>
            {users.length > 0 && (
              <button onClick={() => { setSearch(""); setFilterRole(""); setFilterOrg(""); }}
                className="text-xs text-amber-400 hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border)">
                <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Usuario</th>
                <th className="px-4 sm:px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Rol</th>
                {isSuperAdmin && <th className="hidden lg:table-cell px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Organización</th>}
                <th className="hidden sm:table-cell px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Creado</th>
                <th className="px-4 sm:px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-(--text-muted)">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border)">
              {paginated.map(u => {
                const isMe            = u.id === me?.id;
                const isConfirmDelete = deletingId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-(--bg-subtle)/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <p className="font-medium text-(--text-primary) truncate">
                            {u.name}
                            {isMe && (
                              <span className="ml-2 text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded-full px-1.5 py-0.5">tú</span>
                            )}
                          </p>
                          <p className="text-xs text-(--text-muted) truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    {isSuperAdmin && (
                      <td className="hidden lg:table-cell px-5 py-3.5 text-(--text-secondary) text-xs">
                        {u.organization?.name ?? <span className="text-(--text-muted)">—</span>}
                      </td>
                    )}
                    <td className="hidden sm:table-cell px-5 py-3.5 text-xs text-(--text-muted) tabular-nums whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      {isConfirmDelete ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-(--text-muted)">¿Eliminar?</span>
                          <button onClick={() => handleDelete(u.id)} disabled={deletePending}
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
                          {/* View activity */}
                          <button onClick={() => openActivity(u)}
                            className="rounded-lg p-1.5 text-(--text-muted) hover:text-blue-400 hover:bg-blue-500/8 transition-colors" title="Ver actividad">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                          {/* Edit */}
                          <button onClick={() => openEdit(u)}
                            className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          {/* Delete */}
                          {!isMe && (
                            <button onClick={() => setDeletingId(u.id)}
                              className="rounded-lg p-1.5 text-(--text-muted) hover:text-red-400 hover:bg-red-500/8 transition-colors" title="Eliminar">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          )}
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
              {filtered.length === users.length
                ? `${filtered.length} usuario${filtered.length !== 1 ? "s" : ""}`
                : `${filtered.length} de ${users.length} usuario${users.length !== 1 ? "s" : ""}`
              }
              {totalPages > 1 && ` · página ${page + 1} de ${totalPages}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(0)} disabled={page === 0}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Primera página">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
                  </svg>
                </button>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Anterior">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                  .reduce<(number | "…")[]>((acc, i, idx, arr) => {
                    if (idx > 0 && i - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(i);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "…" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-(--text-muted) select-none">…</span>
                    ) : (
                      <button key={item} onClick={() => setPage(item as number)}
                        className={`min-w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                          page === item
                            ? "bg-amber-500/15 text-amber-400 font-semibold"
                            : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle)"
                        }`}>
                        {(item as number) + 1}
                      </button>
                    )
                  )
                }

                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Siguiente">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
                  className="rounded-lg p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Última página">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Crear usuario" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <FieldLabel>Nombre completo</FieldLabel>
              <Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Nombre del usuario" required minLength={2} />
            </div>
            <div>
              <FieldLabel>Correo electrónico</FieldLabel>
              <Input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
            </div>
            <div>
              <FieldLabel>Contraseña inicial</FieldLabel>
              <Input type="password" value={cPass} onChange={e => setCPass(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} />
            </div>
            <div>
              <FieldLabel>Rol</FieldLabel>
              <SelectField value={cRole} onChange={e => handleCRoleChange(e.target.value)}>
                {roleOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </SelectField>
              {cRole === "SUPER_ADMIN" && (
                <p className="mt-1.5 text-[11px] text-(--text-muted)">
                  Super Admin no pertenece a ninguna organización.
                </p>
              )}
            </div>
            {/* Org field: only for SA creating non-SA users; no empty option */}
            {isSuperAdmin && cRole !== "SUPER_ADMIN" && (
              <div>
                <FieldLabel>Organización</FieldLabel>
                <SelectField value={cOrg} onChange={e => setCOrg(e.target.value)} required>
                  {orgs.length === 0
                    ? <option value="">Sin organizaciones disponibles</option>
                    : orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                  }
                </SelectField>
              </div>
            )}
            {formErr && <ErrorMsg text={formErr} />}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowCreate(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-(--text-secondary) hover:bg-(--bg-subtle) transition-colors">
                Cancelar
              </button>
              <SubmitBtn pending={createPending} label="Crear usuario" pendingLabel="Creando…" />
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (() => {
        const isEditingSelf = editing.id === me?.id;
        return (
          <Modal title="Editar usuario" onClose={() => setEditing(null)}>
            <form onSubmit={handleEdit} className="space-y-4">

              {/* Name */}
              <div>
                <FieldLabel>Nombre completo</FieldLabel>
                <Input value={eName} onChange={e => setEName(e.target.value)} required minLength={2} />
              </div>

              {/* Email — readonly */}
              <div>
                <FieldLabel>Correo electrónico</FieldLabel>
                <Input value={eEmail} disabled readOnly className="cursor-not-allowed opacity-60" />
              </div>

              {/* Role — disabled when editing own account */}
              <div>
                <FieldLabel>Rol</FieldLabel>
                <SelectField value={eRole} onChange={e => handleERoleChange(e.target.value)}
                  disabled={isEditingSelf || (!isSuperAdmin && editing.role === "SUPER_ADMIN")}>
                  {roleOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </SelectField>
                {isEditingSelf && (
                  <p className="mt-1.5 text-[11px] text-(--text-muted)">No puedes cambiar tu propio rol.</p>
                )}
              </div>

              {/* Organization */}
              <div>
                <FieldLabel>Organización</FieldLabel>
                {eRole === "SUPER_ADMIN" ? (
                  /* SA nunca tiene org */
                  <Input value="No aplica" disabled readOnly className="cursor-not-allowed opacity-60" />
                ) : isSuperAdmin ? (
                  /* SA puede cambiar la org de cualquier usuario */
                  <SelectField value={eOrg} onChange={e => setEOrg(e.target.value)}>
                    {orgs.length === 0
                      ? <option value="">Sin organizaciones disponibles</option>
                      : orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                    }
                  </SelectField>
                ) : (
                  /* Admin solo ve su org, no puede cambiarla */
                  <Input value={eOrgName ?? "Sin organización"} disabled readOnly className="cursor-not-allowed opacity-60" />
                )}
              </div>

              {/* New password — optional */}
              <div>
                <FieldLabel>Nueva contraseña <span className="text-(--text-muted) font-normal">(dejar vacío para no cambiar)</span></FieldLabel>
                <div className="relative">
                  <Input
                    type={ePassShow ? "text" : "password"}
                    value={ePass}
                    onChange={e => setEPass(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={ePass ? 8 : undefined}
                  />
                  <button type="button" onClick={() => setEPassShow(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) transition-colors">
                    {ePassShow ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {formErr && <ErrorMsg text={formErr} />}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditing(null)}
                  className="rounded-xl px-4 py-2.5 text-sm text-(--text-secondary) hover:bg-(--bg-subtle) transition-colors">
                  Cancelar
                </button>
                <SubmitBtn pending={editPending} label="Guardar cambios" pendingLabel="Guardando…" />
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Activity modal */}
      {viewingUser && (
        <ActivityModal
          user={viewingUser}
          data={activityData}
          loading={activityLoading}
          isSuperAdmin={isSuperAdmin}
          onClose={() => { setViewingUser(null); setActivityData(null); }}
        />
      )}

    </div>
  );
}
