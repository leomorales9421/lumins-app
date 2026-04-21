import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Layout, 
  Settings, 
  Users, 
  Calendar, 
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import WorkspaceSwitcher from '../WorkspaceSwitcher';

interface SidebarProps {
  onCreateWorkspace: () => void;
  isFloating?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  logout: () => void;
}

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; isCollapsed: boolean; isFloating?: boolean }> = ({ to, icon, label, isCollapsed, isFloating }) => (
  <NavLink
    to={to}
    title={isCollapsed ? label : undefined}
    className={({ isActive }) => `
      flex items-center transition-all font-bold text-[13px] rounded-lg p-2.5
      ${isActive 
        ? 'bg-[#6C5DD3] text-white shadow-sm shadow-indigo-500/20' 
        : isFloating 
          ? 'text-white/70 hover:text-white hover:bg-white/10'
          : 'text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5'
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

const Sidebar: React.FC<SidebarProps> = ({ onCreateWorkspace, isFloating = false, isOpen = false, onClose, logout }) => {
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const workspaceId = urlWorkspaceId || localStorage.getItem('lastActiveWorkspaceId');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarClasses = isFloating 
    ? `fixed inset-y-0 left-0 z-[100] transition-all duration-500 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} bg-white/10 dark:bg-black/10 backdrop-blur-xl border-r border-white/10 w-64 shadow-2xl`
    : `relative group bg-white dark:bg-[#1C1F26] border-r border-zinc-200 dark:border-white/10 flex flex-col h-full sticky top-0 transition-all duration-300 ease-in-out z-40 ${isCollapsed ? 'w-20' : 'w-72'}`;

  return (
    <>
      {/* Backdrop for floating sidebar */}
      {isFloating && isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99] transition-opacity duration-500"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Collapse Toggle Button */}
        {!isFloating && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              absolute -right-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center 
              rounded-full border border-zinc-200 bg-white text-zinc-400 
              shadow-sm transition-all hover:scale-110 hover:border-zinc-300 
              hover:text-zinc-700 hover:shadow-md z-50 
              dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300
              ${isCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
          >
            {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
          </button>
        )}

        <div className={`px-3 py-6 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar ${isCollapsed ? 'items-center' : ''}`}>
          
          {/* Workspace Switcher Section */}
          <div className={`w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {!isCollapsed && (
              <p className={`text-[10px] font-bold ${isFloating ? 'text-white/40' : 'text-zinc-400 dark:text-zinc-300'} uppercase tracking-[0.2em] px-2 mb-3`}>
                Espacio de Trabajo
              </p>
            )}
            <WorkspaceSwitcher onCreateClick={onCreateWorkspace} isCollapsed={isCollapsed} isFloating={isFloating} />
          </div>

          {/* Main Navigation */}
          <div className="space-y-1 w-full">
            {!isCollapsed && (
              <p className={`text-[10px] font-bold ${isFloating ? 'text-white/40' : 'text-zinc-400 dark:text-zinc-300'} uppercase tracking-[0.2em] px-2 mb-3`}>
                Principal
              </p>
            )}
            <SidebarItem 
              to={workspaceId ? `/w/${workspaceId}/dashboard` : "/app"} 
              icon={<Layout size={18} />} 
              label="Tableros" 
              isCollapsed={isCollapsed}
              isFloating={isFloating}
            />
            <SidebarItem 
              to={workspaceId ? `/w/${workspaceId}/calendar` : "/calendar"} 
              icon={<Calendar size={18} />} 
              label="Calendario" 
              isCollapsed={isCollapsed} 
              isFloating={isFloating}
            />
            <SidebarItem 
              to={workspaceId ? `/w/${workspaceId}/activity` : "/activity"} 
              icon={<Activity size={18} />} 
              label="Actividad" 
              isCollapsed={isCollapsed} 
              isFloating={isFloating}
            />
            <SidebarItem 
              to={workspaceId ? `/w/${workspaceId}/members` : "/members"} 
              icon={<Users size={18} />} 
              label="Miembros" 
              isCollapsed={isCollapsed}
              isFloating={isFloating}
            />
          </div>

          {/* Footer Navigation */}
          <div className={`mt-auto pb-6 ${isCollapsed ? 'px-2' : 'px-4'} flex flex-col gap-1 border-t ${isFloating ? 'border-white/10' : 'border-zinc-100 dark:border-white/5'} pt-6 w-full`}>
            <SidebarItem 
              to="/settings" 
              icon={<Settings size={18} />} 
              label="Configuración" 
              isCollapsed={isCollapsed} 
              isFloating={isFloating} 
            />
            
            <button
              onClick={logout}
              title={isCollapsed ? "Cerrar sesión" : undefined}
              className={`
                flex items-center transition-colors rounded-lg p-2.5 w-full text-[13px] font-bold
                text-zinc-500 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-500 cursor-pointer
                ${isCollapsed ? 'justify-center' : 'gap-3'}
              `}
            >
              <span className={`${isCollapsed ? 'scale-110' : ''} transition-transform flex-shrink-0`}>
                <LogOut size={18} />
              </span>
              {!isCollapsed && (
                <span className="whitespace-nowrap overflow-hidden opacity-100 transition-all">
                  Cerrar sesión
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
