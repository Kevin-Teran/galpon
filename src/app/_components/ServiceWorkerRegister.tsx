/**
 * @file ServiceWorkerRegister.tsx
 * @route /src/app/_components/ServiceWorkerRegister.tsx
 * @description Componente client-side que registra el Service Worker al cargar la app.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.info("[SW] Registrado:", reg.scope))
        .catch((err) => console.error("[SW] Error al registrar:", err));
    }
  }, []);

  return null;
}
