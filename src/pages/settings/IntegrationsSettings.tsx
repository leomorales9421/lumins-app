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
  Sparkles,
} from 'lucide-react';
import { GoogleCalendarIcon } from '../../components/ui/GoogleCalendarIcon';
import { GoogleMeetIcon, GoogleDriveIcon } from '../../components/ui/GoogleIcons';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { Badge } from '../../components/ui/Badge';

const TrelloIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z" />
  </svg>
);

interface GoogleCalendarStatus {
  connected: boolean;
  calendarName?: string;
  accountEmail?: string;
  syncFrequency?: 'auto' | 'manual' | '30m' | '2h' | '6h' | 'daily';
  connectedAt?: string;
  lastSyncAt?: string | null;
}

interface GoogleMeetStatus {
  connected: boolean;
  accountEmail?: string;
  connectedAt?: string;
  canQuickLinkFromCalendar?: boolean;
  calendarAccountEmail?: string;
}

interface GoogleDriveStatus {
  connected: boolean;
  accountEmail?: string;
  connectedAt?: string;
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

  // Google Meet state
  const [gmeetStatus, setGmeetStatus] = useState<GoogleMeetStatus>({ connected: false });
  const [isLoadingGmeet, setIsLoadingGmeet] = useState(true);
  const [isConnectingGmeet, setIsConnectingGmeet] = useState(false);
  const [isUnlinkingGmeet, setIsUnlinkingGmeet] = useState(false);

  // Google Drive state
  const [gdriveStatus, setGdriveStatus] = useState<GoogleDriveStatus>({ connected: false });
  const [isLoadingGdrive, setIsLoadingGdrive] = useState(true);
  const [isConnectingGdrive, setIsConnectingGdrive] = useState(false);
  const [isUnlinkingGdrive, setIsUnlinkingGdrive] = useState(false);

  // Load status
  useEffect(() => {
    const token = localStorage.getItem('trello_token');
    setTrelloToken(token);
    fetchGcalStatus();
    fetchGmeetStatus();
    fetchGdriveStatus();
  }, []);

