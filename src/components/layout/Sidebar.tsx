import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Layout, 
  Settings, 
  Users, 
  Calendar, 
  Activity,
  Plus
} from 'lucide-react';
import WorkspaceSwitcher from '../WorkspaceSwitcher';

interface SidebarProps {
  onCreateWorkspace: () => void;
}

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-[13px]
      ${isActive 
        ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }
    `}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ onCreateWorkspace }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] sticky top-16">
      <div className="p-4 flex flex-col gap-8 h-full">
        
        {/* Workspace Switcher Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2">
            Espacio de Trabajo
          </p>
          <WorkspaceSwitcher onCreateClick={onCreateWorkspace} />
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 mb-3">
            Principal
          </p>
          <SidebarItem to="/app" icon={<Layout size={18} />} label="Tableros" />
          <SidebarItem to="/calendar" icon={<Calendar size={18} />} label="Calendario" />
          <SidebarItem to="/activity" icon={<Activity size={18} />} label="Actividad" />
          <SidebarItem to="/members" icon={<Users size={18} />} label="Miembros" />
        </div>

        {/* Settings/Bottom Section */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <SidebarItem to="/settings" icon={<Settings size={18} />} label="Configuración" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
