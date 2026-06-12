/**
 * @file layout.tsx
 * @route /src/app/(platform)/layout.tsx
 * @description Layout de la plataforma protegida: sidebar + header + área de contenido.
 *              Intercepta respuestas 401 globalmente y redirige al login limpiando la sesión.
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { Sidebar } from "./_components/Sidebar";
import { Header } from "./_components/Header";
import { AuthGuard } from "./_components/AuthGuard";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
