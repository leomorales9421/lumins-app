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
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded';
  
  const variantClasses = {
    // Exact colors from Identity Graph
    // Primary Accent: Identical in both modes
    primary: 'bg-[#6C5DD3] text-white shadow-soft hover:bg-[#5b4dbf]',
    secondary: 'bg-[#F4F5F7] dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-[#E8E9EC] dark:border-white/10 hover:bg-[#EAECF0] dark:hover:bg-white/10',
    inverted: 'bg-[#100B26] dark:bg-[#080808] text-white hover:bg-[#000000]',
    outlined: 'bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-[#6C5DD3] hover:text-[#6C5DD3] dark:hover:border-[#6C5DD3] dark:hover:text-[#6C5DD3]',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-soft',
  };

  const sizeClasses = {
    sm: 'h-10 px-5 text-xs',
    md: 'h-12 px-7 text-sm',
    lg: 'h-14 px-9 text-base',
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
