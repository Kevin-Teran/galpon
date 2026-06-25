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

import { AuthGuard } from "./_components/AuthGuard";
import { PlatformShell } from "./_components/PlatformShell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PlatformShell>{children}</PlatformShell>
    </AuthGuard>
  );
}
