import React, { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Lock, Bell, Palette, Share2 } from 'lucide-react';
import { LuminsSettingsIcon } from '../components/icons/LuminsIcons';
import LuminsLogoLoader from '../components/ui/LuminsLogoLoader';

const NAV_ITEMS = [
  {
    path: '/settings/profile',
    label: 'Perfil',
    shortLabel: 'Perfil',
    subtitle: 'Información personal y avatar',
    icon: User,
  },
  {
    path: '/settings/security',
    label: 'Seguridad',
    shortLabel: 'Seguridad',
    subtitle: 'Contraseña y sesiones activas',
    icon: Lock,
  },
  {
    path: '/settings/notifications',
    label: 'Notificaciones',
    shortLabel: 'Alertas',
    subtitle: 'Avisos por correo y en la app',
    icon: Bell,
  },
  {
    path: '/settings/integrations',
    label: 'Integraciones',
    shortLabel: 'Apps',
    subtitle: 'Conecta herramientas externas',
    icon: Share2,
  },
  {
    path: '/settings/preferences',
    label: 'Preferencias',
    shortLabel: 'Tema',
    subtitle: 'Tema, acento y disposición del menú',
    icon: Palette,
  },
];

const MIN_TAB_LOADER_MS = 1000;

const SettingsTabLoader: React.FC<{ overlay?: boolean }> = ({ overlay = false }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    className={`w-full rounded-xl flex flex-col items-center justify-center gap-2.5 p-8 ${
      overlay
        ? 'absolute inset-0 z-20 bg-[#F4F6F9]/92 dark:bg-[#151821]/92 backdrop-blur-sm'
        : 'min-h-[280px] bg-white dark:bg-[#212632] border border-slate-200/90 dark:border-white/[0.11]'
    }`}
  >
    <LuminsLogoLoader size="sm" />
    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Cargando...</span>
  </motion.div>
);

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const [trackedPath, setTrackedPath] = useState(location.pathname);
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Activar de forma síncrona durante el render para evitar cualquier flash de la nueva pestaña
  if (location.pathname !== trackedPath) {
    setTrackedPath(location.pathname);
    setIsSwitchingTab(true);
  }

  useEffect(() => {
    if (!isSwitchingTab) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIsSwitchingTab(false);
    }, MIN_TAB_LOADER_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [trackedPath, isSwitchingTab]);

  const activeItem =
    NAV_ITEMS.find(item => location.pathname.startsWith(item.path)) || NAV_ITEMS[0];

  return (
    <div className="flex-1 px-3.5 py-4 sm:p-6 lg:p-8 font-sans max-w-[1600px] mx-auto w-full flex flex-col gap-4 sm:gap-6">
      {/* Header: en desktop menú a la izquierda y título a la derecha */}
      <div className="flex flex-col lg:flex-row-reverse lg:items-end justify-between gap-3.5 sm:gap-4">
        <div className="flex flex-col gap-0.5 sm:gap-1 lg:items-end lg:text-right">
          <div className="flex items-center gap-2 text-[var(--lumins-accent-fg)] mb-0.5">
            <LuminsSettingsIcon size={15} active />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em]">Cuenta y Preferencias</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Configuración de Cuenta
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {activeItem.subtitle}
          </p>
        </div>

        {/* Platform-consistent Segmented Navigation (native 5-col bar on mobile/tablet, inline capsule on desktop) */}
        <nav
          aria-label="Secciones de configuración"
          className="grid grid-cols-5 sm:inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#212632] border border-slate-200/90 dark:border-white/[0.11] shadow-xs w-full sm:w-auto"
        >
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) =>
                  isActive
                    ? {
                        backgroundColor: 'var(--lumins-accent)',
                        color: 'var(--lumins-accent-on)',
                      }
                    : undefined
                }
                className={({ isActive }) =>
                  `inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all whitespace-nowrap shrink-0 select-none active:scale-[0.97] ${
                    isActive
                      ? 'shadow-xs font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100 font-semibold'
                  }`
                }
              >
                <Icon size={14} className="shrink-0" />
                <span className="sm:hidden truncate max-w-full leading-none">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 min-w-0 w-full relative min-h-[300px]">
        <AnimatePresence>
          {isSwitchingTab && <SettingsTabLoader key="settings-tab-loader" overlay />}
        </AnimatePresence>
        <Suspense fallback={<SettingsTabLoader />}>
          <motion.div
            key={trackedPath}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: isSwitchingTab ? 0 : 1, y: isSwitchingTab ? 6 : 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full"
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
    </div>
  );
};

export default SettingsPage;
