/**
 * @file page.tsx
 * @route /src/app/(auth)/login/page.tsx
 * @description Página de inicio de sesión. Redirige al dashboard si ya hay sesión activa.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "./_components/LoginForm";

export const metadata = { title: "Iniciar sesión — Galpon" };

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("access_token")?.value) redirect("/dashboard");

  return (
    <div className="w-full space-y-8">
      {/* Logo + título */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          {/* Glow exterior */}
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl scale-125" />
          {/* Contenedor del ícono */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 shadow-lg">
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="currentColor"
              aria-hidden
            >
              {/* Trending-up: representa monitoreo en tiempo real */}
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
              />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--text-primary)">
            Galpon
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Plataforma de monitoreo de galpones
          </p>
        </div>
      </div>

      <LoginForm />
    </div>
  );
}
