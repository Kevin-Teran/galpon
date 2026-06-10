/**
 * @file page.tsx
 * @route /src/app/(platform)/dashboard/page.tsx
 * @description Dashboard principal — resumen del estado de todos los galpones.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

export const metadata = {
  title: "Dashboard — Galpon",
};

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <p className="text-slate-400 text-sm">
        Resumen del estado de galpones aparecerá aquí.
      </p>
    </div>
  );
}
