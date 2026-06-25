/**
 * @file Header.tsx
 * @route /src/app/(platform)/_components/Header.tsx
 * @description Cabecera de la plataforma: título de página + toggle de tema.
 * @author Kevin Mariano
 * @version 3.1.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":     { title: "Dashboard",      subtitle: "Resumen general de la operación"    },
  "/monitoring":    { title: "Monitoreo",       subtitle: "Datos en tiempo real de sensores"   },
  "/sheds":         { title: "Galpones",        subtitle: "Instalaciones y configuración"       },
  "/alerts":        { title: "Alertas",         subtitle: "Eventos y notificaciones activas"   },
  "/statistics":    { title: "Estadísticas",    subtitle: "Historial y análisis de datos"      },
  "/organizations": { title: "Organizaciones",  subtitle: "Gestión de cuentas y accesos"       },
  "/profile":       { title: "Mi perfil",       subtitle: "Configuración de cuenta y seguridad" },
  "/users":         { title: "Usuarios",        subtitle: "Gestión de accesos por organización"  },
};

function getPageInfo(pathname: string) {
  for (const [prefix, info] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return info;
  }
  return { title: "Galpon", subtitle: "" };
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { title, subtitle } = getPageInfo(pathname);

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-(--border) bg-(--bg-surface) shrink-0 gap-3">
      {/* Left — hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — only on mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0 p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-subtle) transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-base font-semibold text-(--text-primary) truncate">{title}</h1>
          {subtitle && (
            <>
              <span className="hidden md:block w-px h-3.5 bg-(--border) shrink-0" />
              <p className="hidden md:block text-sm text-(--text-muted) truncate">{subtitle}</p>
            </>
          )}
        </div>
      </div>

      {/* Right — theme toggle */}
      <ThemeToggle />
    </header>
  );
}
