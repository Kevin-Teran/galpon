/**
 * @file PageHeader.tsx
 * @route /src/app/_ui/PageHeader.tsx
 * @description Cabecera de página, botones de acción e iconos.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { type ReactNode } from "react";

interface PageHeaderProps { title: string; description?: string; action?: ReactNode; }

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
        {description && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Botones ── */

type BtnProps = { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string; };

export function BtnPrimary({ children, onClick, disabled, type = "button", className = "" }: BtnProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition ${className}`}>
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick, disabled, className = "" }: Omit<BtnProps, "type">) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] active:scale-95 disabled:opacity-50 transition ${className}`}>
      {children}
    </button>
  );
}

export function BtnDanger({ children, onClick, disabled, className = "" }: Omit<BtnProps, "type">) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-red-600/10 border border-red-500/20 px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-red-600/20 active:scale-95 disabled:opacity-50 transition ${className}`}>
      {children}
    </button>
  );
}

/* Botón icono — solo icono, con tooltip accesible */
type IconBtnProps = { icon: ReactNode; label: string; onClick?: () => void; disabled?: boolean; variant?: "default" | "danger" | "primary"; };

export function IconBtn({ icon, label, onClick, disabled, variant = "default" }: IconBtnProps) {
  const cls = {
    default: "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]",
    danger:  "text-[var(--danger)] hover:bg-red-500/10",
    primary: "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10",
  }[variant];
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition active:scale-90 disabled:opacity-40 ${cls}`}>
      {icon}
    </button>
  );
}
