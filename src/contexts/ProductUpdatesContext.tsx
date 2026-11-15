import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { PRODUCT_RELEASES, LATEST_RELEASE } from '../config/productUpdates';
import type { ProductRelease } from '../config/productUpdates';

interface ProductUpdatesContextType {
  releases: ProductRelease[];
  latestRelease: ProductRelease;
  activeReleaseId: string;
  hasUnread: boolean;
  isOpen: boolean;
  isOnboardingOpen: boolean;
  openUpdates: (releaseId?: string) => void;
  closeUpdates: () => void;
  openV2Onboarding: () => void;
  closeV2Onboarding: () => void;
  markAsRead: (releaseId?: string) => void;
}

const ProductUpdatesContext = createContext<ProductUpdatesContextType | undefined>(undefined);

const SEEN_LIST_KEY_PREFIX = 'lumins_seen_releases_';
const LEGACY_SEEN_KEY_PREFIX = 'lumins_seen_release_';
const MAX_AUTO_POPUP_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 días máximo desde su publicación

const readSeenIds = (userId: string): string[] => {
  try {
    const raw = localStorage.getItem(`${SEEN_LIST_KEY_PREFIX}${userId}`);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const legacy = localStorage.getItem(`${LEGACY_SEEN_KEY_PREFIX}${userId}`);
    if (legacy && !list.includes(legacy)) {
      list.push(legacy);
    }
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const writeSeenIds = (userId: string, ids: string[]) => {
  try {
    localStorage.setItem(`${SEEN_LIST_KEY_PREFIX}${userId}`, JSON.stringify(ids));
  } catch {
    // Ignorar errores de almacenamiento
  }
};

/**
 * Devuelve las novedades no leídas dentro de la ventana de 3 días,
 * ordenadas cronológicamente de la más vieja a la más nueva.
 */
const getEligibleUnreadQueue = (userId: string): ProductRelease[] => {
  const seen = new Set(readSeenIds(userId));
  const now = Date.now();

  return PRODUCT_RELEASES.filter((release) => {
    if (seen.has(release.id)) return false;
    const publishedTime = new Date(release.publishedAt).getTime();
    if (Number.isNaN(publishedTime)) return false;
    const age = now - publishedTime;
    return age >= 0 && age <= MAX_AUTO_POPUP_AGE_MS;
  }).sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
};

export const ProductUpdatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [activeReleaseId, setActiveReleaseId] = useState<string>(LATEST_RELEASE.id);

  // Cola secuencial para mostrar 1 modal a la vez (de la más vieja a la más nueva)
  const pendingQueueRef = useRef<ProductRelease[]>([]);
  const nextTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }

    if (!isAuthenticated || !user?.id) {
      pendingQueueRef.current = [];
      setHasUnread(false);
      setIsOpen(false);
      setIsOnboardingOpen(false);
      return;
    }

    const queue = getEligibleUnreadQueue(user.id);
    pendingQueueRef.current = queue;
    setHasUnread(queue.length > 0);

    if (queue.length > 0) {
      const tryOpenNext = () => {
        const path = window.location.pathname;
        const isAuthRoute =
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/auth/callback') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/reset-password');
        const isOnboardingBusy = Boolean((window as any).__luminsOnboardingBusy);

        if (isAuthRoute || isOnboardingBusy || pendingQueueRef.current.length === 0) {
          return false;
        }

        setActiveReleaseId(pendingQueueRef.current[0].id);
        setIsOpen(true);
        return true;
      };

      // Esperar a que termine el onboarding/theme si está activo, o abrir tras 650ms
      nextTimerRef.current = window.setTimeout(() => {
        tryOpenNext();
      }, 650);

      const onUpdatesReady = () => {
        if (nextTimerRef.current) {
          window.clearTimeout(nextTimerRef.current);
        }
        nextTimerRef.current = window.setTimeout(() => {
          tryOpenNext();
        }, 420);
      };

      window.addEventListener('lumins-updates-ready', onUpdatesReady);
      return () => {
        if (nextTimerRef.current) {
          window.clearTimeout(nextTimerRef.current);
        }
        window.removeEventListener('lumins-updates-ready', onUpdatesReady);
      };
    }

    return () => {
      if (nextTimerRef.current) {
        window.clearTimeout(nextTimerRef.current);
      }
    };
  }, [isAuthenticated, user?.id]);

  const markAsRead = useCallback(
    (releaseId?: string) => {
      const targetId = releaseId || activeReleaseId;
      if (!user?.id || !targetId) return;

      const currentSeen = readSeenIds(user.id);
      if (!currentSeen.includes(targetId)) {
        writeSeenIds(user.id, [...currentSeen, targetId]);
      }

      const remaining = pendingQueueRef.current.filter((r) => r.id !== targetId);
      pendingQueueRef.current = remaining;
      setHasUnread(remaining.length > 0);
    },
    [user?.id, activeReleaseId]
  );

  const openUpdates = useCallback((releaseId?: string) => {
    setActiveReleaseId(releaseId || LATEST_RELEASE.id);
    setIsOpen(true);
  }, []);

  const closeUpdates = useCallback(() => {
    setIsOpen(false);
    const closedId = activeReleaseId;

    if (user?.id) {
      const currentSeen = readSeenIds(user.id);
      if (!currentSeen.includes(closedId)) {
        writeSeenIds(user.id, [...currentSeen, closedId]);
      }
      const remaining = pendingQueueRef.current.filter((r) => r.id !== closedId);
      pendingQueueRef.current = remaining;
      setHasUnread(remaining.length > 0);

      // Si había otra novedad no leída en cola (dentro de los 3 días), abrir la siguiente en orden
      if (remaining.length > 0 && !isOnboardingOpen) {
        if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
        nextTimerRef.current = window.setTimeout(() => {
          setActiveReleaseId(remaining[0].id);
          setIsOpen(true);
        }, 280);
      }
    }
  }, [activeReleaseId, user?.id, isOnboardingOpen]);

  const openV2Onboarding = useCallback(() => {
    setIsOpen(false);
    markAsRead(activeReleaseId);
    setIsOnboardingOpen(true);
  }, [markAsRead, activeReleaseId]);

  const closeV2Onboarding = useCallback(() => {
    setIsOnboardingOpen(false);
    const remaining = pendingQueueRef.current;
    if (remaining.length > 0) {
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = window.setTimeout(() => {
        setActiveReleaseId(remaining[0].id);
        setIsOpen(true);
      }, 280);
    }
  }, []);

  return (
    <ProductUpdatesContext.Provider
      value={{
        releases: PRODUCT_RELEASES,
        latestRelease: LATEST_RELEASE,
        activeReleaseId,
        hasUnread,
        isOpen,
        isOnboardingOpen,
        openUpdates,
        closeUpdates,
        openV2Onboarding,
        closeV2Onboarding,
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
