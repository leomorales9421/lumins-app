import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Layout, 
  Settings, 
  Users, 
  Calendar, 
  Activity,
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
      flex items-center transition-all font-bold text-[13px] rounded-lg p-2.5
      ${isActive 
        ? 'bg-[#7A5AF8] text-white shadow-sm shadow-purple-300/40' 
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }
      ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}
    `}
  >
    <span className={`${isCollapsed ? 'scale-110' : ''} transition-transform flex-shrink-0`}>{icon}</span>
    <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
      {label}
    </span>
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ onCreateWorkspace }) => {
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const workspaceId = urlWorkspaceId || localStorage.getItem('lastActiveWorkspaceId');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] sticky top-16 transition-all duration-300 ease-in-out z-40
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3'} h-14 px-4 transition-all duration-300 border-b border-slate-100`}>
        <div className="w-7 h-7 bg-[#7A5AF8] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
          <Layout size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <span className={`font-bold text-base text-zinc-900 transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          Luminous
        </span>
      </div>

      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-zinc-200 text-zinc-500 rounded-lg p-1 cursor-pointer shadow-sm z-50 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`px-3 py-3 flex flex-col gap-5 h-full overflow-y-auto custom-scrollbar ${isCollapsed ? 'items-center' : ''}`}>
        
        {/* Workspace Switcher Section */}
        <div className={`w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">
              Espacio de Trabajo
            </p>
          )}
          <WorkspaceSwitcher onCreateClick={onCreateWorkspace} isCollapsed={isCollapsed} />
        </div>

        {/* Main Navigation */}
        <div className="space-y-0.5 w-full">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">
              Principal
            </p>
          )}
          <SidebarItem 
            to={workspaceId ? `/w/${workspaceId}/dashboard` : "/app"} 
            icon={<Layout size={17} />} 
            label="Tableros" 
            isCollapsed={isCollapsed}
          />
          <SidebarItem 
            to={workspaceId ? `/w/${workspaceId}/calendar` : "/calendar"} 
            icon={<Calendar size={17} />} 
            label="Calendario" 
            isCollapsed={isCollapsed} 
          />
          <SidebarItem 
            to={workspaceId ? `/w/${workspaceId}/activity` : "/activity"} 
            icon={<Activity size={17} />} 
            label="Actividad" 
            isCollapsed={isCollapsed} 
          />
          <SidebarItem 
            to={workspaceId ? `/w/${workspaceId}/members` : "/members"} 
            icon={<Users size={17} />} 
            label="Miembros" 
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Settings — bottom */}
        <div className={`mt-auto pt-4 border-t border-slate-100 w-full ${isCollapsed ? 'flex justify-center' : ''}`}>
          <SidebarItem to="/settings" icon={<Settings size={17} />} label="Configuración" isCollapsed={isCollapsed} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
