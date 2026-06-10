/**
 * @file page.tsx
 * @route /src/app/(auth)/login/page.tsx
 * @description Página de inicio de sesión. Redirige al dashboard si ya hay sesión activa.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 * @copyright Galpon
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "./_components/LoginForm";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("access_token")?.value) redirect("/dashboard");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/20 mb-4">
          <span className="text-2xl text-emerald-400">⬡</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Galpon
        </h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Plataforma de monitoreo de galpones
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
