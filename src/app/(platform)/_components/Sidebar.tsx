/**
 * @file Sidebar.tsx
 * @route /src/app/(platform)/_components/Sidebar.tsx
 * @description Barra lateral de navegación de la plataforma.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/monitoring", label: "Monitoreo", icon: "◎" },
  { href: "/sheds", label: "Galpones", icon: "⬡" },
  { href: "/alerts", label: "Alertas", icon: "⚠" },
  { href: "/statistics", label: "Estadísticas", icon: "↗" },
  { href: "/organizations", label: "Organizaciones", icon: "⬙" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-lg font-bold text-white tracking-tight">Galpon</span>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-600/20 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
