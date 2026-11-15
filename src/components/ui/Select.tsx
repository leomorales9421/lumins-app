import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  uiSize?: 'sm' | 'md';
  containerClassName?: string;
}

/**
 * Selector global Lumins con proporciones compactas (`small` por defecto),
 * radios semicurvos (`rounded-lg`) y foco turquesa `#12A9A8`.
 */
export const Select: React.FC<SelectProps> = ({
  label,
  error,
  leftIcon,
  uiSize = 'sm',
  className = '',
  containerClassName = '',
  children,
  ...props
}) => {
  const sizeClasses =
    uiSize === 'sm'
      ? `h-8 text-xs font-semibold rounded-lg ${leftIcon ? 'pl-8 pr-7' : 'pl-3 pr-7'}`
      : `h-10 text-sm font-semibold rounded-lg ${leftIcon ? 'pl-9 pr-8' : 'pl-3.5 pr-8'}`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-2.5 text-[var(--lumins-accent-fg)] pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <select
          className={`w-full bg-white dark:bg-[#13151A] border border-zinc-200/90 dark:border-white/10 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)] appearance-none transition-colors cursor-pointer ${sizeClasses} ${
            error ? 'border-[#FF665E] focus:ring-[#FF665E]/20 focus:border-[#FF665E]' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={uiSize === 'sm' ? 13 : 15}
          className="absolute right-2.5 text-zinc-400 pointer-events-none"
        />
      </div>
      {error && (
        <span className="text-[11px] font-bold text-[#FF665E]">{error}</span>
      )}
    </div>
  );
};

export default Select;
