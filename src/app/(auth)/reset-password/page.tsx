/**
 * @file page.tsx
 * @route /src/app/(auth)/reset-password/page.tsx
 * @description Página para ingresar la nueva contraseña con el token de reset.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [isPending, startTransition] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-[var(--danger)]">Enlace inválido o expirado.</p>
        <Link href="/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-400 transition">
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
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Nueva contraseña</label>
        <div className="relative">
          <input
            id="password" name="password" type={showPass ? "text" : "password"}
            required minLength={8}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 pr-11 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            placeholder="Mínimo 8 caracteres"
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition">
            {showPass ? "Ocultar" : "Ver"}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Confirmar contraseña</label>
        <input
          id="confirm" name="confirm" type={showPass ? "text" : "password"}
          required minLength={8}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          placeholder="Repite la contraseña"
        />
      </div>
      {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-[var(--danger)]">{error}</p>}
      <button type="submit" disabled={isPending} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
        {isPending ? "Guardando..." : "Establecer nueva contraseña"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/20 mb-4">
          <span className="text-2xl text-emerald-400">🔑</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Nueva contraseña</h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Elige una contraseña segura</p>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-xl">
        <Suspense fallback={<div className="text-center text-sm text-[var(--text-muted)]">Cargando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
