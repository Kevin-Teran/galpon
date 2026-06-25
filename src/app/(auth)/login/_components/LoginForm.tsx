/**
 * @file LoginForm.tsx
 * @route /src/app/(auth)/login/_components/LoginForm.tsx
 * @description Formulario de inicio de sesión — diseño limpio alineado con panel derecho del login split.
 * @author Kevin Mariano
 * @version 3.0.0
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
  const raw          = searchParams.get("from") ?? "/dashboard";
  const redirectTo   = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  const [isPending, startTransition] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form      = e.currentTarget;
    const email     = (form.elements.namedItem("email")     as HTMLInputElement).value;
    const password  = (form.elements.namedItem("password")  as HTMLInputElement).value;
    const rememberMe = (form.elements.namedItem("rememberMe") as HTMLInputElement).checked;

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, password, rememberMe }),
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
    <form onSubmit={handleSubmit} className="w-full max-w-[360px]">

      {/* Título y subtítulo */}
      <h2 className="text-[28px] font-bold tracking-tight text-(--text-primary) mb-1.5">
        Iniciar sesión
      </h2>
      <p className="text-sm text-(--text-muted) mb-7">
        Accede al panel de monitoreo
      </p>

      {/* Email */}
      <label htmlFor="email" className="block text-xs font-semibold text-(--text-muted) tracking-wide mb-1.5">
        Correo electrónico
      </label>
      <input
        id="email" name="email" type="email"
        autoComplete="email" required
        placeholder="operador@granja.com"
        className="w-full px-4 py-3 rounded-xl border border-(--border) bg-(--bg-subtle) text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 outline-none transition"
      />

      {/* Contraseña */}
      <label htmlFor="password" className="block text-xs font-semibold text-(--text-muted) tracking-wide mt-5 mb-1.5">
        Contraseña
      </label>
      <div className="relative">
        <input
          id="password" name="password"
          type={showPass ? "text" : "password"}
          autoComplete="current-password" required minLength={8}
          placeholder="••••••••"
          className="w-full px-4 py-3 pr-11 rounded-xl border border-(--border) bg-(--bg-subtle) text-sm text-(--text-primary) focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 outline-none transition"
        />
        <button
          type="button"
          aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-secondary) transition-colors p-0.5"
        >
          {showPass ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>
      </div>

      {/* Recordar + olvidé */}
      <div className="flex items-center justify-between mt-5 mb-6">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <span className="relative flex shrink-0 items-center">
            <input id="rememberMe" name="rememberMe" type="checkbox" className="sr-only peer" />
            <span className="block w-[42px] h-[25px] rounded-full border border-(--border) bg-(--bg-subtle) transition-colors duration-200 peer-checked:bg-amber-500 peer-checked:border-amber-500" />
            <span className="absolute left-[3px] top-[3px] w-[19px] h-[19px] rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-[17px]" />
          </span>
          <span className="text-sm font-medium text-(--text-primary)">Recordarme</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-[13px] font-semibold text-amber-500 hover:text-amber-600 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 mb-5">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Botón submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-[15px] rounded-[13px] bg-amber-500 hover:bg-amber-400 text-white font-semibold text-[15px] tracking-[.01em] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Iniciando sesión...
          </>
        ) : "Entrar al panel"}
      </button>

      {/* Copyright */}
      <p className="text-center text-[11.5px] text-(--text-muted) mt-[22px] leading-relaxed">
        © {new Date().getFullYear()} Galpon. Todos los derechos reservados.<br />
        <span className="opacity-80">Desarrollado por Kevin Mariano</span>
      </p>
    </form>
  );
}
