import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Lock, Bell, Palette, Share2 } from 'lucide-react';
import PageTransitionWrapper from '../components/PageTransitionWrapper';

const SettingsPage: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/settings/profile',
      label: 'Perfil',
      icon: <User size={20} />,
    },
    {
      path: '/settings/security',
      label: 'Seguridad',
      icon: <Lock size={20} />,
    },
    {
      path: '/settings/notifications',
      label: 'Notificaciones',
      icon: <Bell size={20} />,
    },
    {
      path: '/settings/integrations',
      label: 'Integraciones',
      icon: <Share2 size={20} />,
    },
    {
      path: '/settings/preferences',
      label: 'Preferencias',
      icon: <Palette size={20} />,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-4 sm:py-10 px-4 sm:px-6 flex flex-col md:flex-row gap-6 md:gap-10 min-h-[calc(100vh-64px)]">
      {/* Left Navigation */}
      <aside className="w-full md:w-[250px] flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-4 sm:mb-6 uppercase tracking-tighter">Configuraciones</h1>
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 p-3 rounded-xl transition-all whitespace-nowrap
                ${isActive 
                  ? 'bg-zinc-100 dark:bg-white/5 text-[#6C5DD3] font-bold shadow-sm' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100'
                }
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="text-xs uppercase font-black tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Right Content */}
      <main className="flex-1">
        <PageTransitionWrapper>
          <Outlet />
        </PageTransitionWrapper>
      </main>
    </div>
  );
};

export default SettingsPage;
