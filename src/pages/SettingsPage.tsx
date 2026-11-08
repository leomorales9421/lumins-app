import React, { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Lock, Bell, Palette, Share2 } from 'lucide-react';

const SettingsContentSkeleton: React.FC = () => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    {/* Page Title skeleton (Desktop) */}
    <div className="hidden lg:block space-y-2 mb-6">
      <div className="h-8 w-44 bg-zinc-200 dark:bg-white/10 rounded-xl" />
      <div className="h-4 w-72 bg-zinc-200/60 dark:bg-white/5 rounded-lg" />
    </div>

    {/* Main Card Skeleton */}
    <div className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200/80 dark:border-white/10 p-5 sm:p-8 space-y-6 shadow-xs">
      {/* Top Banner / Avatar */}
      <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-white/5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-200 dark:bg-white/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-44 bg-zinc-200 dark:bg-white/10 rounded-lg" />
          <div className="h-3.5 w-60 bg-zinc-200/70 dark:bg-white/5 rounded-md" />
          <div className="h-7 w-28 bg-zinc-200/60 dark:bg-white/5 rounded-lg mt-1" />
        </div>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-zinc-200/80 dark:bg-white/10 rounded" />
          <div className="h-11 w-full bg-zinc-200/60 dark:bg-white/5 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-zinc-200/80 dark:bg-white/10 rounded" />
          <div className="h-11 w-full bg-zinc-200/60 dark:bg-white/5 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-zinc-200/80 dark:bg-white/10 rounded" />
          <div className="h-11 w-full bg-zinc-200/60 dark:bg-white/5 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-zinc-200/80 dark:bg-white/10 rounded" />
          <div className="h-11 w-full bg-zinc-200/60 dark:bg-white/5 rounded-xl" />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <div className="h-3 w-48 bg-zinc-200/80 dark:bg-white/10 rounded" />
          <div className="h-11 w-full bg-zinc-200/60 dark:bg-white/5 rounded-xl" />
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex justify-end">
        <div className="h-11 w-36 bg-zinc-200 dark:bg-white/10 rounded-xl" />
      </div>
    </div>
  </div>
);

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
    subtitle: 'Personaliza la apariencia de la app',
    icon: Palette,
  },
];

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const activeItem =
    NAV_ITEMS.find(item => location.pathname.startsWith(item.path)) || NAV_ITEMS[0];

  return (
    <div className="w-full max-w-6xl mx-auto pb-10 sm:py-8 px-0 sm:px-6 flex flex-col lg:flex-row gap-4 lg:gap-10 min-h-[calc(100dvh-64px)]">
      {/* MOBILE & TABLET NATIVE STICKY HEADER + 5-TAB SEGMENTED BAR (< lg) */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#F4F6F9]/95 dark:bg-[#13151A]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/10 px-3.5 pt-3 pb-2.5">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5DD3] block leading-none mb-0.5">
              Configuración
            </span>
            <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-tight">
              {activeItem.label}
            </h1>
          </div>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 text-right max-w-[180px] sm:max-w-xs truncate">
            {activeItem.subtitle}
          </p>
        </div>

        {/* Native 5-Column Segmented Control (zero horizontal scroll/clipping) */}
        <nav
          aria-label="Secciones de configuración"
          className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-zinc-200/70 dark:bg-[#1C1F26] border border-zinc-200/60 dark:border-white/5"
        >
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 rounded-xl transition-all select-none ${
                    isActive
                      ? 'bg-white dark:bg-[#6C5DD3] text-[#6C5DD3] dark:text-white shadow-xs font-extrabold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-bold'
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span className="text-[10px] sm:text-xs tracking-tight leading-none truncate max-w-full">
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* DESKTOP SIDEBAR (>= lg) */}
      <aside className="hidden lg:block w-[240px] flex-shrink-0">
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-6 uppercase tracking-tighter">
          Configuraciones
        </h1>
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-white/10 text-[#6C5DD3] dark:text-white font-bold shadow-xs border border-zinc-200/70 dark:border-white/10'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`
                }
              >
                <Icon size={19} className="shrink-0" />
                <span className="text-xs uppercase font-black tracking-widest">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 px-3.5 sm:px-0">
        <Suspense fallback={<SettingsContentSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default SettingsPage;
