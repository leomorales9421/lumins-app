import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = apiClient.isAuthenticated();

  useEffect(() => {
    const loadUser = async () => {
      if (isAuthenticated) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to load user:', error);
          apiClient.clearTokens();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const refreshUser = async () => {
    try {
      const response = await apiClient.get<{ data: { user: User } }>('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        data: {
          user: User;
          accessToken: string;
          refreshToken: string;
        };
        message: string;
      }>('/api/auth/login', { email, password });

      const { user, accessToken, refreshToken } = response.data;
      apiClient.setTokens(accessToken, refreshToken);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        data: {
          user: User;
          accessToken: string;
          refreshToken: string;
        };
        message: string;
      }>('/api/auth/register', { name, email, password });

      const { user, accessToken, refreshToken } = response.data;
      apiClient.setTokens(accessToken, refreshToken);
      setUser(user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.clearTokens();
    setUser(null);
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
