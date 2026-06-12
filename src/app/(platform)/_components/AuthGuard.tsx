/**
 * @file AuthGuard.tsx
 * @route /src/app/(platform)/_components/AuthGuard.tsx
 * @description Intercepta fetch globalmente dentro de la plataforma.
 *              Si cualquier API devuelve 401, limpia la sesión y redirige al login.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const original = window.fetch;

    window.fetch = async (...args) => {
      const res = await original(...args);
      if (res.status === 401) {
        window.fetch = original;
        router.push(`/login?from=${pathname}`);
      }
      return res;
    };

    return () => { window.fetch = original; };
  }, [pathname, router]);

  return <>{children}</>;
}
