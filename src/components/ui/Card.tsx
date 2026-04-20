import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'vibrant' | 'glass' | 'white';
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = true,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-md transition-all duration-300 overflow-hidden';
  
  const variantClasses = {
    // Elevated Surface base
    default: 'bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    
    // Pro Glassmorphism (Dynamic/Transparent)
    glass: 'bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]',
    
    // Vibrant Brand
    vibrant: 'bg-gradient-to-br from-[#6C5DD3] to-[#8E82E3] text-white shadow-lg',
    
    // White alias (Strict Surface)
    white: 'bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 shadow-sm',
  };

  const hoverClasses = hoverable 
    ? 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:-translate-y-1' 
    : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-6 py-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/30 dark:bg-white/5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
