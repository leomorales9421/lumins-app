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
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {label && (
        <label className="text-sm font-black text-[#6e45e2] uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center group">
        {leftIcon && (
          <div className="absolute left-4 text-[#6e45e2]/60 group-focus-within:text-[#6e45e2] transition-colors scale-110">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full h-12 bg-[#f3e5f5] border-none rounded-md px-5 py-3 
            text-sm font-bold text-zinc-700 placeholder:text-[#6e45e2]/30
            focus:outline-none focus:ring-2 focus:ring-[#6e45e2]/20
            transition-all duration-200
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${error ? 'ring-2 ring-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 text-zinc-500 scale-110">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs font-black text-red-500 uppercase tracking-widest ml-1 animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
