/**
 * @file page.tsx
 * @route /src/app/(auth)/forgot-password/page.tsx
 * @description Página para solicitar el restablecimiento de contraseña.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 text-sm text-(--text-muted) hover:text-(--text-secondary) transition-colors group"
    >
      <svg
        className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Volver al inicio de sesión
    </Link>
  );
}

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-(--bg-base)">
    <div className="w-full max-w-[420px] space-y-8">
      {/* Logo + título */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl scale-125" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-lg">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z"
              />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--text-primary)">
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Recibirás un enlace en tu correo electrónico
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/5 bg-(--bg-surface)/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/3">
        {sent ? (
          /* Estado: enviado */
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-lg" />
              <div className="relative w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-(--text-secondary) leading-relaxed max-w-xs">
              Si el correo está registrado, recibirás el enlace en los próximos minutos. Revisa también tu carpeta de spam.
            </p>
            <BackToLogin />
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-(--text-secondary)">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </span>
                <input
                  id="email" name="email" type="email" required
                  placeholder="usuario@ejemplo.com"
                  className="w-full rounded-xl border border-(--border) bg-(--bg-subtle) pl-10 pr-4 py-2.5 text-sm text-(--text-primary) focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={isPending}
              className="w-full rounded-xl bg-linear-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 hover:bg-linear-to-r hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-(--bg-surface) active:scale-[0.98]"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </span>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </button>

            <div className="flex justify-center">
              <BackToLogin />
            </div>
          </form>
        )}
      </div>
    </div>
    </div>
  );
}
