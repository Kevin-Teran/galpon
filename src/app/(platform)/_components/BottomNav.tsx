/**
 * @file BottomNav.tsx
 * @route /src/app/(platform)/_components/BottomNav.tsx
 * @description Barra de navegación inferior fija para pantallas chicas (mobile), con hoja "Más".
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/app/_ui/Modal";
import { BOTTOM_NAV_HREFS, MORE_NAV_ITEMS, NAV_ITEMS, PATHS } from "./nav-items";

function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => (BOTTOM_NAV_HREFS as readonly string[]).includes(item.href));

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoutPending, startLogout] = useTransition();

  function handleLogout() {
    startLogout(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    });
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreActive = MORE_NAV_ITEMS.some((item) => isActive(item.href)) || pathname.startsWith("/profile");

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex bg-(--bg-surface)/95 backdrop-blur-md border-t border-(--border)"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        {PRIMARY_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-amber-400" : "text-(--text-muted)"
              }`}
            >
              <Icon d={PATHS[item.icon]} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
            moreActive ? "text-amber-400" : "text-(--text-muted)"
          }`}
        >
          <Icon d={PATHS.more} />
          Más
        </button>
      </nav>

      <Modal open={moreOpen} title="Más" onClose={() => setMoreOpen(false)}>
        <div className="space-y-1">
          {MORE_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-amber-500/10 text-amber-400 font-semibold"
                  : "text-(--text-secondary) font-medium hover:bg-(--bg-subtle) hover:text-(--text-primary)"
              }`}
            >
              <Icon d={PATHS[item.icon]} />
              {item.label}
            </Link>
          ))}

          <Link
            href="/profile"
            onClick={() => setMoreOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              pathname.startsWith("/profile")
                ? "bg-amber-500/10 text-amber-400 font-semibold"
                : "text-(--text-secondary) font-medium hover:bg-(--bg-subtle) hover:text-(--text-primary)"
            }`}
          >
            <Icon d={PATHS.profile} />
            Mi perfil
          </Link>

          <button
            onClick={handleLogout}
            disabled={logoutPending}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-(--text-muted) hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-50"
          >
            <Icon d={PATHS.logout} />
            {logoutPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      </Modal>
    </>
  );
}
