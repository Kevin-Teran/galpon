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
      onClick={toggle}
      title={
        isOverridden
          ? `Volver al tema del sistema (${resolved === "dark" ? "oscuro" : "claro"})`
          : `Cambiar a modo ${resolved === "dark" ? "claro" : "oscuro"}`
      }
      className="w-9.5 h-9.5 shrink-0 rounded-[10px] border border-(--border) bg-(--bg-surface) text-(--text-primary) flex items-center justify-center cursor-pointer hover:bg-(--bg-subtle) transition-colors"
    >
      {resolved === "dark" ? (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
