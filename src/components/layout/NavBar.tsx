import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavBarProps {
  user: any;
  logout: () => void;
}

const NavLink: React.FC<{ to: string; label: string; active?: boolean }> = ({ to, label, active }) => (
  <Link 
    to={to} 
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
      ${active ? 'bg-[#7A5AF8] text-white shadow-soft' : 'text-[#806F9B] hover:text-[#7A5AF8] hover:bg-[#F3E8FF]'}
    `}
  >
    {label}
  </Link>
);

const NavBar: React.FC<NavBarProps> = ({ user, logout }) => {
  const location = useLocation();

  return (
    <nav className="h-[90px] bg-white border-b border-zinc-100 flex items-center px-10 z-50 relative">
      <div className="w-full flex justify-between items-center gap-10">
        
        {/* Brand/Logo */}
        <Link to="/app" className="text-2xl font-black tracking-tighter text-zinc-900 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#7A5AF8] rounded-xl flex items-center justify-center shadow-lg">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/></svg>
          </div>
          <span className="hidden lg:block uppercase tracking-widest text-lg">Lumins</span>
        </Link>

        {/* TOP MENU: Migrated from Sidebar */}
        <div className="hidden md:flex items-center gap-2 bg-[#F3E8FF]/50 p-1.5 rounded-2xl border border-[#7A5AF8]/5">
           <NavLink to="/app" label="Dashboard" active={location.pathname === '/app'} />
           <NavLink to="#" label="Timeline" />
           <NavLink to="#" label="Resources" />
           <NavLink to="#" label="Insights" />
        </div>

        {/* Search Bar (Condensed) */}
        <div className="flex-1 max-w-[400px]">
          <div className="relative flex items-center group">
            <div className="absolute left-5 text-[#806F9B]/50">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
              type="text"
              placeholder="Search projects..."
              className="w-full h-11 bg-zinc-50 rounded-xl pl-12 pr-6 text-xs font-bold text-zinc-700 placeholder:text-[#806F9B]/40 focus:outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 transition-all border border-transparent focus:border-[#7A5AF8]/10"
            />
          </div>
        </div>

        {/* Top Nav Actions */}
        <div className="flex items-center gap-6">
          <button className="text-[#806F9B]/60 hover:text-[#7A5AF8] transition-colors relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#E91E63] rounded-full border-2 border-white" />
          </button>
          
          <div className="flex items-center gap-4 group cursor-pointer border-l border-zinc-100 pl-6" onClick={logout}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-soft border-2 border-white group-hover:border-[#7A5AF8] transition-all">
               <img src={`https://i.pravatar.cc/100?u=${user?.email}`} alt="user" />
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default NavBar;
