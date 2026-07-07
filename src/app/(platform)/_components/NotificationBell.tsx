/**
 * @file NotificationBell.tsx
 * @route /src/app/(platform)/_components/NotificationBell.tsx
 * @description Campana de notificaciones en la barra superior — enlaza a Alertas y muestra
 *              la cantidad de alertas abiertas.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationBell() {
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    fetch("/api/alerts?open=true")
      .then(r => r.ok ? r.json() : [])
      .then((alerts: unknown[]) => setOpenCount(alerts.length))
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/alerts"
      title="Alertas"
      className="relative w-9.5 h-9.5 shrink-0 rounded-[10px] border border-(--border) bg-(--bg-surface) text-(--text-primary) flex items-center justify-center hover:bg-(--bg-subtle) transition-colors"
    >
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {openCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-(--bg-surface)">
          {openCount}
        </span>
      )}
    </Link>
  );
}
