import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'inverted' | 'outlined' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-md';
  
  const variantClasses = {
    // Exact colors from Identity Graph
    primary: 'bg-[#7A5AF8] text-white shadow-soft hover:bg-[#6a4ae7]',
    secondary: 'bg-[#F4F5F7] text-[#374151] border border-[#E8E9EC] hover:bg-[#EAECF0] hover:text-[#7A5AF8]',
    inverted: 'bg-[#100B26] text-white hover:bg-[#000000]', // Inverted look from guide
    outlined: 'bg-transparent border-2 border-zinc-200 text-zinc-600 hover:border-[#7A5AF8] hover:text-[#7A5AF8]',
    danger: 'bg-[#E91E63] text-white hover:bg-[#d81b60] shadow-soft',
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
      {!isLoading && leftIcon && <span className="mr-3 flex items-center">{leftIcon}</span>}
      {isLoading ? 'Cargando...' : children}
    </button>
  );
};

export default Button;
