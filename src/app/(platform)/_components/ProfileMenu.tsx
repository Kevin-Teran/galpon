/**
 * @file ProfileMenu.tsx
 * @route /src/app/(platform)/_components/ProfileMenu.tsx
 * @description Avatar + nombre + rol en la barra superior, con menú desplegable
 *              (mi perfil / cerrar sesión).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ROLE_LABELS } from "./nav-items";

export function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [open, setOpen] = useState(false);
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
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full border border-(--border) bg-(--bg-surface) hover:bg-(--bg-subtle) transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[13px] shrink-0">
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-[13px] font-semibold text-(--text-primary) leading-tight">{user?.name ?? "Cargando…"}</div>
          <div className="text-[10.5px] font-semibold text-amber-500 leading-tight">{user ? ROLE_LABELS[user.role] ?? user.role : ""}</div>
        </div>
        <svg className="hidden sm:block w-3.5 h-3.5 text-(--text-muted)" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-11 right-0 z-40 w-62 rounded-2xl border border-(--border) bg-(--bg-surface) shadow-lg p-2">
            <div className="px-3 pt-1.5 pb-3 mb-1.5 border-b border-(--border)">
              <div className="text-sm font-semibold text-(--text-primary)">{user?.name}</div>
              <div className="text-xs text-(--text-muted)">{user?.email}</div>
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-(--text-primary) hover:bg-(--bg-subtle) transition-colors"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Mi perfil
            </Link>
            <button
              onClick={handleLogout}
              disabled={logoutPending}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/8 transition-colors disabled:opacity-50"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16 17 5-5-5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
              {logoutPending ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
