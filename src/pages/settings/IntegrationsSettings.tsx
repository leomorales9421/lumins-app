import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Link2Off,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { GoogleCalendarIcon } from '../../components/ui/GoogleCalendarIcon';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';

const TrelloIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z" />
  </svg>
);


interface GoogleCalendarStatus {
  connected: boolean;
  calendarName?: string;
  accountEmail?: string;
  syncFrequency?: 'manual' | '30m' | '2h' | '6h' | 'daily';
  connectedAt?: string;
  lastSyncAt?: string | null;
}

const IntegrationsSettings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Trello state
  const [trelloToken, setTrelloToken] = useState<string | null>(null);
  const [isUnlinkingTrello, setIsUnlinkingTrello] = useState(false);

  // Google Calendar state
  const [gcalStatus, setGcalStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [isLoadingGcal, setIsLoadingGcal] = useState(true);
  const [isConnectingGcal, setIsConnectingGcal] = useState(false);
  const [isUnlinkingGcal, setIsUnlinkingGcal] = useState(false);
  const [isSyncingGcal, setIsSyncingGcal] = useState(false);
  const [isUpdatingFrequency, setIsUpdatingFrequency] = useState(false);

  // Load status
  useEffect(() => {
    const token = localStorage.getItem('trello_token');
    setTrelloToken(token);
    fetchGcalStatus();
  }, []);

  // Handle URL callback feedback
  useEffect(() => {
    const statusParam = searchParams.get('googleCalendar');
    if (statusParam === 'connected') {
      toast.success('¡Google Calendar vinculado exitosamente!', {
        description: 'Se ha creado el calendario Lumins en tu cuenta de Google.',
      });
      searchParams.delete('googleCalendar');
      setSearchParams(searchParams, { replace: true });
      fetchGcalStatus();
    } else if (statusParam === 'denied') {
      toast.info('Se canceló la vinculación con Google Calendar');
      searchParams.delete('googleCalendar');
      setSearchParams(searchParams, { replace: true });
    } else if (statusParam === 'error') {
      toast.error('Error al vincular con Google Calendar', {
        description: 'Verifica los permisos autorizados en tu cuenta de Google.',
      });
      searchParams.delete('googleCalendar');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchGcalStatus = async () => {
    try {
      setIsLoadingGcal(true);
      const res: any = await apiClient.get('/api/integrations/google-calendar/status');
      const payload = res?.status !== undefined ? res : res?.data;
      if (payload?.status) {
        setGcalStatus(payload.status);
      }
    } catch {
      // Fallback silently if not linked
      setGcalStatus({ connected: false });
    } finally {
      setIsLoadingGcal(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setIsConnectingGcal(true);
      const res: any = await apiClient.get(
        '/api/integrations/google-calendar/auth-url',
        { params: { returnUrl: '/settings/integrations' } }
      );
      const url = res?.url || res?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('No se pudo generar la URL de autorización');
        setIsConnectingGcal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al iniciar conexión con Google');
      setIsConnectingGcal(false);
    }
  };

  const handleUnlinkGoogleCalendar = async () => {
    try {
      setIsUnlinkingGcal(true);
      const res: any = await apiClient.post('/api/integrations/google-calendar/unlink');
      const payload = res?.success !== undefined ? res : res?.data;
      if (payload?.success) {
        setGcalStatus({ connected: false });
        toast.success('Google Calendar desvinculado exitosamente');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al desvincular Google Calendar');
    } finally {
      setIsUnlinkingGcal(false);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    try {
      setIsSyncingGcal(true);
      const storedWorkspaceId =
        localStorage.getItem('lastActiveWorkspaceId') ||
        localStorage.getItem('last_active_workspace_id');

      const syncUrl = storedWorkspaceId
        ? `/api/integrations/google-calendar/sync/${storedWorkspaceId}`
        : `/api/integrations/google-calendar/sync`;

      const res: any = await apiClient.post(syncUrl);
      const payload = res?.data || res;
      if (payload?.success) {
        const syncData = payload.data || payload;
        const total = syncData.syncedCount ?? 0;
        const updated = (syncData.insertedCount ?? 0) + (syncData.updatedCount ?? 0);
        const description = updated > 0
          ? `${updated} eventos actualizados en tu calendario "${syncData.calendarName || 'Lumins'}" (${total} verificadas).`
          : `Al día (${total} tarjetas verificadas, sin cambios pendientes).`;
        toast.success(`Sincronización completada`, {
          description,
        });
        fetchGcalStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al sincronizar tarjetas con Google Calendar');
    } finally {
      setIsSyncingGcal(false);
    }
  };

  const handleFrequencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFreq = e.target.value as 'manual' | '30m' | '2h' | '6h' | 'daily';
    setIsUpdatingFrequency(true);
    try {
      await apiClient.patch('/api/integrations/google-calendar/frequency', {
        syncFrequency: newFreq,
      });
      setGcalStatus(prev => ({ ...prev, syncFrequency: newFreq }));
      const freqLabels: Record<string, string> = {
        manual: 'Manual (al sincronizar)',
        '30m': 'Cada 30 minutos',
        '2h': 'Cada 2 horas',
        '6h': 'Cada 6 horas',
        daily: 'Diaria (cada 24 horas)',
      };
      toast.success(`Frecuencia cambiada a: ${freqLabels[newFreq]}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar periodicidad');
    } finally {
      setIsUpdatingFrequency(false);
    }
  };

  const handleUnlinkTrello = () => {
    setIsUnlinkingTrello(true);
    setTimeout(() => {
      localStorage.removeItem('trello_token');
      setTrelloToken(null);
      setIsUnlinkingTrello(false);
      toast.success('Cuenta de Trello desvinculada exitosamente');
    }, 800);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="hidden lg:block mb-4 sm:mb-6">
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
          Integraciones
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Conecta Lumins con tus herramientas favoritas para potenciar tu productividad y sincronización de tareas.
        </p>
      </div>

      {/* GOOGLE CALENDAR INTEGRATION */}
      <section className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center p-2.5 shadow-xs shrink-0">
              <GoogleCalendarIcon size={30} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight whitespace-nowrap">
                  Google Calendar
                </h3>
                {isLoadingGcal ? (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider border border-zinc-200/80 dark:border-white/10 inline-flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Comprobando...
                  </span>
                ) : gcalStatus.connected ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/20 inline-flex items-center gap-1">
                    <CheckCircle2 size={11} /> Conectado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider border border-zinc-200/80 dark:border-white/10 inline-flex items-center gap-1">
                    <AlertCircle size={11} /> No vinculado
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
                Sincroniza automáticamente tus tarjetas y fechas de entrega en un calendario dedicado en Google Calendar sin alterar tus eventos personales.
              </p>
              {gcalStatus.connected && (
                <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                  {gcalStatus.accountEmail && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-100/80 dark:bg-white/5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      {gcalStatus.accountEmail}
                    </span>
                  )}
                  {gcalStatus.calendarName && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-zinc-100/80 dark:bg-white/5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 border border-zinc-200/70 dark:border-white/10">
                      Calendario: <strong className="ml-1 text-zinc-700 dark:text-zinc-200 font-bold">{gcalStatus.calendarName}</strong>
                    </span>
                  )}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zinc-100/80 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10">
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Periodicidad:
                    </span>
                    <select
                      value={gcalStatus.syncFrequency || 'manual'}
                      onChange={handleFrequencyChange}
                      disabled={isUpdatingFrequency}
                      className="bg-transparent text-[11px] font-extrabold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
                    >
                      <option value="manual">Manual (al sincronizar)</option>
                      <option value="30m">Cada 30 minutos</option>
                      <option value="2h">Cada 2 horas</option>
                      <option value="6h">Cada 6 horas</option>
                      <option value="daily">Diaria (cada 24h)</option>
                    </select>
                    {isUpdatingFrequency && <Loader2 size={11} className="animate-spin text-blue-500" />}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            {gcalStatus.connected ? (
              <>
                <button
                  type="button"
                  onClick={handleSyncGoogleCalendar}
                  disabled={isSyncingGcal || isUnlinkingGcal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isSyncingGcal ? 'animate-spin' : ''} />
                  <span>{isSyncingGcal ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnlinkGoogleCalendar}
                  disabled={isUnlinkingGcal || isSyncingGcal}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 bg-zinc-100/80 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/10 border border-zinc-200/80 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUnlinkingGcal ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Link2Off size={13} />
                      <span>Desvincular</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogleCalendar}
                disabled={isConnectingGcal || isLoadingGcal}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isConnectingGcal ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <span>Vincular cuenta</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {gcalStatus.connected && (
          <div className="bg-zinc-50/70 dark:bg-black/20 px-5 sm:px-6 py-2.5 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                {gcalStatus.lastSyncAt
                  ? `Última sincronización: ${new Date(gcalStatus.lastSyncAt).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}`
                  : 'Sincronización automática activada'}
              </span>
            </div>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Abrir Google Calendar <ExternalLink size={12} />
            </a>
          </div>
        )}
      </section>

      {/* TRELLO INTEGRATION */}
      <section className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#0079BF] flex items-center justify-center text-white shadow-xs shrink-0">
              <TrelloIcon size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight whitespace-nowrap">
                  Trello
                </h3>
                {trelloToken ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/20 inline-flex items-center gap-1">
                    <CheckCircle2 size={11} /> Conectado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider border border-zinc-200/80 dark:border-white/10 inline-flex items-center gap-1">
                    <AlertCircle size={11} /> No vinculado
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
                Importa tus tableros, listas y tarjetas directamente a Lumins. Mantén la sincronización y la seguridad en un solo lugar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            {trelloToken ? (
              <button
                type="button"
                onClick={handleUnlinkTrello}
                disabled={isUnlinkingTrello}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 bg-zinc-100/80 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/10 border border-zinc-200/80 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUnlinkingTrello ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Link2Off size={13} />
                    <span>Desvincular</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  window.open(
                    'https://trello.com/1/authorize?expiration=never&name=Lumins&scope=read&response_type=token&key=6560bb4c3d536ed652faebccc6fa2662&return_url=' +
                      encodeURIComponent(window.location.origin + '/auth/callback'),
                    '_blank'
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-[#0079BF] hover:bg-[#026aa7] shadow-sm shadow-[#0079BF]/20 active:scale-95 transition-all"
              >
                <span>Vincular cuenta</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {trelloToken && (
          <div className="bg-zinc-50/70 dark:bg-black/20 px-5 sm:px-6 py-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Tu token está cifrado localmente
              </span>
            </div>
            <a
              href="https://trello.com/app-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#0079BF] dark:text-[#388dc2] hover:underline inline-flex items-center gap-1"
            >
              Gestionar en Trello <ExternalLink size={12} />
            </a>
          </div>
        )}
      </section>

      {/* Placeholder for other integrations */}
      <section className="opacity-60 pointer-events-none">
        <div className="bg-zinc-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 mb-2">
            <AlertCircle size={20} />
          </div>
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-0.5">Próximamente</h4>
          <p className="text-[11px] text-zinc-400 font-semibold">Slack, Jira y GitHub en camino.</p>
        </div>
      </section>
    </div>
  );
};

export default IntegrationsSettings;
