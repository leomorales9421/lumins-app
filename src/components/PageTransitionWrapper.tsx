import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [showChildren, setShowChildren] = useState(true);

  useEffect(() => {
    // Cuando cambia la ruta, iniciar transición
    setIsLoading(true);
    setProgress(0);
    setShowChildren(false);

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
        // Actualizar children y mostrar contenido
        setCurrentChildren(children);
        setShowChildren(true);
        setIsLoading(false);
        setProgress(0);
      }, 300);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [location.pathname, children]);

  return (
    <>
      {/* Overlay de carga */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl"
          >
            {/* Contenedor centrado del loader */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Spinner grande con porcentaje */}
              <div className="relative mb-8">
                <div className="w-28 h-28 border-4 border-white/10 rounded-full"></div>
                <div className="absolute top-0 left-0 w-28 h-28 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                
                {/* Porcentaje en el centro */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-white block">{progress}%</span>
                    <span className="text-sm text-[#9db0b9] mt-1">completado</span>
                  </div>
                </div>
              </div>

              {/* Texto de carga */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12"
              >
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {getPageName(location.pathname)}
                </h3>
                <p className="text-[#9db0b9] text-lg max-w-md">
                  {getLoadingMessage(location.pathname)}
                </p>
              </motion.div>

              {/* Barra de progreso inferior */}
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-primary to-blue-500"
                />
              </div>

              {/* Indicador de paciencia */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-4 text-sm text-[#586872]"
              >
                Esto puede tomar unos segundos...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido de la página */}
      <div className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        {showChildren && currentChildren}
      </div>
    </>
  );
};

// Función para obtener el nombre de la página basado en la ruta
const getPageName = (pathname: string): string => {
  if (pathname === '/app' || pathname === '/') return 'Mis Tableros';
  if (pathname.startsWith('/boards/')) return 'Tablero';
  if (pathname === '/login') return 'Inicio de Sesión';
  return 'Página';
};

// Función para obtener mensaje de carga específico
const getLoadingMessage = (pathname: string): string => {
  if (pathname === '/app' || pathname === '/') return 'Cargando todos tus proyectos y tableros...';
  if (pathname.startsWith('/boards/')) return 'Preparando tu espacio de trabajo y cargando listas...';
  if (pathname === '/login') return 'Iniciando sesión en tu cuenta...';
  return 'Cargando contenido...';
};

export default PageTransitionWrapper;
