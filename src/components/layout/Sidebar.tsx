import React, { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Bell, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProductUpdates } from '../../contexts/ProductUpdatesContext';
import apiClient from '../../lib/api-client';
import WorkspaceSwitcher from '../WorkspaceSwitcher';
import { BrandLogo } from '../ui/BrandLogo';
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

interface SidebarProps {
  onCreateWorkspace: () => void;
  onCreateBoard?: () => void;
  canCreateBoard?: boolean;
  isFloating?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  logout: () => void;
}

const SidebarItem: React.FC<{
  to: string;
  renderIcon: (isActive: boolean) => React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isFloating?: boolean;
}> = ({ to, renderIcon, label, isCollapsed, isFloating }) => (
  <NavLink
    to={to}
    title={isCollapsed ? label : undefined}
    className={({ isActive }) => `
      flex items-center transition-all font-semibold text-xs rounded-xl
      ${isActive
        ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-md'
        : isFloating
          ? 'text-white/80 hover:text-white hover:bg-white/10'
          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/80 dark:hover:bg-white/5'
      }
      ${isCollapsed ? 'justify-center p-2' : 'justify-start gap-2.5 px-3 py-2'}
    `}
  >
    {({ isActive }) => (
      <>
        <span className={`${isCollapsed ? 'scale-105' : ''} transition-transform flex-shrink-0 flex items-center justify-center`}>
          {renderIcon(isActive)}
        </span>
        <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          {label}
        </span>
      </>
    )}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({
  onCreateWorkspace,
  onCreateBoard,
  canCreateBoard = false,
  isFloating = false,
  isOpen = false,
  onClose,
  logout
}) => {
  const { user, setUser } = useAuth();
  const { openUpdates, hasUnread } = useProductUpdates();
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const effectiveWorkspaceId = urlWorkspaceId === 'global' ? null : urlWorkspaceId;
  const workspaceId = effectiveWorkspaceId || localStorage.getItem('lastActiveWorkspaceId');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof user?.preferences?.sidebarCollapsed === 'boolean') {
      return user.preferences.sidebarCollapsed;
    }
    return localStorage.getItem('lumins_sidebar_collapsed') === 'true';
  });
  const effectiveCollapsed = isFloating ? false : isCollapsed;
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (typeof user?.preferences?.sidebarCollapsed === 'boolean') {
      setIsCollapsed(user.preferences.sidebarCollapsed);
      localStorage.setItem('lumins_sidebar_collapsed', String(user.preferences.sidebarCollapsed));
    }
  }, [user?.preferences?.sidebarCollapsed]);

  const handleToggleCollapse = async () => {
    const previous = isCollapsed;
    const next = !previous;
    setIsCollapsed(next);
    localStorage.setItem('lumins_sidebar_collapsed', String(next));

    try {
      const res = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', {
        preferences: { sidebarCollapsed: next },
      });
      if (setUser && res.data?.user) {
        setUser(prev =>
          prev
            ? {
                ...prev,
                ...res.data.user,
                preferences: { ...(prev.preferences || {}), ...(res.data.user.preferences || {}), sidebarCollapsed: next },
              }
            : res.data.user
        );
      }
    } catch {
      setIsCollapsed(previous);
      localStorage.setItem('lumins_sidebar_collapsed', String(previous));
    }
  };

  const sidebarClasses = `
    group transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] transform flex flex-col
    ${isFloating
      ? 'fixed inset-y-0 left-0 w-72 sm:w-64 sm:top-16 sm:bottom-auto sm:left-5 sm:max-h-[calc(100dvh-5rem)] sm:rounded-2xl z-[100] bg-[#161920]/95 backdrop-blur-2xl border-r sm:border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
      : 'fixed lg:relative inset-y-0 lg:inset-auto left-0 w-64 z-[100] lg:z-40 bg-white dark:bg-[#1C1F26] border-r border-slate-200/80 dark:border-white/10 h-full'}
    ${isOpen
      ? 'translate-x-0 opacity-100'
      : isFloating
        ? '-translate-x-[120%] opacity-0 pointer-events-none'
        : '-translate-x-full lg:translate-x-0'}
    ${!isFloating && effectiveCollapsed ? 'lg:w-20' : !isFloating ? 'lg:w-64' : ''}
  `;

  return (
    <>
      {/* Backdrop for mobile and floating sidebar */}
      {(isOpen || (isFloating && isOpen)) && (
        <div
          className={`fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[99] transition-opacity duration-500 ${!isFloating ? 'lg:hidden' : ''}`}
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Collapse Toggle Button */}
        {!isFloating && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            className={`
              absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex h-6 w-6 items-center justify-center
              rounded-lg border border-slate-200 bg-white text-slate-500
              shadow-sm transition-all hover:scale-110 hover:border-[var(--lumins-accent-border)]
              hover:text-[var(--lumins-accent-fg)] hover:shadow-md z-50 cursor-pointer
              dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200
              ${isCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
          >
            {isCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
          </button>
        )}

        <div className={`px-3 py-3.5 flex flex-col h-full overflow-y-auto no-scrollbar ${effectiveCollapsed ? 'items-center px-2' : ''}`}>

          {/* Header flotante en vista de tablero (Lumins + Novedades + Cerrar) */}
          {isFloating && (
            <div className="flex items-center justify-between gap-2 px-1 pb-3 mb-3 border-b border-white/10">
              <BrandLogo size="sm" variant="light-text" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    openUpdates();
                  }}
                  className="relative p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Novedades del sistema"
                  aria-label="Novedades del sistema"
                >
                  <Bell size={15} />
                  {hasUnread && (
                    <span className="absolute top-1 right-1 flex h-2 w-2 pointer-events-none">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF665E] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF665E]" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Cerrar menú"
                  aria-label="Cerrar menú"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Workspace Switcher Section (siempre visible en menú flotante; en layout normal solo < sm) */}
          <div className={`w-full ${isFloating ? 'mb-3' : 'sm:hidden mb-4'} ${effectiveCollapsed ? 'flex flex-col items-center' : ''}`}>
            {!effectiveCollapsed && (
              <p className={`text-[10px] font-bold ${isFloating ? 'text-white/40' : 'text-slate-400 dark:text-zinc-300'} uppercase tracking-[0.2em] px-2 mb-2`}>
                Espacio de Trabajo
              </p>
            )}
            <WorkspaceSwitcher onCreateClick={onCreateWorkspace} isCollapsed={effectiveCollapsed} isFloating={isFloating} />
          </div>

          {/* Main Navigation */}
          <div className="space-y-1 w-full">
            {!effectiveCollapsed && (
              <p className={`text-[10px] font-bold ${isFloating ? 'text-white/40' : 'text-slate-400 dark:text-zinc-300'} uppercase tracking-[0.2em] px-2 mb-2`}>
                Principal
              </p>
            )}
            <SidebarItem
              to={workspaceId ? `/w/${workspaceId}/dashboard` : '/app'}
              renderIcon={(active) => <LuminsBoardIcon size={19} active={active} />}
              label="Tableros"
              isCollapsed={effectiveCollapsed}
              isFloating={isFloating}
            />
            <SidebarItem
              to={workspaceId ? `/w/${workspaceId}/calendar` : '/calendar'}
              renderIcon={(active) => <LuminsCalendarIcon size={19} active={active} />}
              label="Calendario"
              isCollapsed={effectiveCollapsed}
              isFloating={isFloating}
            />
            <SidebarItem
              to={workspaceId ? `/w/${workspaceId}/activity` : '/activity'}
              renderIcon={(active) => <LuminsActivityIcon size={19} active={active} />}
              label="Actividad"
              isCollapsed={effectiveCollapsed}
              isFloating={isFloating}
            />
            <SidebarItem
              to={workspaceId ? `/w/${workspaceId}/insights` : '/insights'}
              renderIcon={(active) => <LuminsInsightsIcon size={19} active={active} />}
              label="Insights"
              isCollapsed={effectiveCollapsed}
              isFloating={isFloating}
            />
            <SidebarItem
              to={workspaceId ? `/w/${workspaceId}/members` : '/members'}
              renderIcon={(active) => <LuminsMembersIcon size={19} active={active} />}
              label="Miembros"
              isCollapsed={effectiveCollapsed}
              isFloating={isFloating}
            />

            {isFloating && canCreateBoard && onCreateBoard && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onCreateBoard();
                }}
                className="mt-2 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/85 hover:text-white bg-white/8 hover:bg-white/14 border border-white/10 transition-all cursor-pointer"
              >
                <Plus size={16} className="text-[var(--lumins-accent)] shrink-0" />
                <span>Nuevo tablero</span>
              </button>
            )}
          </div>

          {/* Footer Navigation */}
          <div className={`mt-auto pb-1 ${effectiveCollapsed ? 'px-1' : 'px-1'} flex flex-col gap-1 border-t ${isFloating ? 'border-white/10 mt-3' : 'border-slate-100 dark:border-white/5'} pt-3 w-full`}>
            <SidebarItem
              to="/settings/profile"
              renderIcon={(active) => <LuminsSettingsIcon size={17} active={active} />}
              label="Configuración"
              isCollapsed={effectiveCollapsed}
              isFloating={isFloating}
            />

            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              title={effectiveCollapsed ? 'Soporte y Ayuda' : undefined}
              className={`
                flex items-center transition-all rounded-xl py-2 px-3 w-full text-xs font-semibold cursor-pointer
                ${isFloating
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-[var(--lumins-accent-soft)] hover:text-[var(--lumins-accent-fg)]'}
                ${effectiveCollapsed ? 'justify-center px-2' : 'gap-2.5'}
              `}
            >
              <span className={`${effectiveCollapsed ? 'scale-105' : ''} transition-transform flex-shrink-0 flex items-center justify-center`}>
                <LuminsSupportIcon size={17} />
              </span>
              {!effectiveCollapsed && (
                <span className="whitespace-nowrap overflow-hidden opacity-100 transition-all">
                  Soporte y Ayuda
                </span>
              )}
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title={effectiveCollapsed ? 'Cerrar sesión' : undefined}
              className={`
                flex items-center transition-all rounded-xl py-2 px-3 w-full text-xs font-semibold cursor-pointer
                ${isFloating
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/90 dark:hover:bg-white/5 hover:text-[#C83730] dark:hover:text-[#FF857E]'}
                ${effectiveCollapsed ? 'justify-center px-2' : 'gap-2.5'}
              `}
            >
              <span className={`${effectiveCollapsed ? 'scale-105' : ''} transition-transform flex-shrink-0 flex items-center justify-center`}>
                <LuminsLogoutIcon size={17} />
              </span>
              {!effectiveCollapsed && (
                <span className="whitespace-nowrap overflow-hidden opacity-100 transition-all">
                  Cerrar sesión
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

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
          logout();
        }}
      />
    </>
  );
};

export default Sidebar;
