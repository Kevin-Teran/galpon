/**
 * @file layout.tsx
 * @route /src/app/layout.tsx
 * @description Layout raíz. Configura fuentes, metadatos PWA, tema y service worker.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 * @copyright Galpon
 */

import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/_components/ThemeProvider";
import { ServiceWorkerRegister } from "@/app/_components/ServiceWorkerRegister";
import { PwaInstallBanner } from "@/app/_components/PwaInstallBanner";

const bodyFont = IBM_Plex_Sans({ variable: "--font-geist-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const monoFont = IBM_Plex_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const displayFont = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Galpon", template: "%s — Galpon" },
  description: "Plataforma de monitoreo de temperatura y humedad para galpones",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Galpon" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#020617" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          {children}
          <PwaInstallBanner />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
