import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Search, Bell, MessageSquare, Menu } from 'lucide-react';
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
        <Link to="/app" className="flex items-center gap-5 group flex-shrink-0 mr-8 px-2 h-full">
          <div className="relative flex items-center h-full w-24">
            <img 
              src="/lumins-log.png" 
              alt="Lumins Logo" 
              className="h-[80px] min-w-[80px] object-contain transition-transform group-hover:scale-110 drop-shadow-2xl z-50 absolute left-1/2 -translate-x-1/2" 
            />
            <div className="absolute inset-0 bg-[#6C5DD3]/15 rounded opacity-0 group-hover:opacity-100 transition-opacity blur-3xl" />
          </div>
          
          {/* Vertical Separator */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-zinc-300 dark:via-zinc-700 to-transparent mx-1 sm:block hidden" />

          <span className="brand-logotype text-2xl bg-clip-text text-transparent bg-gradient-to-tr from-[#312E81] via-[#4338ca] to-[#7C3AED] hidden sm:block select-none">
            LUMINS
          </span>
        </Link>

        {/* Search Bar — hidden for now */}
        <div className="flex-1" />

        {/* Right Section: Actions · Divider · Avatar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          
          <GlobalCreateMenu 
            onCreateBoard={onCreateBoard}
            onCreateWorkspace={onCreateWorkspace}
            canCreateBoard={canCreateBoard}
          />

          <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 mx-2" />

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end hidden sm:flex">
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
