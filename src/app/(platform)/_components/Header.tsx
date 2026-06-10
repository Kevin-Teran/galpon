/**
 * @file Header.tsx
 * @route /src/app/(platform)/_components/Header.tsx
 * @description Cabecera de la plataforma: toggle de tema dark/light + logout.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTheme } from "@/app/_components/ThemeProvider";

export function Header() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { resolved, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolved === "dark" ? "light" : "dark");
  }

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
      <div />
      <div className="flex items-center gap-3">
        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          title={resolved === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition text-base"
        >
          {resolved === "dark" ? "☀" : "☾"}
        </button>

        <div className="w-px h-5 bg-[var(--border)]" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition disabled:opacity-50"
        >
          {isPending ? "Saliendo..." : "Cerrar sesión"}
        </button>
      </div>
    </header>
  );
}
