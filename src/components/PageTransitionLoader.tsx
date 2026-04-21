import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransitionLoader: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    // Ocultar contenido actual y mostrar loader
    setShowContent(false);
    setIsLoading(true);
    setProgress(0);

    // Simular progreso de carga
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 50);

    // Completar carga después de un tiempo
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        // Mostrar nuevo contenido después de completar
        setShowContent(true);
      }, 300);
    }, 800); // Aumentado a 800ms para mejor experiencia

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  return (
    <>
      {/* Overlay oscuro que cubre toda la pantalla durante la carga */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          >
            {/* Contenedor centrado del loader */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Spinner grande */}
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-white/10 rounded"></div>
                <div className="absolute top-0 left-0 w-24 h-24 border-4 border-primary border-t-transparent rounded animate-spin"></div>
                
                {/* Porcentaje en el centro */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{progress}%</span>
                </div>
              </div>

              {/* Texto de carga */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h3 className="text-xl font-semibold text-white mb-2">
                  Cargando {getPageName(location.pathname)}
                </h3>
                <p className="text-[#9db0b9] max-w-md">
                  Preparando tu experiencia en {getPageName(location.pathname).toLowerCase()}...
                </p>
              </motion.div>

              {/* Barra de progreso inferior */}
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido de la página - se oculta/muestra según estado */}
      <div className={isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}>
        {/* El contenido se renderiza aquí */}
      </div>
    </>
  );
};

// Función para obtener el nombre de la página basado en la ruta
const getPageName = (pathname: string): string => {
  if (pathname === '/app' || pathname === '/') return 'Tableros';
  if (pathname.startsWith('/boards/')) return 'Tablero';
  if (pathname === '/login') return 'Inicio de sesión';
  return 'Página';
};

export default PageTransitionLoader;
