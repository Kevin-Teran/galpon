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
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";

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

export function Header() {
  const pathname = usePathname();
  const { title, subtitle } = getPageInfo(pathname);

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-(--border) bg-(--bg-surface)/95 backdrop-blur-md shrink-0 gap-3 sticky top-0 z-20">
      {/* Left — page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[19px] font-bold tracking-tight text-(--text-primary) truncate">{title}</h1>
        {subtitle && (
          <p className="hidden md:flex items-center gap-1.5 text-xs text-(--text-muted) truncate mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[breathe_2s_ease_infinite]" />
            {subtitle}
          </p>
        )}
      </div>

      {/* Right — tema, alertas, perfil */}
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
