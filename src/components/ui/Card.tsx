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
    // Replicating Login Style: Clean White Surface
    default: 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-zinc-900',
    
    // Pro Glassmorphism
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]',
    
    // Vibrant Header-like
    vibrant: 'bg-gradient-to-br from-[#6e45e2] to-[#ff9a9e] text-white shadow-lg',
    
    // White alias
    white: 'bg-white border border-zinc-100 shadow-sm text-zinc-900',
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
  <div className={`px-6 py-4 border-b border-zinc-50 bg-zinc-50/30 ${className}`} {...props}>
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
