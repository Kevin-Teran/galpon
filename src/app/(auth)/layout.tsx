/**
 * @file layout.tsx
 * @route /src/app/(auth)/layout.tsx
 * @description Layout para páginas de autenticación.
 * @author Kevin Mariano
 * @version 5.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { ThemeToggle } from "@/app/_components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
