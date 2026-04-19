import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Layout, 
  Settings, 
  Users, 
  Calendar, 
  Activity,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import WorkspaceSwitcher from '../WorkspaceSwitcher';

interface SidebarProps {
  onCreateWorkspace: () => void;
}

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; isCollapsed: boolean }> = ({ to, icon, label, isCollapsed }) => (
  <NavLink
    to={to}
    title={isCollapsed ? label : undefined}
    className={({ isActive }) => `
      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-[13px]
      ${isActive 
        ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }
      ${isCollapsed ? 'justify-center px-2' : ''}
    `}
  >
    <span className={`${isCollapsed ? 'scale-110' : ''} transition-transform`}>{icon}</span>
    {!isCollapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ onCreateWorkspace }) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] sticky top-16 transition-all duration-300 ease-in-out z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#7A5AF8] hover:border-[#7A5AF8] transition-all shadow-sm z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-4 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar ${isCollapsed ? 'items-center' : ''}`}>
        
        {/* Workspace Switcher Section */}
        <div className={`space-y-3 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2">
              Espacio de Trabajo
            </p>
          )}
          <div className={isCollapsed ? 'scale-90 origin-center' : ''}>
            <WorkspaceSwitcher onCreateClick={onCreateWorkspace} isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-1 w-full">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 mb-3">
              Principal
            </p>
          )}
          <SidebarItem 
            to={workspaceId ? `/w/${workspaceId}/dashboard` : "/app"} 
            icon={<Layout size={18} />} 
            label="Tableros" 
            isCollapsed={isCollapsed}
          />
          <SidebarItem to="/calendar" icon={<Calendar size={18} />} label="Calendario" isCollapsed={isCollapsed} />
          <SidebarItem to="/activity" icon={<Activity size={18} />} label="Actividad" isCollapsed={isCollapsed} />
          <SidebarItem 
            to={workspaceId ? `/w/${workspaceId}/members` : "/members"} 
            icon={<Users size={18} />} 
            label="Miembros" 
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Settings/Bottom Section */}
        <div className={`mt-auto pt-4 border-t border-slate-100 w-full ${isCollapsed ? 'flex justify-center' : ''}`}>
          <SidebarItem to="/settings" icon={<Settings size={18} />} label="Configuración" isCollapsed={isCollapsed} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
