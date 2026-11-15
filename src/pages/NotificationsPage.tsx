import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { LuminsBellIcon } from '../components/icons/LuminsIcons';
import {
  useNotifications,
  type AppNotification,
} from '../contexts/NotificationsContext';
import {
  getNotificationMeta,
  formatNotificationTime,
} from '../components/notifications/notificationMeta';

const PAGE_LIMIT = 15;

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications: recentNotifications,
    fetchNotificationsPage,
    markAsRead,
    markAllAsRead,
    openNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchNotificationsPage(page, PAGE_LIMIT, filter);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      // Silenciar error transitorio; el estado anterior permanece visible
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotificationsPage, page, filter]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  // Sincronizar cambios en tiempo real cuando estamos viendo la primera página
  useEffect(() => {
    if (page === 1) {
      void loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentNotifications.length, unreadCount]);

  const handleFilterChange = (nextFilter: 'all' | 'unread') => {
    if (nextFilter === filter) return;
    setFilter(nextFilter);
    setPage(1);
  };

  const handleMarkOneRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markAsRead(id);
    setItems((prev) =>
      filter === 'unread'
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) =>
            item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
          )
    );
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    if (filter === 'unread') {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setPage(1);
    } else {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || now })));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#12A9A8]/12 text-slate-800 dark:text-white flex items-center justify-center">
              <LuminsBellIcon size={19} />
            </span>
            Centro de Notificaciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Historial completo de asignaciones, recordatorios y novedades del sistema.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12A9A8]/10 hover:bg-[#12A9A8]/20 text-[#12A9A8] text-xs font-bold transition-colors cursor-pointer"
          >
            <CheckCheck size={15} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#1E222D] border border-slate-200/70 dark:border-white/5">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-[#2A303E] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('unread')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'unread'
                ? 'bg-white dark:bg-[#2A303E] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            No leídas
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF665E] text-white text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          {total} {total === 1 ? 'notificación' : 'notificaciones'}
        </span>
      </div>

      {/* Lista */}
      <div className="bg-white dark:bg-[#1E222D] border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-slate-400 dark:text-zinc-500">
            <Loader2 size={24} className="animate-spin text-[#12A9A8]" />
            <span className="text-xs font-medium">Cargando historial...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300 flex items-center justify-center mx-auto mb-3">
              <LuminsBellIcon size={21} />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
              {filter === 'unread'
                ? 'No tienes notificaciones sin leer'
                : 'Aún no tienes notificaciones'}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Cuando recibas asignaciones, recordatorios o novedades aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {items.map((item) => {
              const meta = getNotificationMeta(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => openNotification(item, navigate)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openNotification(item, navigate);
                    }
                  }}
                  className={`px-4 sm:px-5 py-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                    item.isRead
                      ? 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      : 'bg-[#12A9A8]/[0.04] dark:bg-[#12A9A8]/[0.07] hover:bg-[#12A9A8]/[0.08]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.iconWrapperClass}`}
                  >
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                        {formatNotificationTime(item.createdAt)}
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#12A9A8]" title="No leída" />
                      )}
                    </div>

                    <h3
                      className={`text-sm mt-1.5 ${
                        item.isRead
                          ? 'font-semibold text-slate-700 dark:text-zinc-200'
                          : 'font-bold text-slate-900 dark:text-white'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => void handleMarkOneRead(e, item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#12A9A8] hover:bg-[#12A9A8]/10 transition-colors cursor-pointer"
                        title="Marcar como leída"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    {(item.actionUrl || item.type === 'PRODUCT_UPDATE') && (
                      <span className="p-2 rounded-lg text-slate-400 dark:text-zinc-500">
                        <ExternalLink size={14} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación Server-Side */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-[#181B24] flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E222D] text-xs font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>

            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Página <span className="text-slate-800 dark:text-white font-bold">{page}</span> de{' '}
              <span className="text-slate-800 dark:text-white font-bold">{totalPages}</span>
            </span>

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E222D] text-xs font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Siguiente
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
