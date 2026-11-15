import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import { Menu, Settings, ChevronDown } from 'lucide-react';
import GlobalCreateMenu from './GlobalCreateMenu';
import NotificationsBellMenu from './NotificationsBellMenu';
import UserAvatar from '../ui/UserAvatar';
import { BrandLogo } from '../ui/BrandLogo';
import WorkspaceSwitcher from '../WorkspaceSwitcher';
import SupportModal from '../support/SupportModal';
import ConfirmActionModal from '../ConfirmActionModal';
import {
  LuminsBoardIcon,
  LuminsCalendarIcon,
  LuminsActivityIcon,
  LuminsInsightsIcon,
  LuminsMembersIcon,
  LuminsSettingsIcon,
  LuminsSupportIcon,
  LuminsLogoutIcon
} from '../icons/LuminsIcons';

interface NavBarProps {
  user: any;
  onCreateBoard?: () => void;
  onCreateWorkspace?: () => void;
  onInviteMember?: () => void;
  canCreateBoard?: boolean;
  isBoardView?: boolean;
  hideDesktopNav?: boolean;
  logout?: () => void;
}

const TopNavItem: React.FC<{
  to: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  label: string;
}> = ({ to, renderIcon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
      ${isActive
        ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-sm'
        : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
      }
    `}
  >
    {({ isActive }) => (
      <>
        <span className="flex items-center justify-center shrink-0">{renderIcon(isActive)}</span>
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

const NavBar: React.FC<NavBarProps> = ({
  user,
  onCreateBoard = () => {},
  onCreateWorkspace = () => {},
  onInviteMember,
  canCreateBoard = false,
  hideDesktopNav = false,
  logout = () => {}
}) => {
  const navigate = useNavigate();
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const effectiveWorkspaceId = urlWorkspaceId === 'global' ? null : urlWorkspaceId;
  const workspaceId = effectiveWorkspaceId || localStorage.getItem('lastActiveWorkspaceId');

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="h-14 bg-white/95 dark:bg-[#1E222D]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 flex items-center px-4 sm:px-6 z-50 sticky top-0 w-full">
        <div className="w-full flex items-center justify-between gap-3">

          {/* Left: Mobile Toggle · Logo · Workspace Switcher · Top Nav Links */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 overflow-hidden">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <Link to="/app" className="flex items-center gap-1.5 group flex-shrink-0 px-1">
              <BrandLogo size="sm" variant="dark-text" className="dark:hidden" />
              <BrandLogo size="sm" variant="light-text" className="hidden dark:inline-flex" />
            </Link>

            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-white/10 mx-0.5 shrink-0" />

            {/* Compact Workspace Switcher */}
            <div className="hidden sm:block max-w-[180px] xl:max-w-[220px] shrink-0">
              <WorkspaceSwitcher onCreateClick={onCreateWorkspace} />
            </div>

            <div
              aria-hidden={hideDesktopNav}
              className={`hidden lg:flex items-center min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                hideDesktopNav
                  ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                  : 'max-w-[46rem] opacity-100 translate-x-0'
              }`}
            >
              <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1.5 shrink-0" />

              {/* Desktop Top Navigation Links */}
              <div className="flex items-center gap-0.5 xl:gap-1 min-w-0 overflow-x-auto no-scrollbar">
                <TopNavItem
                  to={workspaceId ? `/w/${workspaceId}/dashboard` : '/app'}
                  renderIcon={(active) => <LuminsBoardIcon size={19} active={active} />}
                  label="Tableros"
                />
                <TopNavItem
                  to={workspaceId ? `/w/${workspaceId}/calendar` : '/calendar'}
                  renderIcon={(active) => <LuminsCalendarIcon size={19} active={active} />}
                  label="Calendario"
                />
                <TopNavItem
                  to={workspaceId ? `/w/${workspaceId}/activity` : '/activity'}
                  renderIcon={(active) => <LuminsActivityIcon size={19} active={active} />}
                  label="Actividad"
                />
                <TopNavItem
                  to={workspaceId ? `/w/${workspaceId}/insights` : '/insights'}
                  renderIcon={(active) => <LuminsInsightsIcon size={19} active={active} />}
                  label="Insights"
                />
                <TopNavItem
                  to={workspaceId ? `/w/${workspaceId}/members` : '/members'}
                  renderIcon={(active) => <LuminsMembersIcon size={19} active={active} />}
                  label="Miembros"
                />
              </div>
            </div>
          </div>

          {/* Right Section: Actions · Bell · User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {user?.globalRole === 'SYSTEM_ADMIN' && (
              <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200 dark:border-white/10">
                <button
                  onClick={() => navigate('/w/global/system-admin')}
                  className="flex items-center justify-center h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-[var(--lumins-accent-fg)] transition-all cursor-pointer"
                  title="Panel interno de plataforma"
                >
                  <Settings size={15} />
                  <span className="hidden xl:block text-[11px] font-bold ml-1.5">Sistema</span>
                </button>
              </div>
            )}

            <GlobalCreateMenu
              onCreateBoard={onCreateBoard}
              onCreateWorkspace={onCreateWorkspace}
              onInviteMember={onInviteMember}
              canCreateBoard={canCreateBoard}
            />

            {/* Campana de Notificaciones */}
            <NotificationsBellMenu />

            <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xs">
                  <UserAvatar
                    name={user?.name || ''}
                    avatarUrl={user?.avatarUrl}
                    size="sm"
                    className="w-full h-full"
                  />
                </div>
                <span className="hidden xl:block text-xs font-semibold text-slate-700 dark:text-zinc-100 max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown size={13} className={`hidden xl:block text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1C1F26] rounded-xl shadow-dropdown border border-slate-200/90 dark:border-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{user?.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/settings/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <LuminsSettingsIcon size={15} />
                    <span>Configuración</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowSupportModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <LuminsSupportIcon size={15} />
                    <span>Soporte y Ayuda</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100/90 dark:hover:bg-white/5 hover:text-[#C83730] transition-all cursor-pointer"
                  >
                    <LuminsLogoutIcon size={15} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </nav>

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      <ConfirmActionModal
        isOpen={showLogoutConfirm}
        title="¿Cerrar sesión?"
        description="Se cerrará tu sesión actual en Lumins y tendrás que volver a iniciar sesión para acceder a tus tableros."
        confirmLabel="Sí, cerrar sesión"
        cancelLabel="Cancelar"
        variant="danger"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout?.();
        }}
      />
    </>
  );
};

export default NavBar;
