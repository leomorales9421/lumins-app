import React from 'react';

export type BadgeTone = 'neutral' | 'teal' | 'coral' | 'amber';
export type BadgeVariant = 'dot' | 'subtle' | 'soft' | 'inline';
export type BadgeSize = 'xs' | 'sm';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const DOT_COLORS: Record<BadgeTone, string> = {
  neutral: 'bg-slate-400 dark:bg-zinc-500',
  teal: 'bg-[var(--lumins-accent)]',
  coral: 'bg-[#FF665E]',
  amber: 'bg-[#FFCC40]',
};

const SOFT_STYLES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-white/[0.07] dark:text-zinc-300',
  teal: 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]',
  coral: 'bg-[#FF665E]/[0.09] text-[#D94841] dark:bg-[#FF665E]/15 dark:text-[#FF857E]',
  amber: 'bg-[#FFCC40]/[0.18] text-amber-900 dark:bg-[#FFCC40]/15 dark:text-[#FFCC40]',
};

const INLINE_TEXT_COLORS: Record<BadgeTone, string> = {
  neutral: 'text-slate-500 dark:text-zinc-400',
  teal: 'text-[var(--lumins-accent-fg)]',
  coral: 'text-[#D94841] dark:text-[#FF857E]',
  amber: 'text-amber-800 dark:text-[#FFCC40]',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10.5px] gap-1.5',
  sm: 'px-2 py-0.5 text-[11px] gap-1.5',
};

/**
 * Global Lumins Badge
 * Designed with calm, architectural SaaS styling (no generic bordered pastel pills).
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  tone = 'neutral',
  variant = 'dot',
  size = 'sm',
  icon,
  pulse = false,
  className = '',
  ...props
}) => {
  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium whitespace-nowrap ${
          size === 'xs' ? 'text-[10.5px]' : 'text-[11px]'
        } ${INLINE_TEXT_COLORS[tone]} ${className}`}
        {...props}
      >
        {icon ? (
          <span className="shrink-0 flex items-center">{icon}</span>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[tone]} ${pulse ? 'animate-pulse' : ''}`} />
        )}
        <span>{children}</span>
      </span>
    );
  }

  const surfaceClass =
    variant === 'dot'
      ? 'bg-slate-100/80 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300'
      : variant === 'subtle'
        ? 'bg-slate-100/80 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300'
        : SOFT_STYLES[tone];

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium whitespace-nowrap shrink-0 leading-none ${SIZE_CLASSES[size]} ${surfaceClass} ${className}`}
      {...props}
    >
      {variant === 'dot' && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[tone]} ${
            pulse ? 'animate-pulse' : ''
          }`}
        />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
