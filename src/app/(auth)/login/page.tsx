/**
 * @file page.tsx
 * @route /src/app/(auth)/login/page.tsx
 * @description Página de inicio de sesión — diseño split: panel de marca a la izquierda, formulario a la derecha.
 * @author Kevin Mariano
 * @version 3.0.0
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
    <>
    <style>{`
      @keyframes auth-flow {
        0%   { left: -8%;  opacity: 0; }
        12%  { opacity: 1; }
        88%  { opacity: 1; }
        100% { left: 108%; opacity: 0; }
      }
    `}</style>
    <div className="flex min-h-screen">

      {/* ── Panel izquierdo: marca ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-[1.1] relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{ background: "linear-gradient(150deg, #f59e0b 0%, #92400e 100%)" }}
      >
        {/* Patrón de puntos */}
        <div
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          aria-hidden
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Logo + nombre */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-[42px] h-[42px] rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(4px)",
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 21V9l9-6 9 6v12" />
              <path d="M9 21v-6h6v6" />
            </svg>
          </div>
          <strong className="text-[21px] font-bold tracking-tight">Galpón</strong>
        </div>

        {/* Cuerpo central */}
        <div className="relative">
          <p className="text-[11px] font-mono tracking-[.18em] uppercase opacity-80 mb-[18px]">
            Enfriamiento evaporativo · monitoreo en vivo
          </p>
          <h1 className="text-[clamp(30px,3.4vw,46px)] font-bold leading-[1.05] tracking-tight mb-[22px] max-w-[14ch]">
            Aire fresco para tus aves, menos energía gastada.
          </h1>

          {/* Tarjeta de sensores */}
          <div
            className="rounded-2xl p-[18px_20px] max-w-[420px]"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="flex items-center justify-between gap-3.5">
              {/* Exterior */}
              <div className="text-center">
                <div className="text-[10px] font-mono tracking-[.14em] opacity-75 mb-0.5">EXTERIOR</div>
                <div className="text-[26px] font-bold leading-none">32.4°</div>
                <div className="text-[11px] opacity-80 mt-0.5">38% HR</div>
              </div>

              {/* Tubería animada */}
              <div
                className="flex-1 h-10 relative rounded-lg overflow-hidden"
                style={{ background: "rgba(255,255,255,0.10)" }}
              >
                <span className="absolute rounded-full bg-white w-[7px] h-[7px]"
                  style={{ top: "8px",  animation: "auth-flow 2.4s linear infinite", animationDelay: "0s" }} />
                <span className="absolute rounded-full bg-white w-[7px] h-[7px]"
                  style={{ top: "18px", animation: "auth-flow 2.4s linear infinite", animationDelay: ".6s" }} />
                <span className="absolute rounded-full bg-white w-[6px] h-[6px]"
                  style={{ top: "25px", animation: "auth-flow 2.4s linear infinite", animationDelay: "1.1s" }} />
                <span className="absolute rounded-full bg-white w-[5px] h-[5px]"
                  style={{ top: "12px", animation: "auth-flow 2.4s linear infinite", animationDelay: "1.6s" }} />
              </div>

              {/* Interior */}
              <div className="text-center">
                <div className="text-[10px] font-mono tracking-[.14em] opacity-75 mb-0.5">INTERIOR</div>
                <div className="text-[26px] font-bold leading-none">26.1°</div>
                <div className="text-[11px] opacity-80 mt-0.5">66% HR</div>
              </div>
            </div>
            <div className="mt-2.5 text-[11px] font-mono text-center opacity-90">
              ↓ 6.3°C al cruzar el panel húmedo
            </div>
          </div>
        </div>

        {/* Pie del panel */}
        <div className="relative text-[11px] font-mono opacity-70">
          5 galpones · 20 nodos · 80 sensores activos
        </div>
      </div>

      {/* ── Panel derecho: formulario ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-10 bg-(--bg-base)">
        <LoginForm />
      </div>

    </div>
    </>
  );
}
