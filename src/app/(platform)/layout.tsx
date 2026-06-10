/**
 * @file layout.tsx
 * @route /src/app/(platform)/layout.tsx
 * @description Layout de la plataforma protegida: sidebar + header + área de contenido.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { Sidebar } from "./_components/Sidebar";
import { Header } from "./_components/Header";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
