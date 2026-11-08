import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { PRODUCT_RELEASES, LATEST_RELEASE } from '../config/productUpdates';
import type { ProductRelease } from '../config/productUpdates';

interface ProductUpdatesContextType {
  releases: ProductRelease[];
  latestRelease: ProductRelease;
  hasUnread: boolean;
  isOpen: boolean;
  openUpdates: () => void;
  closeUpdates: () => void;
  markAsRead: () => void;
}

const ProductUpdatesContext = createContext<ProductUpdatesContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'lumins_seen_release_';

export const ProductUpdatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const userKey = user?.id ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  // Comprobar si hay novedades no vistas para este usuario
  useEffect(() => {
    if (!isAuthenticated || !userKey) {
      setHasUnread(false);
      return;
    }

    try {
      const seenReleaseId = localStorage.getItem(userKey);
      const isUnread = seenReleaseId !== LATEST_RELEASE.id;
      setHasUnread(isUnread);

      // Si no ha visto esta versión, abrir modal automáticamente 1 vez al cargar
      if (isUnread) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, [isAuthenticated, userKey]);

  const markAsRead = useCallback(() => {
    if (userKey) {
      try {
        localStorage.setItem(userKey, LATEST_RELEASE.id);
      } catch {}
    }
    setHasUnread(false);
  }, [userKey]);

  const openUpdates = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeUpdates = useCallback(() => {
    setIsOpen(false);
    markAsRead();
  }, [markAsRead]);

  return (
    <ProductUpdatesContext.Provider
      value={{
        releases: PRODUCT_RELEASES,
        latestRelease: LATEST_RELEASE,
        hasUnread,
        isOpen,
        openUpdates,
        closeUpdates,
        markAsRead,
      }}
    >
      {children}
    </ProductUpdatesContext.Provider>
  );
};

export const useProductUpdates = () => {
  const context = useContext(ProductUpdatesContext);
  if (!context) {
    throw new Error('useProductUpdates debe usarse dentro de un ProductUpdatesProvider');
  }
  return context;
};
