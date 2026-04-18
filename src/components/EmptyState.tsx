import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  compact = false,
}) => {
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-[#6d7f88]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );

  return (
    <div
      className={`text-center ${
        compact ? 'py-8' : 'py-16'
      }`}
      role="status"
      aria-live="polite"
      aria-label={`${title}. ${description}`}
    >
      <div className="mx-auto mb-4 flex justify-center">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        {title}
      </h3>
      <p className="text-[#b8c9d2] mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
