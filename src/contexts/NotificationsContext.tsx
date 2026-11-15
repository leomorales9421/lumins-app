import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useProductUpdates } from './ProductUpdatesContext';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, any> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPageResponse {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  fetchNotificationsPage: (
    page?: number,
    limit?: number,
    filter?: 'all' | 'unread'
  ) => Promise<NotificationPageResponse>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  openNotification: (item: AppNotification, navigate: (to: string) => void) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const DROPDOWN_LIMIT = 10;

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const { openUpdates } = useProductUpdates();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotificationsPage = useCallback(
    async (
      page = 1,
      limit = 15,
      filter: 'all' | 'unread' = 'all'
    ): Promise<NotificationPageResponse> => {
      const res = await apiClient.get<ApiEnvelope<NotificationPageResponse>>(
        '/api/notifications',
        { params: { page, limit, filter } }
      );
      if (typeof res.data?.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      }
      return res.data;
    },
    []
  );

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchNotificationsPage(1, DROPDOWN_LIMIT, 'all');
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silenciar errores transitorios de red para no bloquear la UI
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchNotificationsPage]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  // Suscripción en tiempo real vía Socket.IO
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNew = (incoming: AppNotification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev].slice(0, DROPDOWN_LIMIT);
      });
      if (!incoming.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleRead = (payload: { id: string; readAt?: string }) => {
      let decremented = false;
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === payload.id) {
            if (!n.isRead) decremented = true;
            return { ...n, isRead: true, readAt: payload.readAt || new Date().toISOString() };
          }
          return n;
        })
      );
      if (decremented) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handleReadAll = () => {
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now })));
      setUnreadCount(0);
    };

    socket.on('notification:new', handleNew);
    socket.on('notification:read', handleRead);
    socket.on('notification:read_all', handleReadAll);

    return () => {
      socket.off('notification:new', handleNew);
      socket.off('notification:read', handleRead);
      socket.off('notification:read_all', handleReadAll);
    };
  }, [socket, isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          if (!n.isRead) wasUnread = true;
          return { ...n, isRead: true, readAt: new Date().toISOString() };
        }
        return n;
      })
    );
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
    } catch {
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || now })));
    setUnreadCount(0);

    try {
      await apiClient.patch('/api/notifications/read-all');
    } catch {
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const openNotification = useCallback(
    (item: AppNotification, navigate: (to: string) => void) => {
      if (!item.isRead) {
        void markAsRead(item.id);
      }

      if (item.type === 'PRODUCT_UPDATE') {
        const releaseId =
          typeof item.metadata?.releaseId === 'string' ? item.metadata.releaseId : undefined;
        openUpdates(releaseId);
        return;
      }

      if (item.actionUrl) {
        navigate(item.actionUrl);
      }
    },
    [markAsRead, openUpdates]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        fetchNotificationsPage,
        markAsRead,
        markAllAsRead,
        openNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de un NotificationsProvider');
  }
  return context;
};
