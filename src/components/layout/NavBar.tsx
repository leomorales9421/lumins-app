import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Search, Bell, ChevronDown } from 'lucide-react';
import GlobalCreateMenu from './GlobalCreateMenu';

interface NavBarProps {
  user: any;
  logout: () => void;
  onCreateBoard: () => void;
  onCreateWorkspace: () => void;
  canCreateBoard: boolean;
}

const NavLink: React.FC<{ to: string; label: string; active?: boolean }> = ({ to, label, active }) => (
  <Link 
    to={to} 
    className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all
      ${active ? 'bg-[#F4F5F7] text-[#7A5AF8]' : 'text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F4F5F7]'}
    `}
  >
    {label}
  </Link>
);

const NavBar: React.FC<NavBarProps> = ({ 
  user, 
  logout, 
  onCreateBoard, 
  onCreateWorkspace,
  canCreateBoard
}) => {
  const location = useLocation();

  return (
    <nav className="h-16 bg-white border-b border-[#E8E9EC] flex items-center px-6 z-50 sticky top-0">
      <div className="w-full flex justify-between items-center gap-8">
        
        {/* Brand/Logo */}
        <Link to="/app" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#7A5AF8] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
             <Layout size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="hidden lg:block font-bold text-lg text-[#1A1A2E] tracking-tight">Luminous</span>
        </Link>

        {/* Menu Links */}
        <div className="hidden md:flex items-center gap-1">
           <NavLink to="/app" label="Tableros" active={location.pathname === '/app'} />
           <NavLink to="#" label="Calendario" />
           <NavLink to="#" label="Actividad" />
        </div>

        {/* Universal Action Button */}
        <div className="ml-2">
          <GlobalCreateMenu 
            onCreateBoard={onCreateBoard}
            onCreateWorkspace={onCreateWorkspace}
            canCreateBoard={canCreateBoard}
          />
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-[#9CA3AF]" />
            <input 
              type="text"
              placeholder="Buscar proyectos o tareas..."
              className="w-full h-9 bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg pl-10 pr-4 text-[13px] font-medium text-[#1A1A2E] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all"
            />
          </div>
        </div>

        {/* Profile & Notifications */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F4F5F7] rounded-lg transition-all relative">
            <Bell size={20} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          
          <div className="h-8 w-px bg-[#E8E9EC] mx-1" />

          <div className="flex items-center gap-3 pl-1 group cursor-pointer" onClick={logout}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E8E9EC] group-hover:border-[#7A5AF8] transition-all shadow-sm">
               <img src={`https://i.pravatar.cc/100?u=${user?.email}`} alt="user avatar" className="w-full h-full object-cover" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
               <span className="text-[12px] font-bold text-[#1A1A2E] leading-tight">{user?.name || 'Usuario'}</span>
               <span className="text-[10px] font-medium text-[#9CA3AF] leading-tight">Admin</span>
            </div>
            <ChevronDown size={14} className="text-[#9CA3AF] group-hover:text-[#1A1A2E] transition-colors" />
          </div>
        </div>

      </div>
    </nav>
  );
};

export default NavBar;
