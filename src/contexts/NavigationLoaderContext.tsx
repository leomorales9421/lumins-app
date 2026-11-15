import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LuminsLogoLoader from '../components/ui/LuminsLogoLoader';

interface NavigationLoaderContextValue {
  registerLoading: (id: string) => void;
  unregisterLoading: (id: string) => void;
  isOverlayVisible: boolean;
}

const NavigationLoaderContext = createContext<NavigationLoaderContextValue | null>(null);

const MIN_LOADER_DURATION_MS = 2000;
const MAX_LOADER_DURATION_MS = 10000;

export const NavigationLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [trackedPath, setTrackedPath] = useState(location.pathname);
  const [cycleId, setCycleId] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const [maxTimedOut, setMaxTimedOut] = useState(false);
  const [activeLoaders, setActiveLoaders] = useState<Set<string>>(() => new Set());
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const timerRef = useRef<number | null>(null);
  const failsafeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const cycleStartRef = useRef<number>(Date.now());

  // Detectar cambio de ruta de forma síncrona durante el render para evitar cualquier flash
  // de la nueva vista antes de que aparezca el loader. Si el loader ya está abierto por un redirect
  // inmediato (< 250ms), continúa el mismo ciclo sin abrirlo 2 veces; si el usuario navega a otro
  // módulo mientras el loader sigue visible, reinicia el temporizador de 2s sin parpadear el overlay.
  if (location.pathname !== trackedPath) {
    const isInternalSettingsSwitch =
      trackedPath.startsWith('/settings') && location.pathname.startsWith('/settings');
    setTrackedPath(location.pathname);
    if (!isInternalSettingsSwitch) {
      const elapsedSinceCycleStart = Date.now() - cycleStartRef.current;
      if (!isOverlayVisible || elapsedSinceCycleStart > 250) {
        cycleStartRef.current = Date.now();
        setCycleId((c) => c + 1);
        setMinElapsed(false);
        setMaxTimedOut(false);
        setIsOverlayVisible(true);
      }
    }
  }

  // Reiniciar el ciclo de 2 segundos en cada navegación SPA nueva (módulos, configuraciones, tabs internos)
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (failsafeRef.current) window.clearTimeout(failsafeRef.current);

    timerRef.current = window.setTimeout(() => {
      setMinElapsed(true);
    }, MIN_LOADER_DURATION_MS);

    // Failsafe absoluto: nunca quedar atrapado cargando eternamente ante fallos de red o componentes
    failsafeRef.current = window.setTimeout(() => {
      setMaxTimedOut(true);
    }, MAX_LOADER_DURATION_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (failsafeRef.current) window.clearTimeout(failsafeRef.current);
    };
  }, [cycleId]);

  // Ocultar el overlay únicamente cuando pasaron >= 2s Y no queda ningún módulo cargando
  // (o se alcanzó el failsafe máximo), esperando un frame de render.
  useEffect(() => {
    if ((minElapsed && activeLoaders.size === 0) || maxTimedOut) {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(() => {
        setIsOverlayVisible(false);
      });
    } else {
      setIsOverlayVisible(true);
    }

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [minElapsed, maxTimedOut, activeLoaders.size]);

  const registerLoading = useCallback((id: string) => {
    setActiveLoaders((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unregisterLoading = useCallback((id: string) => {
    setActiveLoaders((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const routeChanging = location.pathname !== trackedPath;
  const effectiveVisible = isOverlayVisible || routeChanging;

  const contextValue = useMemo(
    () => ({ registerLoading, unregisterLoading, isOverlayVisible: effectiveVisible }),
    [registerLoading, unregisterLoading, effectiveVisible]
  );

  return (
    <NavigationLoaderContext.Provider value={contextValue}>
      {children}
    </NavigationLoaderContext.Provider>
  );
};

/**
 * Hook para que cualquier página o submódulo reporte su estado de carga asíncrona
 * al loader global SPA (garantizando >= 2s armónicos y ocultamiento tras renderizar todo).
 */
export function useModuleLoading(isLoading: boolean, moduleKey?: string) {
  const ctx = useContext(NavigationLoaderContext);
  const registerLoading = ctx?.registerLoading;
  const unregisterLoading = ctx?.unregisterLoading;
  const autoIdRef = useRef(moduleKey || `mod-${Math.random().toString(36).slice(2, 9)}`);
  const id = moduleKey || autoIdRef.current;

  useEffect(() => {
    if (!registerLoading || !unregisterLoading) return;
    if (isLoading) {
      registerLoading(id);
    } else {
      unregisterLoading(id);
    }
    return () => {
      unregisterLoading(id);
    };
  }, [registerLoading, unregisterLoading, id, isLoading]);
}

export function useNavigationLoader() {
  return useContext(NavigationLoaderContext);
}

/**
 * Overlay visual con animación pura del logo Lumins que cubre el área de contenido
 * hasta que transcurran 2s mínimos y el módulo haya renderizado por completo.
 */
export const ModuleLoaderOverlay: React.FC = () => {
  const ctx = useNavigationLoader();
  const location = useLocation();
  const visible = ctx?.isOverlayVisible ?? false;
  const isBoardView = location.pathname.startsWith('/boards/') || location.pathname.startsWith('/b/');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="lumins-module-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className={`fixed inset-x-0 bottom-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-[#14171C] ${
            isBoardView ? 'top-0 z-[60]' : 'top-14 z-40'
          }`}
        >
          <LuminsLogoLoader size="lg" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
