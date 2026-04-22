import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

interface NotificationContextType {
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
}) => {
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const { type, title, message, duration } = notification;
    
    const toastOptions = {
      description: message,
      duration: duration,
    };

    switch (type) {
      case 'success':
        toast.success(title, toastOptions);
        break;
      case 'error':
        toast.error(title, toastOptions);
        break;
      case 'warning':
        toast.warning(title, toastOptions);
        break;
      case 'info':
        toast.info(title, toastOptions);
        break;
      default:
        toast(title, toastOptions);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  const clearNotifications = useCallback(() => {
    toast.dismiss();
  }, []);

  return (
    <NotificationContext.Provider value={{ 
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

// Notification container is now handled by GlobalToaster in App.tsx
export const NotificationContainer: React.FC = () => {
  return null;
};

// Hook for structured logging
export const useStructuredLogger = () => {
  const { showError, showWarning, showInfo } = useNotificationHelpers();

  const logError = useCallback((context: string, error: any, metadata?: Record<string, any>) => {
    const errorMessage = error?.message || 'Unknown error';
    const errorDetails = error?.response?.data?.message || errorMessage;
    
    console.error(`[${context}]`, error, metadata);
    
    toast.error(context, { 
      description: errorDetails,
      duration: 8000 
    });
  }, []);

  const logWarning = useCallback((context: string, message: string, metadata?: Record<string, any>) => {
    console.warn(`[${context}]`, message, metadata);
    
    toast.warning(context, { 
      description: message,
      duration: 6000 
    });
  }, []);

  const logInfo = useCallback((context: string, message: string, metadata?: Record<string, any>) => {
    console.info(`[${context}]`, message, metadata);
    
    toast.info(context, { 
      description: message,
      duration: 4000 
    });
  }, []);

  const logSuccess = useCallback((context: string, message: string, metadata?: Record<string, any>) => {
    console.log(`[${context}]`, message, metadata);
    toast.success(context, { 
      description: message,
      duration: 4000
    });
  }, []);

  return {
    logError,
    logWarning,
    logInfo,
    logSuccess,
  };
};

