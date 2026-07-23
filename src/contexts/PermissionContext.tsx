import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useParams, useLocation } from 'react-router-dom';

interface PermissionContextType {
  can: (action: string, contextId?: string) => boolean;
  roleInContext: (contextType: 'workspace' | 'board', contextId: string) => string | null;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const can = (action: string, contextId?: string): boolean => {
    if (!user) return false;

    // TODO: Implement more granular checks by fetching memberships from state/cache
    // For now, we can implement basic logic based on user object if roles are flattened there
    // OR we rely on the backend to enforce it and use this for UI hiding.
    
    switch (action) {
      case 'access_system_admin':
        return user.globalRole === 'SYSTEM_ADMIN';
      case 'delete_workspace':
        // Only owner or system admin
        return false; // Needs workspace membership check
      default:
        return true;
    }
  };

  const roleInContext = (contextType: 'workspace' | 'board', contextId: string): string | null => {
    // This will eventually consult a cached map of memberships
    return null;
  };

  const value: PermissionContextType = {
    can,
    roleInContext,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};
