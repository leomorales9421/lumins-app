import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const location = useLocation();
  const routeKey = location.pathname.startsWith('/settings') ? '/settings' : location.pathname;

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.18,
        ease: 'easeOut',
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionWrapper;
