/**
 * @file page.tsx
 * @route /src/app/(auth)/forgot-password/page.tsx
 * @description Página para solicitar el restablecimiento de contraseña.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;

    startTransition(async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Error al procesar la solicitud");
        return;
      }
      setSent(true);
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/20 mb-4">
          <span className="text-2xl text-emerald-400">✉</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Recuperar contraseña</h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Recibirás un enlace en tu correo
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-xl">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto text-emerald-400 text-xl">✓</div>
            <p className="text-sm text-[var(--text-secondary)]">
              Si el correo está registrado recibirás el enlace en los próximos minutos. Revisa tu bandeja de spam.
            </p>
            <Link href="/login" className="block text-sm text-emerald-500 hover:text-emerald-400 transition">
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email" name="email" type="email" required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-[var(--danger)]">{error}</p>
            )}
            <button
              type="submit" disabled={isPending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
            <Link href="/login" className="block text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition">
              ← Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
