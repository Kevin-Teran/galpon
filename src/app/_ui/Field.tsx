/**
 * @file Field.tsx
 * @route /src/app/_ui/Field.tsx
 * @description Campo de formulario reutilizable con label, input y mensaje de error.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

interface FieldProps {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, description, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      {description && <p className="text-xs text-[var(--text-muted)] -mt-0.5">{description}</p>}
      {children}
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition";

export const selectCls = inputCls;
