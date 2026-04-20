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
            w-full h-12 bg-white dark:bg-[#13151A] border border-zinc-200 dark:border-zinc-700 
            text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 
            focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]/50 focus:border-[#6C5DD3] 
            dark:focus:ring-[#6C5DD3]/50 transition-colors rounded-md py-3
            ${leftIcon ? 'pl-12' : 'px-5'}
            ${rightIcon ? 'pr-12' : 'px-5'}
            ${error ? 'ring-2 ring-red-500/50 border-red-500' : ''}
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
