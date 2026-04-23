import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';
import { usePermission } from '../contexts/PermissionContext';

interface BoardPermissions {
  canManageBoard: boolean;
  canEditContent: boolean;
  canModerate: boolean;
  isReadOnly: boolean;
  loading: boolean;
}

export const useBoardPermissions = (boardId: string | undefined, providedRole?: string): BoardPermissions => {
  const [role, setRole] = useState<string>('viewer');
  const [loading, setLoading] = useState<boolean>(true);
  const { isGodMode } = usePermission();

  useEffect(() => {
    if (providedRole) {
      setRole(providedRole);
      setLoading(false);
      return;
    }

    if (!boardId) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const response = await apiClient.get(`/api/boards/${boardId}`);
        setRole(response.data.userRole || 'viewer');
      } catch (error) {
        setRole('viewer');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [boardId, providedRole]);

  // If God Mode is active, grant all permissions
  const effectiveRole = isGodMode ? 'admin' : role;

  return {
    canManageBoard: effectiveRole === 'admin',
    canEditContent: ['admin', 'editor'].includes(effectiveRole),
    canModerate: effectiveRole === 'admin',
    isReadOnly: !['admin', 'editor'].includes(effectiveRole),
    loading,
  };
};
