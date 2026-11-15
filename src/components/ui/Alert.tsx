import React from 'react';
import {
  LuminsInfoIcon,
  LuminsErrorIcon,
  LuminsWarningIcon,
  LuminsSuccessIcon,
} from '../icons/LuminsIcons';

export type AlertTone = 'neutral' | 'teal' | 'coral' | 'amber' | 'success';
export type AlertVariant = 'callout' | 'pill';

export interface AlertProps {
  tone?: AlertTone;
  variant?: AlertVariant;
  title?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const DOT_TONES: Record<AlertTone, string> = {
  neutral: 'bg-slate-400',
  teal: 'bg-[#12A9A8]',
  success: 'bg-[#12A9A8]',
  coral: 'bg-[#FF665E]',
  amber: 'bg-[#FFCC40]',
};

const CALLOUT_SURFACES: Record<AlertTone, string> = {
  neutral: 'bg-slate-50/70 dark:bg-[#1C1F26] border-slate-200/80 dark:border-white/10',
  teal: 'bg-[#12A9A8]/[0.05] dark:bg-[#12A9A8]/[0.09] border-[#12A9A8]/25 dark:border-[#12A9A8]/30',
  success: 'bg-[#12A9A8]/[0.05] dark:bg-[#12A9A8]/[0.09] border-[#12A9A8]/25 dark:border-[#12A9A8]/30',
  coral: 'bg-[#FF665E]/[0.05] dark:bg-[#FF665E]/[0.09] border-[#FF665E]/25 dark:border-[#FF665E]/30',
  amber: 'bg-[#FFCC40]/[0.08] dark:bg-[#FFCC40]/[0.1] border-[#FFCC40]/40 dark:border-[#FFCC40]/30',
};

const TITLE_TONES: Record<AlertTone, string> = {
  neutral: 'text-slate-900 dark:text-zinc-100',
  teal: 'text-[#0E8786] dark:text-[#4CD4D3]',
  success: 'text-[#0E8786] dark:text-[#4CD4D3]',
  coral: 'text-[#D6423A] dark:text-[#FF857E]',
  amber: 'text-[#9A6700] dark:text-[#FFCC40]',
};

const DEFAULT_ICONS: Record<AlertTone, React.ReactNode> = {
  neutral: <LuminsInfoIcon size={20} />,
  teal: <LuminsInfoIcon size={20} />,
  success: <LuminsSuccessIcon size={20} />,
  coral: <LuminsErrorIcon size={20} />,
  amber: <LuminsWarningIcon size={20} />,
};

/**
 * Global Lumins Alert / Callout
 * Architectural design: Lumins brand surface tint + vertical accent pill + custom Lumins icons.
 */
export const Alert: React.FC<AlertProps> = ({
  tone = 'teal',
  variant = 'callout',
  title,
  children,
  action,
  icon,
  pulse = false,
  className = '',
}) => {
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1C1F26] border border-slate-200/90 dark:border-white/10 shadow-xs text-xs text-slate-700 dark:text-zinc-200 ${className}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${DOT_TONES[tone]} ${
            pulse ? 'animate-pulse' : ''
          }`}
        />
        {title && (
          <>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              {title}
            </span>
            <span className="text-slate-300 dark:text-zinc-600">·</span>
          </>
        )}
        <span className="font-medium text-slate-800 dark:text-zinc-100">{children}</span>
        {action && <span className="ml-1 shrink-0">{action}</span>}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border shadow-xs text-xs ${CALLOUT_SURFACES[tone]} ${className}`}
    >
      <span className={`w-1 self-stretch rounded-full shrink-0 ${DOT_TONES[tone]}`} />
      <span className="shrink-0 flex items-center justify-center">
        {icon ?? DEFAULT_ICONS[tone]}
      </span>
      <div className="flex-1 min-w-0 leading-relaxed">
        {title && (
          <div className={`font-semibold mb-0.5 ${TITLE_TONES[tone]}`}>
            {title}
          </div>
        )}
        <div className="font-medium text-slate-700 dark:text-zinc-200">{children}</div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
};

export default Alert;
