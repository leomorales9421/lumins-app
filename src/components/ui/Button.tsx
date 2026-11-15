import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'inverted' | 'outlined' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-[10px]';
  
  const variantClasses = {
    primary: 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-sm hover:bg-[var(--lumins-accent-hover)]',
    secondary: 'bg-white dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10',
    inverted: 'bg-[#0F172A] text-white hover:bg-slate-900',
    outlined: 'bg-transparent border border-slate-200 text-slate-600 hover:border-[#12A9A8] hover:text-[#12A9A8]',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  };

  const sizeClasses = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-7 text-sm',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{children === 'Iniciar sesión' || children === 'Registrarse' ? 'Cargando...' : children}</span>
        </div>
      ) : (
        <>
          {leftIcon && <span className="mr-3 flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-3 flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
