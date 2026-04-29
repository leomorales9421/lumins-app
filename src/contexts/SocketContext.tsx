import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import apiClient from '../lib/api-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !socket) {
      const token = apiClient.getAccessToken();
      const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || '';

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        if (err.message === 'Authentication error: Invalid or expired token') {
          // If token is invalid, we might want to refresh it or logout
          console.warn('Socket authentication failed. Forcing logout.');
          // logout();
        }
      });

      // Listener for user updates (including avatars)
      newSocket.on('user_updated', (payload) => {
        console.log('User updated:', payload);
        window.dispatchEvent(new CustomEvent('lumins:user-updated', { detail: payload }));
      });

      // Global permission update listener
      newSocket.on('permission:updated', (payload) => {
        console.log('Permission updated:', payload);
        // This will be handled by the PermissionContext or similar
        // For now, let's just log it. In a real app, we might trigger a refresh.
        window.dispatchEvent(new CustomEvent('lumins:permission-updated', { detail: payload }));
      });

      setSocket(newSocket);
      
      // Listen for token refresh to update socket authentication
      const handleTokenRefresh = (e: any) => {
        const { accessToken } = e.detail;
        if (newSocket && accessToken) {
          console.log('Syncing socket with new token');
          newSocket.auth = { token: accessToken };
          // If disconnected due to auth error, this will help it reconnect
          if (!newSocket.connected) {
            newSocket.connect();
          }
        }
      };
      
      window.addEventListener('lumins:token-refreshed', handleTokenRefresh);

      return () => {
        window.removeEventListener('lumins:token-refreshed', handleTokenRefresh);
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (!isAuthenticated && socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
