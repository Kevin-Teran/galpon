/**
 * @file page.tsx
 * @route /src/app/(auth)/reset-password/page.tsx
 * @description Página para ingresar la nueva contraseña con el token de reset.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function EyeIcon({ open }: { open: boolean }) {
  if (open) return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [isPending, startTransition] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 w-full">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-400">Enlace inválido o expirado.</p>
        </div>
        <Link href="/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form     = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm  = (form.elements.namedItem("confirm")  as HTMLInputElement).value;
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }

    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Error al restablecer la contraseña");
        return;
      }
      router.push("/login?reset=ok");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nueva contraseña */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-(--text-secondary)">
          Nueva contraseña
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </span>
          <input
            id="password" name="password"
            type={showPass ? "text" : "password"}
            required minLength={8}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-xl border border-(--border) bg-(--bg-subtle) pl-10 pr-11 py-2.5 text-sm text-(--text-primary) focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-secondary) transition-colors p-0.5"
          >
            <EyeIcon open={showPass} />
          </button>
        </div>
      </div>

      {/* Confirmar contraseña */}
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-medium text-(--text-secondary)">
          Confirmar contraseña
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-muted)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </span>
          <input
            id="confirm" name="confirm"
            type={showPass ? "text" : "password"}
            required minLength={8}
            placeholder="Repite la contraseña"
            className="w-full rounded-xl border border-(--border) bg-(--bg-subtle) pl-10 pr-4 py-2.5 text-sm text-(--text-primary) focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
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
        className="w-full rounded-xl bg-linear-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 hover:bg-linear-to-r hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-(--bg-surface) active:scale-[0.98]"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando...
          </span>
        ) : "Establecer nueva contraseña"}
      </button>

      <div className="flex justify-center">
        <BackToLogin />
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full space-y-8">
      {/* Logo + título */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl scale-125" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 shadow-lg">
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--text-primary)">
            Nueva contraseña
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/5 bg-(--bg-surface)/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/3">
        <Suspense fallback={
          <div className="flex items-center justify-center py-8 text-sm text-(--text-muted)">
            <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
