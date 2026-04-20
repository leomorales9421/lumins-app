import React from 'react';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  return <>{children}</>;
};

export default PageTransitionWrapper;
