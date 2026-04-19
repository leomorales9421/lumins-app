import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Lock, Bell, Palette } from 'lucide-react';

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
      path: '/settings/preferences',
      label: 'Preferencias',
      icon: <Palette size={20} />,
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-6 flex flex-col md:flex-row gap-10">
      {/* Left Navigation */}
      <aside className="w-full md:w-[250px] flex-shrink-0">
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">Configuraciones</h1>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 p-3 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-[#F4F6F9] text-[#6C5DD3] font-bold' 
                  : 'text-zinc-500 hover:bg-slate-50 hover:text-zinc-900'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Right Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsPage;
