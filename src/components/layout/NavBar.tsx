import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Search, Bell, MessageSquare } from 'lucide-react';
import GlobalCreateMenu from './GlobalCreateMenu';

interface NavBarProps {
  user: any;
  logout: () => void;
  onCreateBoard: () => void;
  onCreateWorkspace: () => void;
  canCreateBoard: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ 
  user, 
  logout, 
  onCreateBoard, 
  onCreateWorkspace,
  canCreateBoard
}) => {
  return (
    <nav className="h-16 bg-white border-b border-[#E8E9EC] flex items-center px-6 z-50 sticky top-0">
      <div className="w-full flex items-center gap-4">
        
        {/* Brand/Logo */}
        <Link to="/app" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 bg-[#7A5AF8] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
             <Layout size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="hidden lg:block font-bold text-lg text-[#1A1A2E] tracking-tight">Luminous</span>
        </Link>

        {/* Search Bar — centered, takes remaining space */}
        <div className="flex-1 flex justify-center px-4">
          <div className="relative flex items-center w-full max-w-md">
            <Search size={16} className="absolute left-3 text-[#9CA3AF]" />
            <input 
              type="text"
              placeholder="Buscar proyectos o tareas..."
              className="w-full h-9 bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg pl-10 pr-4 text-[13px] font-medium text-[#1A1A2E] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all"
            />
          </div>
        </div>

        {/* Right Section: Messages · Notifications · + Nuevo · Divider · Avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* Messages icon */}
          <button className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F4F5F7] rounded-lg transition-all">
            <MessageSquare size={18} />
          </button>

          {/* Notifications icon */}
          <button className="w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F4F5F7] rounded-lg transition-all relative">
            <Bell size={18} />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </button>

          {/* + Nuevo Button */}
          <GlobalCreateMenu 
            onCreateBoard={onCreateBoard}
            onCreateWorkspace={onCreateWorkspace}
            canCreateBoard={canCreateBoard}
          />

          <div className="h-8 w-px bg-[#E8E9EC] mx-1" />

          {/* User Avatar */}
          <div className="flex items-center gap-2.5 pl-1 group cursor-pointer" onClick={logout}>
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E8E9EC] group-hover:border-[#7A5AF8] transition-all shadow-sm">
               <img src={`https://i.pravatar.cc/100?u=${user?.email}`} alt="user avatar" className="w-full h-full object-cover" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
               <span className="text-[12px] font-bold text-[#1A1A2E] leading-tight">{user?.name || 'Usuario'}</span>
               <span className="text-[10px] font-medium text-[#9CA3AF] leading-tight">Admin</span>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default NavBar;
