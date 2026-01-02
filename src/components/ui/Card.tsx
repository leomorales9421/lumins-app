import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = true,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl border transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-[#1c2327]/80 backdrop-blur-xl border-white/5 shadow-2xl',
    glass: 'glass border-white/5',
    elevated: 'bg-[#1c2327] border-[#3b4b54] shadow-lg',
  };

  const hoverClasses = hoverable ? 'hover:border-primary/30 hover:shadow-2xl card-hover' : '';

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
  <div className={`px-6 py-4 border-b border-white/5 ${className}`} {...props}>
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

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-6 py-4 border-t border-white/5 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
