/**
 * @file layout.tsx
 * @route /src/app/(auth)/layout.tsx
 * @description Layout para páginas de autenticación.
 * @author Kevin Mariano
 * @version 4.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { ThemeToggle } from "@/app/_components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex-1 flex flex-col items-center px-4 py-10 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.10) 0%, transparent 60%),
          radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
        backgroundSize: "auto, 26px 26px",
      }}
    >
      {/* Blobs decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-56 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-emerald-500/6 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-64 h-64 rounded-full bg-emerald-600/4 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-teal-600/4 blur-3xl" />
      </div>

      {/* Toggle de tema — esquina superior derecha */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="relative z-10 w-full max-w-105">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center space-y-0.5">
        <p className="text-xs text-(--text-muted)">
          © {new Date().getFullYear()} Galpon. Todos los derechos reservados.
        </p>
        <p className="text-xs text-(--text-muted)/60">
          Desarrollado por Kevin Mariano
        </p>
      </footer>
    </main>
  );
}
