import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isLoading && !isAuthenticated) {
    const target = location.pathname + location.search;
    if (target && target !== '/' && target !== '/app' && target !== '/login') {
      try {
        localStorage.setItem('lumins_post_login_redirect', target);
      } catch (e) {
        // ignore storage errors
      }
      return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
