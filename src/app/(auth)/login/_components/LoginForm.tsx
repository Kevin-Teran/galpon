/**
 * @file LoginForm.tsx
 * @route /src/app/(auth)/login/_components/LoginForm.tsx
 * @description Formulario de inicio de sesión con recordar sesión y enlace a recuperar contraseña.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get("from") ?? "/dashboard";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email      = (form.elements.namedItem("email")      as HTMLInputElement).value;
    const password   = (form.elements.namedItem("password")   as HTMLInputElement).value;
    const rememberMe = (form.elements.namedItem("rememberMe") as HTMLInputElement).checked;

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, rememberMe }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Error al iniciar sesión");
          return;
        }
        router.push(redirectTo);
        router.refresh();
      } catch {
        setError("Error de conexión. Intenta nuevamente.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-xl space-y-5"
    >
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          Correo electrónico
        </label>
        <input
          id="email" name="email" type="email" autoComplete="email" required
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          placeholder="usuario@ejemplo.com"
        />
      </div>

      {/* Contraseña */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[var(--text-secondary)]">
            Contraseña
          </label>
          <Link href="/forgot-password" className="text-xs text-emerald-500 hover:text-emerald-400 transition">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password" name="password"
            type={showPass ? "text" : "password"}
            autoComplete="current-password" required minLength={8}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 pr-11 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition text-sm"
          >
            {showPass ? "Ocultar" : "Ver"}
          </button>
        </div>
      </div>

      {/* Recordar sesión */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          id="rememberMe" name="rememberMe" type="checkbox"
          className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-subtle)] accent-emerald-500"
        />
        <span className="text-sm text-[var(--text-secondary)]">Recordar sesión</span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        type="submit" disabled={isPending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
