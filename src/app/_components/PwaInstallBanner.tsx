/**
 * @file PwaInstallBanner.tsx
 * @route /src/app/_components/PwaInstallBanner.tsx
 * @description Banner que invita al usuario a instalar la app como PWA.
 *              Aparece solo cuando el navegador dispara beforeinstallprompt
 *              y la app no está corriendo en modo standalone.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
  }

  function handleDismiss() {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-auto px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-700 shadow-2xl px-4 py-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center text-amber-400 text-lg">
          ↓
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Instala Galpon</p>
          <p className="text-xs text-slate-400 truncate">
            Mejor experiencia sin navegador
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition"
          >
            No ahora
          </button>
          <button
            onClick={handleInstall}
            className="text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg transition"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