  // Handle URL callback feedback for Calendar, Meet and Drive
  useEffect(() => {
    const gcalParam = searchParams.get('googleCalendar');
    const gmeetParam = searchParams.get('googleMeet');
    const gdriveParam = searchParams.get('googleDrive');
    let mutated = false;

    if (gcalParam) {
      if (gcalParam === 'connected') {
        toast.success('¡Google Calendar vinculado exitosamente!', {
          description: 'Se ha creado el calendario Lumins en tu cuenta de Google.',
        });
      } else if (gcalParam === 'denied') {
        toast.info('Se canceló la vinculación con Google Calendar');
      } else if (gcalParam === 'error') {
        toast.error('Error al vincular con Google Calendar', {
          description: 'Verifica los permisos autorizados en tu cuenta de Google.',
        });
      }
      searchParams.delete('googleCalendar');
      mutated = true;
      fetchGcalStatus();
      fetchGmeetStatus();
    }

    if (gmeetParam) {
      if (gmeetParam === 'connected') {
        toast.success('¡Google Meet vinculado exitosamente!', {
          description: 'Ahora puedes agendar videollamadas con asignados e invitados externos en tus tarjetas y calendario.',
        });
      } else if (gmeetParam === 'denied') {
        toast.info('Se canceló la vinculación con Google Meet');
      } else if (gmeetParam === 'error') {
        toast.error('Error al vincular con Google Meet', {
          description: 'Verifica los permisos autorizados en tu cuenta de Google.',
        });
      }
      searchParams.delete('googleMeet');
      mutated = true;
      fetchGmeetStatus();
    }

    if (gdriveParam) {
      if (gdriveParam === 'connected') {
        toast.success('¡Google Drive vinculado exitosamente!', {
          description: 'Ya puedes importar y subir archivos de tu Google Drive directamente en las tarjetas.',
        });
      } else if (gdriveParam === 'denied') {
        toast.info('Se canceló la vinculación con Google Drive');
      } else if (gdriveParam === 'error') {
        toast.error('Error al vincular con Google Drive', {
          description: 'Verifica los permisos autorizados en tu cuenta de Google.',
        });
      }
      searchParams.delete('googleDrive');
      mutated = true;
      fetchGdriveStatus();
    }

    if (mutated) {
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
      setGcalStatus({ connected: false });
    } finally {
      setIsLoadingGcal(false);
    }
  };

  const fetchGmeetStatus = async () => {
    try {
      setIsLoadingGmeet(true);
      const res: any = await apiClient.get('/api/integrations/google-meet/status');
      const payload = res?.status !== undefined ? res : res?.data;
      if (payload?.status) {
        setGmeetStatus(payload.status);
      }
    } catch {
      setGmeetStatus({ connected: false });
    } finally {
      setIsLoadingGmeet(false);
    }
  };

  const fetchGdriveStatus = async () => {
    try {
      setIsLoadingGdrive(true);
      const res: any = await apiClient.get('/api/integrations/google-drive/status');
      const payload = res?.status !== undefined ? res : res?.data;
      if (payload?.status) {
        setGdriveStatus(payload.status);
      }
    } catch {
      setGdriveStatus({ connected: false });
    } finally {
      setIsLoadingGdrive(false);
    }
  };

  // --- GOOGLE CALENDAR HANDLERS ---
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
        fetchGmeetStatus();
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
    const newFreq = e.target.value as 'auto' | 'manual' | '30m' | '2h' | '6h' | 'daily';
    setIsUpdatingFrequency(true);
    try {
      await apiClient.patch('/api/integrations/google-calendar/frequency', {
        syncFrequency: newFreq,
      });
      setGcalStatus(prev => ({ ...prev, syncFrequency: newFreq }));
      const freqLabels: Record<string, string> = {
        auto: 'Automática (en tiempo real)',
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

  // --- GOOGLE MEET HANDLERS ---
  const handleConnectGoogleMeet = async () => {
    try {
      setIsConnectingGmeet(true);
      const res: any = await apiClient.get(
        '/api/integrations/google-meet/auth-url',
        { params: { returnUrl: '/settings/integrations' } }
      );
      const url = res?.url || res?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('No se pudo generar la URL de autorización de Google Meet');
        setIsConnectingGmeet(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al conectar Google Meet');
      setIsConnectingGmeet(false);
    }
  };

  const handleQuickLinkGoogleMeet = async () => {
    try {
      setIsConnectingGmeet(true);
      const res: any = await apiClient.post('/api/integrations/google-meet/quick-link');
      const payload = res?.success !== undefined ? res : res?.data;
      if (payload?.success) {
        toast.success('¡Google Meet activado con tu cuenta de Google!', {
          description: 'Ya puedes agendar videollamadas con asignados e invitados externos.',
        });
        fetchGmeetStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al activar Google Meet');
    } finally {
      setIsConnectingGmeet(false);
    }
  };

  const handleUnlinkGoogleMeet = async () => {
    try {
      setIsUnlinkingGmeet(true);
      const res: any = await apiClient.post('/api/integrations/google-meet/unlink');
      const payload = res?.success !== undefined ? res : res?.data;
      if (payload?.success) {
        setGmeetStatus(prev => ({ ...prev, connected: false }));
        toast.success('Google Meet desvinculado exitosamente');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al desvincular Google Meet');
    } finally {
      setIsUnlinkingGmeet(false);
    }
  };

  // --- GOOGLE DRIVE HANDLERS ---
  const handleConnectGoogleDrive = async () => {
    try {
      setIsConnectingGdrive(true);
      const res: any = await apiClient.get(
        '/api/integrations/google-drive/auth-url',
        { params: { returnUrl: '/settings/integrations' } }
      );
      const url = res?.url || res?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('No se pudo generar la URL de autorización de Google Drive');
        setIsConnectingGdrive(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al conectar Google Drive');
      setIsConnectingGdrive(false);
    }
  };

  const handleUnlinkGoogleDrive = async () => {
    try {
      setIsUnlinkingGdrive(true);
      const res: any = await apiClient.post('/api/integrations/google-drive/unlink');
      const payload = res?.success !== undefined ? res : res?.data;
      if (payload?.success) {
        setGdriveStatus({ connected: false });
        toast.success('Google Drive desvinculado exitosamente');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err?.message || 'Error al desvincular Google Drive');
    } finally {
      setIsUnlinkingGdrive(false);
    }
  };

  // --- TRELLO HANDLER ---
  const handleUnlinkTrello = () => {
    setIsUnlinkingTrello(true);
    setTimeout(() => {
      localStorage.removeItem('trello_token');
      setTrelloToken(null);
      setIsUnlinkingTrello(false);
      toast.success('Cuenta de Trello desvinculada exitosamente');
    }, 800);
  };

  const connectedCount =
    (gcalStatus.connected ? 1 : 0) +
    (gmeetStatus.connected ? 1 : 0) +
    (trelloToken ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Compact Header with Status & Upcoming Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Badge tone="teal" variant="dot" size="sm">
            {connectedCount}/3 activas
          </Badge>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            Conecta tus herramientas externas para sincronizar tareas y reuniones.
          </span>
        </div>

        <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
          Próximamente: <strong className="text-slate-600 dark:text-zinc-300">Google Drive, Slack, Jira y GitHub</strong>
        </span>
      </div>

      {/* Compact 4-column Architectural Grid (scales cleanly for 10+ integrations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* 1. GOOGLE CALENDAR INTEGRATION */}
        <section className="bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-3.5 flex flex-col justify-between shadow-xs hover:border-[var(--lumins-accent-border)] transition-all">
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center p-1.5 shrink-0">
                  <GoogleCalendarIcon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    Google Calendar
                  </h3>
                  <div className="mt-0.5">
                    {isLoadingGcal ? (
                      <span className="text-[10px] font-semibold text-zinc-400 inline-flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Cargando...
                      </span>
                    ) : gcalStatus.connected ? (
                      <Badge variant="dot" tone="teal" size="xs">Conectado</Badge>
                    ) : (
                      <Badge variant="dot" tone="neutral" size="xs">No vinculado</Badge>
                    )}
                  </div>
                </div>
              </div>

              {gcalStatus.connected && (
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir Google Calendar"
                  className="p-1 rounded-md text-zinc-400 hover:text-[var(--lumins-accent-fg)] hover:bg-[var(--lumins-accent-soft)] transition-colors shrink-0"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Description */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-snug line-clamp-2">
              Sincroniza tarjetas y fechas de entrega en un calendario dedicado.
            </p>

            {/* Connected Metadata Pills */}
            {gcalStatus.connected && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {gcalStatus.accountEmail && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100/80 dark:bg-white/5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/10 max-w-full truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{gcalStatus.accountEmail}</span>
                  </span>
                )}
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100/80 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Sync:</span>
                  <select
                    value={gcalStatus.syncFrequency || 'auto'}
                    onChange={handleFrequencyChange}
                    disabled={isUpdatingFrequency}
                    className="bg-transparent text-[10px] font-bold text-[var(--lumins-accent-fg)] outline-none cursor-pointer"
                  >
                    <option value="auto">Automática</option>
                    <option value="30m">Cada 30m</option>
                    <option value="2h">Cada 2h</option>
                    <option value="6h">Cada 6h</option>
                    <option value="daily">Diaria</option>
                    <option value="manual">Manual</option>
                  </select>
                  {isUpdatingFrequency && <Loader2 size={10} className="animate-spin text-[var(--lumins-accent-fg)]" />}
                </div>
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
              {gcalStatus.connected
                ? gcalStatus.lastSyncAt
                  ? `${new Date(gcalStatus.lastSyncAt).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : gcalStatus.calendarName || 'Lumins'
                : 'Bidireccional'}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {gcalStatus.connected ? (
                <>
                  <button
                    type="button"
                    onClick={handleSyncGoogleCalendar}
                    disabled={isSyncingGcal || isUnlinkingGcal}
                    title="Sincronizar ahora"
                    className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold bg-[var(--lumins-accent)] hover:bg-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)] shadow-2xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw size={11} className={isSyncingGcal ? 'animate-spin' : ''} />
                    <span>{isSyncingGcal ? 'Sync...' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlinkGoogleCalendar}
                    disabled={isUnlinkingGcal || isSyncingGcal}
                    title="Desvincular Google Calendar"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 hover:text-[#D94841] hover:bg-[#FF665E]/10 border border-zinc-200/80 dark:border-white/10 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUnlinkingGcal ? <Loader2 size={11} className="animate-spin" /> : <Link2Off size={12} />}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogleCalendar}
                  disabled={isConnectingGcal || isLoadingGcal}
                  className="inline-flex items-center justify-center gap-1 h-7 px-3 rounded-lg text-[11px] font-bold bg-[var(--lumins-accent)] hover:bg-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)] shadow-2xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isConnectingGcal ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      <span>Conectando</span>
                    </>
                  ) : (
                    <>
                      <span>Vincular</span>
                      <ArrowRight size={11} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 2. GOOGLE MEET INTEGRATION */}
        <section className="bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-3.5 flex flex-col justify-between shadow-xs hover:border-[var(--lumins-accent-border)] transition-all">
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center p-1.5 shrink-0">
                  <GoogleMeetIcon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    Google Meet
                  </h3>
                  <div className="mt-0.5">
                    {isLoadingGmeet ? (
                      <span className="text-[10px] font-semibold text-zinc-400 inline-flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Cargando...
                      </span>
                    ) : gmeetStatus.connected ? (
                      <Badge variant="dot" tone="teal" size="xs">Conectado</Badge>
                    ) : (
                      <Badge variant="dot" tone="neutral" size="xs">No vinculado</Badge>
                    )}
                  </div>
                </div>
              </div>

              {gmeetStatus.connected && (
                <a
                  href="https://meet.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir Google Meet"
                  className="p-1 rounded-md text-zinc-400 hover:text-[var(--lumins-accent-fg)] hover:bg-[var(--lumins-accent-soft)] transition-colors shrink-0"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Description */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-snug line-clamp-2">
              Agenda videollamadas en tarjetas y calendario con invitados externos.
            </p>

            {/* Connected Metadata Pills */}
            {gmeetStatus.connected && gmeetStatus.accountEmail && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100/80 dark:bg-white/5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/10 max-w-full truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{gmeetStatus.accountEmail}</span>
                </span>
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
              {gmeetStatus.connected
                ? 'Salas activas'
                : gmeetStatus.canQuickLinkFromCalendar
                ? 'Compatible con Calendar'
                : 'Videollamadas 1 clic'}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {gmeetStatus.connected ? (
                <button
                  type="button"
                  onClick={handleUnlinkGoogleMeet}
                  disabled={isUnlinkingGmeet}
                  className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold text-zinc-500 hover:text-[#D94841] bg-zinc-100/80 hover:bg-[#FF665E]/10 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUnlinkingGmeet ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <>
                      <Link2Off size={11} />
                      <span>Desvincular</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  {gmeetStatus.canQuickLinkFromCalendar && (
                    <button
                      type="button"
                      onClick={handleQuickLinkGoogleMeet}
                      disabled={isConnectingGmeet || isLoadingGmeet}
                      className="inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
                      title="Activar usando tu cuenta de Google Calendar"
                    >
                      <Sparkles size={11} />
                      <span>Calendar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleConnectGoogleMeet}
                    disabled={isConnectingGmeet || isLoadingGmeet}
                    className="inline-flex items-center justify-center gap-1 h-7 px-3 rounded-lg text-[11px] font-bold bg-[var(--lumins-accent)] hover:bg-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)] shadow-2xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isConnectingGmeet ? (
                      <>
                        <Loader2 size={11} className="animate-spin" />
                        <span>Conectando</span>
                      </>
                    ) : (
                      <>
                        <span>Vincular</span>
                        <ArrowRight size={11} />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 3. TRELLO INTEGRATION */}
        <section className="bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-3.5 flex flex-col justify-between shadow-xs hover:border-[var(--lumins-accent-border)] transition-all">
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#0079BF] flex items-center justify-center text-white shrink-0">
                  <TrelloIcon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    Trello
                  </h3>
                  <div className="mt-0.5">
                    {trelloToken ? (
                      <Badge variant="dot" tone="teal" size="xs">Conectado</Badge>
                    ) : (
                      <Badge variant="dot" tone="neutral" size="xs">No vinculado</Badge>
                    )}
                  </div>
                </div>
              </div>

              {trelloToken && (
                <a
                  href="https://trello.com/app-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Gestionar en Trello"
                  className="p-1 rounded-md text-zinc-400 hover:text-[#0079BF] hover:bg-[#0079BF]/10 transition-colors shrink-0"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Description */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-snug line-clamp-2">
              Importa tableros, listas y tarjetas manteniendo asignaciones y estructura.
            </p>
          </div>

          {/* Card Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
              {trelloToken ? 'Token cifrado' : 'Importación rápida'}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              {trelloToken ? (
                <button
                  type="button"
                  onClick={handleUnlinkTrello}
                  disabled={isUnlinkingTrello}
                  className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-bold text-zinc-500 hover:text-[#D94841] bg-zinc-100/80 hover:bg-[#FF665E]/10 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUnlinkingTrello ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <>
                      <Link2Off size={11} />
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
                  className="inline-flex items-center justify-center gap-1 h-7 px-3 rounded-lg text-[11px] font-bold bg-[var(--lumins-accent)] hover:bg-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)] shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <span>Vincular</span>
                  <ArrowRight size={11} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 4. GOOGLE DRIVE INTEGRATION (Disabled - Pronto) */}
        <section className="bg-white/80 dark:bg-[#1C1F26]/70 rounded-xl border border-slate-200/80 dark:border-white/10 p-3.5 flex flex-col justify-between opacity-80">
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center p-1.5 shrink-0 grayscale-[35%]">
                  <GoogleDriveIcon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    Google Drive
                  </h3>
                  <div className="mt-0.5">
                    <Badge variant="dot" tone="amber" size="xs">Pronto</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-snug line-clamp-2">
              Adjunta documentos, hojas de cálculo y archivos pesados desde Google Drive.
            </p>
          </div>

          {/* Card Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate">
              En desarrollo
            </span>

            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center h-7 px-3 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-500 border border-slate-200/70 dark:border-white/10 cursor-not-allowed"
            >
              Pronto
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default IntegrationsSettings;
