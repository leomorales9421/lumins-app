import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

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
        const response = await apiClient.get<{ data: { userRole: string } }>(`/api/boards/${boardId}`);
        setRole(response.data.userRole || 'viewer');
      } catch (error) {
        setRole('viewer');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [boardId, providedRole]);

  return {
    canManageBoard: role === 'admin',
    canEditContent: ['admin', 'editor'].includes(role),
    canModerate: role === 'admin',
    isReadOnly: !['admin', 'editor'].includes(role),
    loading,
  };
};
