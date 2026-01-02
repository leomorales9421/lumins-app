import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-2 group">
      {label && (
        <label htmlFor={inputId} className="text-white text-sm font-medium leading-normal">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[#9db0b9] group-focus-within:text-primary transition-colors duration-200">
            {leftIcon}
          </span>
        )}
        
        <input
          id={inputId}
          className={`
            form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg 
            text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 
            border ${error ? 'border-red-500' : 'border-[#3b4b54]'} 
            bg-[#111618] focus:border-primary h-11 
            placeholder:text-[#586872] 
            ${leftIcon ? 'pl-10' : 'pl-4'} 
            ${rightIcon ? 'pr-10' : 'pr-4'} 
            text-sm font-normal leading-normal transition-all duration-200
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <span className="absolute right-3 text-[#9db0b9] group-focus-within:text-primary transition-colors duration-200">
            {rightIcon}
          </span>
        )}
      </div>
      
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
