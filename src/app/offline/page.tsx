/**
 * @file page.tsx
 * @route /src/app/offline/page.tsx
 * @description Página offline mostrada por el Service Worker cuando no hay conexión.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

"use client";

export default function OfflinePage() {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#020617", color: "#f8fafc", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◎</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Sin conexión</h1>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            Verifica tu conexión a internet e intenta nuevamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.5rem", fontSize: "0.9rem", cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
