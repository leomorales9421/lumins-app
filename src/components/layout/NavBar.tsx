import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Search, Bell, MessageSquare, Menu, Shield, ShieldAlert, Settings } from 'lucide-react';
import GlobalCreateMenu from './GlobalCreateMenu';
import UserAvatar from '../ui/UserAvatar';
import { usePermission } from '../../contexts/PermissionContext';

interface NavBarProps {
  user: any;
  onCreateBoard: () => void;
  onCreateWorkspace: () => void;
  canCreateBoard: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ 
  user, 
  onCreateBoard, 
  onCreateWorkspace,
  canCreateBoard
}) => {
  const { isGodMode, setGodMode } = usePermission();
  const navigate = useNavigate();

  return (
    <nav className="h-16 bg-white dark:bg-[#1C1F26] border-b border-zinc-200 dark:border-white/10 flex items-center px-4 z-50 sticky top-0 w-full">
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="lg:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Brand/Logo */}
        <Link to="/app" className="flex items-center gap-1.5 group flex-shrink-0 mr-2 sm:mr-8 px-1 h-full">
          <div className="relative flex items-center h-full w-12 sm:w-20">
            <img 
              src="/lumins-log.webp" 
              alt="Lumins Logo" 
              className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-110 drop-shadow-xl z-50" 
            />
            <div className="absolute inset-0 bg-[#6C5DD3]/15 rounded opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
          </div>
          
          {/* Vertical Separator */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-zinc-300 dark:via-zinc-700 to-transparent mx-0 sm:block hidden" />

          <div className="flex items-baseline gap-1 hidden sm:flex">
            <span className="brand-logotype text-lg bg-clip-text text-transparent bg-gradient-to-tr from-[#312E81] via-[#4338ca] to-[#7C3AED] select-none font-black tracking-tighter">
              LUMINS
            </span>
            <span className="text-[10px] font-extrabold text-[#6C5DD3] dark:text-indigo-400 opacity-80 uppercase tracking-tight">
              Beta
            </span>
          </div>
        </Link>

        {/* Search Bar Area / Spacer */}
        <div className="flex-1" />

        {/* Right Section: Actions · Divider · Avatar */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          
          {/* System Admin Section */}
          {user?.globalRole === 'SYSTEM_ADMIN' && (
            <div className="flex items-center gap-1 sm:gap-1.5 mr-1 sm:mr-2 pr-1 sm:pr-2 border-r border-zinc-200 dark:border-white/10">
              <button
                onClick={() => navigate('/w/global/system-admin')}
                className="flex items-center justify-center p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-[#6C5DD3] transition-all border border-transparent hover:border-[#6C5DD3]/20"
                title="Panel de Control Global"
              >
                <Settings size={18} />
                <span className="hidden xl:block text-xs font-bold uppercase tracking-wider ml-2">Sistema</span>
              </button>

              {/* God Mode Toggle */}
              <button
                onClick={() => setGodMode(!isGodMode)}
                className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                  isGodMode 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]' 
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent'
                }`}
                title={isGodMode ? 'Desactivar Modo Dios' : 'Activar Modo Dios'}
              >
                {isGodMode ? <ShieldAlert size={18} /> : <Shield size={18} />}
                <span className="hidden md:block text-xs font-bold uppercase tracking-wider ml-2">GOD</span>
                {isGodMode && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-1" />}
              </button>
            </div>
          )}

          <GlobalCreateMenu 
            onCreateBoard={onCreateBoard}
            onCreateWorkspace={onCreateWorkspace}
            canCreateBoard={canCreateBoard}
          />

          <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 mx-1 sm:mx-2" />

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
            <div className="flex flex-col items-end hidden md:flex">
              <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                {user?.name}
              </span>
            </div>
            <Link 
              to="/settings/profile"
              className="w-9 h-9 rounded overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm hover:ring-2 hover:ring-[#6C5DD3]/20 transition-all cursor-pointer"
            >
              <UserAvatar 
                name={user?.name || ''} 
                avatarUrl={user?.avatarUrl} 
                size="sm"
              />
            </Link>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default NavBar;
