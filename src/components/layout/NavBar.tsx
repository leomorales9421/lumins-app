import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Search, Bell, MessageSquare } from 'lucide-react';
import GlobalCreateMenu from './GlobalCreateMenu';
import UserAvatar from '../ui/UserAvatar';

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
  return (
    <nav className="h-16 bg-white dark:bg-[#1C1F26] border-b border-zinc-200 dark:border-white/10 flex items-center px-6 z-50 sticky top-0">
      <div className="w-full flex items-center gap-4">
        
        {/* Brand/Logo */}
        <Link to="/app" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 bg-[#6C5DD3] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
             <Layout size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="hidden lg:block font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">Luminous</span>
        </Link>

        {/* Search Bar — centered, takes remaining space */}
        <div className="flex-1 flex justify-center px-4">
          <div className="relative flex items-center w-full max-w-md">
            <Search size={16} className="absolute left-3 text-zinc-400 dark:text-zinc-500" />
            <input 
              type="text"
              placeholder="Buscar proyectos o tareas..."
              className="w-full h-9 bg-[#F4F5F7] dark:bg-[#13151A] border border-zinc-200 dark:border-zinc-700 rounded-lg pl-10 pr-4 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 transition-all"
            />
          </div>
        </div>

        {/* Right Section: Messages · Notifications · + Nuevo · Divider · Avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* Messages icon */}
          <button className="w-8 h-8 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all">
            <MessageSquare size={18} />
          </button>

          {/* Notifications icon */}
          <button className="w-8 h-8 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all relative">
            <Bell size={18} />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-[#1C1F26]" />
          </button>

          {/* + Nuevo Button */}
          <GlobalCreateMenu 
            onCreateBoard={onCreateBoard}
            onCreateWorkspace={onCreateWorkspace}
            canCreateBoard={canCreateBoard}
          />

          <div className="h-8 w-px bg-zinc-200 dark:bg-white/10 mx-1" />

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-white/10">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                {user?.name}
              </span>
            </div>
            <Link 
              to="/settings/profile"
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm hover:ring-2 hover:ring-[#6C5DD3]/20 transition-all cursor-pointer"
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
