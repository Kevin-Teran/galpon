/**
 * @file ThemeToggle.tsx
 * @route /src/app/_components/ThemeToggle.tsx
 * @description Switch visual de tema dark/light.
 *              OFF = sigue el tema del sistema.
 *              ON  = override al opuesto del tema del sistema.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  const isOverridden = theme !== "system";

  function toggle() {
    const next: "DARK" | "LIGHT" | "SYSTEM" = isOverridden
      ? "SYSTEM"
      : resolved === "dark" ? "LIGHT" : "DARK";

    setTheme(next.toLowerCase() as "dark" | "light" | "system");

    // Persistir en DB si el usuario está autenticado (best-effort)
    fetch("/api/auth/theme", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ theme: next }),
    }).catch(() => { /* ignorar si no está autenticado */ });
  }

  return (
    <button
      role="switch"
      aria-checked={isOverridden}
      onClick={toggle}
      title={
        isOverridden
          ? `Volver al tema del sistema (${resolved === "dark" ? "oscuro" : "claro"})`
          : `Cambiar a modo ${resolved === "dark" ? "claro" : "oscuro"}`
      }
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-(--bg-surface) ${
        isOverridden
          ? "bg-slate-700 border-slate-600"
          : "bg-(--bg-subtle) border-(--border)"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-white shadow-md transition-transform duration-300 mt-0.5 ${
          isOverridden ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      >
        {resolved === "dark" ? (
          <svg className="w-2.5 h-2.5 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="w-2.5 h-2.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  );
}
