import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Link2,
  Link2Off,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import { GoogleCalendarIcon } from '../ui/GoogleCalendarIcon';

interface GoogleCalendarStatus {
  connected: boolean;
  calendarName?: string;
  accountEmail?: string;
  connectedAt?: string;
  lastSyncAt?: string | null;
}


interface CalendarGoogleSyncButtonProps {
  workspaceId: string;
  onSyncCompleted?: () => void;
}

export const CalendarGoogleSyncButton: React.FC<CalendarGoogleSyncButtonProps> = ({
  workspaceId,
  onSyncCompleted,
}) => {
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get('/api/integrations/google-calendar/status');
      const payload = res?.status !== undefined ? res : res?.data;
      if (payload?.status) {
        setStatus(payload.status);
      }
    } catch {
      setStatus({ connected: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const currentPath = window.location.pathname;
      const res: any = await apiClient.get('/api/integrations/google-calendar/auth-url', {
        params: { returnUrl: currentPath },
      });
      const url = res?.url || res?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('No se pudo generar la URL de autorización');
        setIsConnecting(false);
      }
    } catch {
      toast.error('Error al conectar con Google');
      setIsConnecting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      const syncUrl = workspaceId
        ? `/api/integrations/google-calendar/sync/${workspaceId}`
        : `/api/integrations/google-calendar/sync`;

      const res: any = await apiClient.post(syncUrl);
      const payload = res?.data || res;

      if (payload?.success) {
        const syncData = payload.data || payload;
        toast.success(`Google Calendar actualizado`, {
          description: `${syncData.syncedCount ?? 0} tarjetas sincronizadas en "${syncData.calendarName || 'Lumins'}".`,
        });
        fetchStatus();
        onSyncCompleted?.();
      }
    } catch {
      toast.error('Error al sincronizar con Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return null;
  }

  // Not connected yet: display quick-connect button directly in calendar
  if (!status.connected) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        title="Vincular con tu cuenta de Google Calendar"
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 transition-all shadow-sm"
      >
        <GoogleCalendarIcon size={14} />
        <span className="hidden xl:inline">
          {isConnecting ? 'Conectando...' : 'Vincular Google Calendar'}
        </span>
      </button>
    );
  }

  // Connected: display live status badge + sync popover
  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Google Calendar conectado y activo"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:border-emerald-500/50 transition-all shadow-sm"
      >
        <GoogleCalendarIcon size={14} />
        <span className="hidden sm:inline">Google Calendar</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-[#1C1F26] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 p-3.5 z-[130] space-y-3 text-xs"
          >
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <GoogleCalendarIcon size={20} />
                <div>
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    Google Calendar
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase">
                      Activo
                    </span>
                  </div>
                  {status.accountEmail && (
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[170px]">
                      {status.accountEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 bg-zinc-50 dark:bg-black/20 p-2.5 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Calendario:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {status.calendarName || 'Lumins'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Último sync:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {status.lastSyncAt
                    ? new Date(status.lastSyncAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Automático'}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/50 dark:border-white/5">
                ⚡ Las tarjetas se sincronizan automáticamente al crearlas o moverlas en Lumins.
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1.5 pt-0.5">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                >
                  Abrir calendario
                  <ExternalLink size={11} />
                </a>
                <a
                  href="/settings/integrations"
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium hover:underline"
                >
                  Ajustes
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

