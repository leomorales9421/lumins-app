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
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';

const TrelloIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z" />
  </svg>
);

const GoogleCalendarIcon = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="3" fill="#ffffff" />
    <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" fill="#4285F4" opacity="0.1" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#EA4335" />
    <rect x="11" y="13" width="3" height="3" rx="0.5" fill="#FBBC04" />
    <rect x="15" y="13" width="3" height="3" rx="0.5" fill="#34A853" />
    <rect x="7" y="17" width="3" height="3" rx="0.5" fill="#4285F4" />
    <rect x="11" y="17" width="3" height="3" rx="0.5" fill="#1A73E8" />
  </svg>
);

interface GoogleCalendarStatus {
  connected: boolean;
  calendarName?: string;
  accountEmail?: string;
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
        toast.success(`Sincronización completada`, {
          description: `${syncData.syncedCount ?? 0} tarjetas actualizadas en tu calendario "${syncData.calendarName || 'Lumins'}".`,
        });
        fetchGcalStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al sincronizar tarjetas con Google Calendar');
    } finally {
      setIsSyncingGcal(false);
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
    <div className="space-y-6 sm:space-y-8">
      <div className="hidden lg:block mb-6">
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
          Integraciones
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Conecta Lumins con tus herramientas favoritas para potenciar tu productividad y sincronización de tareas.
        </p>
      </div>

      {/* GOOGLE CALENDAR INTEGRATION */}
      <section className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center text-blue-600 shadow-lg shadow-blue-500/10 flex-shrink-0">
            <GoogleCalendarIcon size={34} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Google Calendar
              </h3>
              {isLoadingGcal ? (
                <span className="px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest border border-zinc-500/20 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" /> Comprobando...
                </span>
              ) : gcalStatus.connected ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-zinc-500/20 flex items-center gap-1">
                  <AlertCircle size={10} /> No vinculado
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xl">
              Sincroniza automáticamente tus fechas de entrega, hitos y tarjetas planificadas de Lumins en un calendario secundario dedicado en tu Google Calendar sin alterar tus eventos personales.
            </p>
            {gcalStatus.connected && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                {gcalStatus.accountEmail && (
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                    Cuenta: {gcalStatus.accountEmail}
                  </span>
                )}
                {gcalStatus.calendarName && (
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    Calendario: {gcalStatus.calendarName}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            {gcalStatus.connected ? (
              <>
                <Button
                  onClick={handleSyncGoogleCalendar}
                  disabled={isSyncingGcal || isUnlinkingGcal}
                  className="!rounded-xl !py-2.5 !px-5 text-xs font-black uppercase tracking-widest shadow-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={isSyncingGcal ? 'animate-spin' : ''} />
                  {isSyncingGcal ? 'Sincronizando...' : 'Sincronizar ahora'}
                </Button>
                <Button
                  onClick={handleUnlinkGoogleCalendar}
                  disabled={isUnlinkingGcal || isSyncingGcal}
                  className="!bg-rose-500/10 !text-rose-500 hover:!bg-rose-500 hover:!text-white border border-rose-500/20 !rounded-xl !py-2.5 !px-5 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {isUnlinkingGcal ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Link2Off size={16} />
                      Desvincular
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectGoogleCalendar}
                disabled={isConnectingGcal || isLoadingGcal}
                className="!rounded-xl !py-3 !px-8 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                {isConnectingGcal ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Conectando con Google...
                  </>
                ) : (
                  <>
                    Vincular cuenta
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {gcalStatus.connected && (
          <div className="bg-zinc-50 dark:bg-black/20 px-8 py-3.5 border-t border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {gcalStatus.lastSyncAt
                  ? `Última sincronización: ${new Date(gcalStatus.lastSyncAt).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}`
                  : 'Sincronización automática activada para tarjetas con fecha'}
              </span>
            </div>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:underline flex items-center gap-1"
            >
              Abrir Google Calendar <ExternalLink size={12} />
            </a>
          </div>
        )}
      </section>

      {/* TRELLO INTEGRATION */}
      <section className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0079BF] flex items-center justify-center text-white shadow-lg shadow-[#0079BF]/20 flex-shrink-0">
            <TrelloIcon size={32} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Trello
              </h3>
              {trelloToken ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-zinc-500/20 flex items-center gap-1">
                  <AlertCircle size={10} /> No vinculado
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-lg">
              Importa tus tableros, listas y tarjetas directamente a Lumins. Mantén la sincronización y la seguridad en un solo lugar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {trelloToken ? (
              <Button
                onClick={handleUnlinkTrello}
                disabled={isUnlinkingTrello}
                className="!bg-rose-500/10 !text-rose-500 hover:!bg-rose-500 hover:!text-white border border-rose-500/20 !rounded-xl !py-3 !px-6 text-xs font-black uppercase tracking-widest transition-all"
              >
                {isUnlinkingTrello ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Link2Off size={18} className="mr-2" />
                    Desvincular
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  window.open(
                    'https://trello.com/1/authorize?expiration=never&name=Lumins&scope=read&response_type=token&key=6560bb4c3d536ed652faebccc6fa2662&return_url=' +
                      encodeURIComponent(window.location.origin + '/auth/callback'),
                    '_blank'
                  )
                }
                className="!rounded-xl !py-3 !px-8 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary text-white"
              >
                Vincular cuenta
                <ArrowRight size={18} className="ml-2" />
              </Button>
            )}
          </div>
        </div>

        {trelloToken && (
          <div className="bg-zinc-50 dark:bg-black/20 px-8 py-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Tu token está cifrado localmente
              </span>
            </div>
            <a
              href="https://trello.com/app-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Gestionar en Trello <ExternalLink size={12} />
            </a>
          </div>
        )}
      </section>

      {/* Placeholder for other integrations */}
      <section className="opacity-50 pointer-events-none">
        <div className="bg-zinc-100 dark:bg-white/5 rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-400 mb-4">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-1">Próximamente</h4>
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-tight">Slack, Jira y GitHub en camino.</p>
        </div>
      </section>
    </div>
  );
};

export default IntegrationsSettings;
