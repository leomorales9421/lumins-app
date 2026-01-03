import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 = persistent
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  defaultDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  defaultDuration = 5000 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp,
      duration: notification.duration ?? defaultDuration,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [defaultDuration]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification, 
      clearNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper functions for common notification types
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'error', title, message, duration });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Notification display component
export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
          </div>
        );
      case 'error':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-sm">error</span>
          </div>
        );
      case 'warning':
        return (
          <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-yellow-400 text-sm">warning</span>
          </div>
        );
      case 'info':
        return (
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-400 text-sm">info</span>
          </div>
        );
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-green-500/30 bg-green-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info': return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const getTextColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-xl border backdrop-blur-xl animate-in slide-in-from-right-5 duration-300 ${getNotificationColor(notification.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h4 className={`font-semibold ${getTextColor(notification.type)}`}>
                  {notification.title}
                </h4>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 text-[#9db0b9] hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <p className="text-sm text-[#9db0b9] mt-1 whitespace-pre-wrap">
                {notification.message}
              </p>
              <div className="mt-2 text-xs text-[#586872]">
                {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook for structured logging
export const useStructuredLogger = () => {
  const { showError, showWarning, showInfo } = useNotificationHelpers();

  const logError = useCallback((context: string, error: any, metadata?: Record<string, any>) => {
    const errorMessage = error?.message || 'Unknown error';
    const errorDetails = error?.response?.data?.message || errorMessage;
    
    console.error(`[${context}]`, error, metadata);
    
    showError(
      'Error',
      `${context}: ${errorDetails}`,
      8000
    );

    // In a real app, you would send this to a logging service
    // Example: sendToLoggingService('error', { context, error: errorMessage, metadata });
  }, [showError]);

  const logWarning = useCallback((context: string, message: string, metadata?: Record<string, any>) => {
    console.warn(`[${context}]`, message, metadata);
    
    showWarning(
      'Warning',
      `${context}: ${message}`,
      6000
    );
  }, [showWarning]);

  const logInfo = useCallback((context: string, message: string, metadata?: Record<string, any>) => {
    console.info(`[${context}]`, message, metadata);
    
    showInfo(
      'Info',
      `${context}: ${message}`,
      4000
    );
  }, [showInfo]);

  const logSuccess = useCallback((context: string, message: string, metadata?: Record<string, any>) => {
    console.log(`[${context}]`, message, metadata);
    
    // Don't show success notifications by default, but keep the function
    // showSuccess('Success', `${context}: ${message}`, 3000);
  }, []);

  return {
    logError,
    logWarning,
    logInfo,
    logSuccess,
  };
};
