import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useParams, useLocation } from 'react-router-dom';

interface PermissionContextType {
  isGodMode: boolean;
  setGodMode: (active: boolean) => void;
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
  const [isGodMode, setGodMode] = useState(() => {
    return localStorage.getItem('lumins_god_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lumins_god_mode', isGodMode.toString());
  }, [isGodMode]);

  // God Mode Level 0 check
  const hasGodModeAccess = user?.globalRole === 'SYSTEM_ADMIN';

  const can = (action: string, contextId?: string): boolean => {
    if (hasGodModeAccess && isGodMode) return true;
    if (!user) return false;

    // TODO: Implement more granular checks by fetching memberships from state/cache
    // For now, we can implement basic logic based on user object if roles are flattened there
    // OR we rely on the backend to enforce it and use this for UI hiding.
    
    switch (action) {
      case 'access_system_admin':
        return hasGodModeAccess;
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
    isGodMode: hasGodModeAccess && isGodMode,
    setGodMode: (active: boolean) => hasGodModeAccess && setGodMode(active),
    can,
    roleInContext,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};
