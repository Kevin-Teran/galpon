"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">

      {/* Sidebar — solo en escritorio (lg+) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-(--bg-base) p-4 sm:p-6 lg:p-8 pb-[max(1rem,calc(env(safe-area-inset-bottom)+64px))] lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom nav — solo en mobile (< lg) */}
      <BottomNav />

    </div>
  );
}
