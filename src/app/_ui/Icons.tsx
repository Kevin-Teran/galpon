/**
 * @file Icons.tsx
 * @route /src/app/_ui/Icons.tsx
 * @description Iconos SVG inline reutilizables (sin dependencia externa).
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

type IconProps = { size?: number; className?: string };

const i = (path: string, size = 18, cls = "") => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    className={cls} aria-hidden="true">
    {typeof path === "string"
      ? <path d={path} />
      : path}
  </svg>
);

export const IconEye       = ({ size, className }: IconProps) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconPencil    = ({ size, className }: IconProps) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const IconTrash     = ({ size, className }: IconProps) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const IconSettings  = ({ size, className }: IconProps) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="8" cy="6" r="2" fill="var(--bg-surface)" />
    <circle cx="16" cy="12" r="2" fill="var(--bg-surface)" />
    <circle cx="8" cy="18" r="2" fill="var(--bg-surface)" />
  </svg>
);

export const IconArrowLeft = ({ size, className }: IconProps) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const IconPlus      = ({ size, className }: IconProps) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const IconChevronRight = ({ size, className }: IconProps) => (
  <svg width={size ?? 14} height={size ?? 14} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
