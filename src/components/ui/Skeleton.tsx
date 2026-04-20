import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg ${className || ''}`}
      {...props}
    />
  );
}
