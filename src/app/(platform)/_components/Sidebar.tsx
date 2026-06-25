/**
 * @file Sidebar.tsx
 * @route /src/app/(platform)/_components/Sidebar.tsx
 * @description Barra lateral de navegación de la plataforma.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function Icon({ d, className = "w-4.5 h-4.5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const PATHS = {
  dashboard:     "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
  monitoring:    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
  sheds:         "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z",
  alerts:        "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",
  statistics:    "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
  organizations: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  users:         "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z",
} as const;

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",       icon: "dashboard"     },
  { href: "/monitoring",    label: "Monitoreo",       icon: "monitoring"    },
  { href: "/sheds",         label: "Galpones",        icon: "sheds"         },
  { href: "/alerts",        label: "Alertas",         icon: "alerts"        },
  { href: "/statistics",    label: "Estadísticas",    icon: "statistics"    },
  { href: "/organizations", label: "Organizaciones",  icon: "organizations" },
  { href: "/users",         label: "Usuarios",        icon: "users"         },
] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN:       "Administrador",
  OPERATOR:    "Operador",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [logoutPending, startLogout] = useTransition();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(setUser)
      .catch(() => {});
  }, []);

  function handleLogout() {
    startLogout(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    });
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="h-full w-64 shrink-0 flex flex-col border-r border-(--border) bg-(--bg-surface) overflow-y-auto">

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-(--border) shrink-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <span className="text-base font-semibold tracking-tight text-(--text-primary)">Galpon</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-(--text-muted)">
          Navegación
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-(--text-secondary) hover:bg-(--bg-subtle) hover:text-(--text-primary)"
              }`}
            >
              <span className={`shrink-0 transition-transform duration-150 ${active ? "" : "group-hover:scale-110"}`}>
                <Icon d={PATHS[item.icon]} />
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-(--border) shrink-0 space-y-1">

        {/* Profile link */}
        <Link
          href="/profile"
          onClick={onClose}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
            pathname.startsWith("/profile")
              ? "bg-emerald-500/10"
              : "hover:bg-(--bg-subtle)"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-emerald-400">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate leading-tight transition-colors ${
              pathname.startsWith("/profile") ? "text-emerald-400" : "text-(--text-primary) group-hover:text-(--text-primary)"
            }`}>
              {user?.name ?? "Cargando…"}
            </p>
            <p className="text-[11px] text-(--text-muted) truncate leading-tight mt-0.5">
              {user ? ROLE_LABELS[user.role] ?? user.role : ""}
            </p>
          </div>
          <svg className={`w-3.5 h-3.5 shrink-0 transition-colors ${pathname.startsWith("/profile") ? "text-emerald-400" : "text-(--text-muted) group-hover:text-(--text-secondary)"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </Link>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={logoutPending}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-(--text-muted) hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 disabled:opacity-50 group"
        >
          <svg className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          {logoutPending ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>

      </div>
    </aside>
  );
}
