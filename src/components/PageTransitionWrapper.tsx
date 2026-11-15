import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const location = useLocation();
  const routeKey = location.pathname.startsWith('/settings') ? '/settings' : location.pathname;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{
          duration: 0.16,
          ease: 'easeOut',
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransitionWrapper;
