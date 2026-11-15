import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, ArrowRight, Loader2 } from 'lucide-react';
import { LuminsBellIcon } from '../icons/LuminsIcons';
import { useNotifications } from '../../contexts/NotificationsContext';
import { getNotificationMeta, formatNotificationTime } from '../notifications/notificationMeta';

const NotificationsBellMenu: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    openNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[var(--lumins-accent-fg)] transition-all flex items-center justify-center cursor-pointer"
        title="Notificaciones"
        aria-label="Notificaciones"
        aria-expanded={isOpen}
      >
        <LuminsBellIcon size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#FF665E] text-white text-[10px] font-black leading-none flex items-center justify-center ring-2 ring-white dark:ring-[#1C1F26] pointer-events-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[340px] sm:w-[390px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[90]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-[#181B24]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-100">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF665E]/12 text-[#FF665E] text-[10px] font-black">
                  {unreadCount} sin leer
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#12A9A8] hover:text-[#0e8f8e] transition-colors cursor-pointer"
              >
                <CheckCheck size={13} />
                Marcar todas
              </button>
            )}
          </div>

          {/* List (últimas 10) */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {isLoading && notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
                <Loader2 size={20} className="animate-spin text-[#12A9A8]" />
                <span className="text-xs font-medium">Cargando notificaciones...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-6 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300 flex items-center justify-center mx-auto mb-2.5">
                  <LuminsBellIcon size={19} />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                  Todo al día
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Aquí verás asignaciones de tarjetas, recordatorios y novedades de Lumins.
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((item) => {
                const meta = getNotificationMeta(item.type);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openNotification(item, navigate);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      item.isRead
                        ? 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                        : 'bg-[#12A9A8]/[0.04] dark:bg-[#12A9A8]/[0.07] hover:bg-[#12A9A8]/[0.08]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.iconWrapperClass}`}
                    >
                      {meta.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 shrink-0">
                          {formatNotificationTime(item.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`text-xs mt-1 truncate ${
                          item.isRead
                            ? 'font-semibold text-slate-700 dark:text-zinc-300'
                            : 'font-bold text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {!item.isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-[#12A9A8] shrink-0 mt-2"
                        title="No leída"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-[#181B24]">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full py-1.5 rounded-xl text-xs font-bold text-[#12A9A8] hover:bg-[#12A9A8]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Ver todas las notificaciones
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBellMenu;
