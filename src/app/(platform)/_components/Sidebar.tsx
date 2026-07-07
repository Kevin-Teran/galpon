/**
 * @file Sidebar.tsx
 * @route /src/app/(platform)/_components/Sidebar.tsx
 * @description Barra lateral de navegación de la plataforma (visible en escritorio, lg+).
 *              El perfil/cerrar sesión viven en el dropdown de la barra superior (Header).
 * @author Kevin Mariano
 * @version 4.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, PATHS } from "./nav-items";

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function Icon({ d, className = "w-4.5 h-4.5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 shrink-0 flex flex-col border-r border-(--border) bg-(--bg-surface) overflow-y-auto">

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-(--border) shrink-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
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
              className={`group flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm transition-all duration-150 ${
                active
                  ? "bg-amber-500/10 text-amber-400 font-semibold"
                  : "text-(--text-secondary) font-medium hover:bg-(--bg-subtle) hover:text-(--text-primary)"
              }`}
            >
              <span className={`shrink-0 transition-transform duration-150 ${active ? "" : "group-hover:scale-110"}`}>
                <Icon d={PATHS[item.icon]} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
