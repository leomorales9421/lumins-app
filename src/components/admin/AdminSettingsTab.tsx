import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  CheckCircle,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Database,
  Mail,
  Bell,
  Plug,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import type { SystemSettingsState } from './types';

interface AdminSettingsTabProps {
  driveConnected: boolean;
  driveFolderId: string | null;
  onDriveRefresh: () => void;
}

const DEFAULT_SETTINGS: SystemSettingsState = {
  integrations: {
    googleDrive: false,
    googleCalendar: true,
    googleMeet: true,
    trelloImport: true,
  },
  notifications: {
    emailEnabled: true,
    inAppEnabled: true,
  },
  platform: {
    allowPublicRegistrations: true,
    maintenanceBanner: '',
  },
};

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}> = ({ title, description, checked, disabled, onChange }) => (
  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5">
    <div className="min-w-0">
      <div className="text-sm font-bold text-slate-800 dark:text-zinc-100">{title}</div>
      <div className="text-xs text-cu-muted dark:text-zinc-400 mt-0.5">{description}</div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
        checked ? 'bg-[#12A9A8]' : 'bg-slate-300 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
          checked ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  driveConnected,
  driveFolderId,
  onDriveRefresh,
}) => {
  const [settings, setSettings] = useState<SystemSettingsState>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveRefreshToken, setDriveRefreshToken] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const res = await apiClient.get<{ data: SystemSettingsState }>('/api/system/settings');
        if (res?.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load platform settings', err);
      } finally {
        setLoadingSettings(false);
      }
    };
    void loadSettings();
  }, []);

  const persistSettings = async (patch: Partial<SystemSettingsState>, successMessage: string) => {
    setSavingSettings(true);
    try {
      const res = await apiClient.patch<{ data: SystemSettingsState }>('/api/system/settings', patch);
      if (res?.data) {
        setSettings(res.data);
      }
      window.dispatchEvent(new CustomEvent('platform-settings-changed'));
      toast.success(successMessage);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar configuración');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleIntegration = (
    key: keyof SystemSettingsState['integrations'],
    value: boolean
  ) => {
    const nextIntegrations = { ...settings.integrations, [key]: value };
    setSettings((prev) => ({ ...prev, integrations: nextIntegrations }));
    void persistSettings(
      { integrations: nextIntegrations },
      `Integración ${value ? 'habilitada' : 'deshabilitada'} correctamente`
    );
  };

  const handleToggleNotification = (
    key: keyof SystemSettingsState['notifications'],
    value: boolean
  ) => {
    const nextNotifications = { ...settings.notifications, [key]: value };
    setSettings((prev) => ({ ...prev, notifications: nextNotifications }));
    void persistSettings(
      { notifications: nextNotifications },
      value ? 'Notificaciones activadas' : 'Notificaciones desactivadas globalmente'
    );
  };

  const handleConnectDrive = async () => {
    try {
      setIsConnectingDrive(true);
      setDriveError(null);
      const res = await apiClient.get<{ data: { url: string } }>('/api/system/drive/auth-url');
      if (res.data?.url) {
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setDriveError(err.response?.data?.message || 'Error al generar URL de conexión con Google');
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleCopyToken = () => {
    if (!driveRefreshToken) return;
    navigator.clipboard.writeText(driveRefreshToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Integraciones de Plataforma */}
      <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-7 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#12A9A8]/12 text-[#12A9A8]">
              <Plug size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Integraciones de Plataforma</h2>
              <p className="text-xs text-cu-muted dark:text-zinc-500">
                Habilita o deshabilita módulos externos en todo Lumins
              </p>
            </div>
          </div>
          {loadingSettings && <RefreshCw size={15} className="animate-spin text-[#12A9A8]" />}
        </div>

        <div className="space-y-3">
          <ToggleRow
            title="Google Drive (Almacenamiento)"
            description="Adjuntos y respaldos corporativos en Google Drive"
            checked={settings.integrations.googleDrive}
            disabled={savingSettings || loadingSettings}
            onChange={(val) => handleToggleIntegration('googleDrive', val)}
          />
          <ToggleRow
            title="Google Calendar Sync"
            description="Sincronización bidireccional e iCal de fechas de tarjetas"
            checked={settings.integrations.googleCalendar}
            disabled={savingSettings || loadingSettings}
            onChange={(val) => handleToggleIntegration('googleCalendar', val)}
          />
          <ToggleRow
            title="Google Meet"
            description="Creación y programación de videollamadas desde tarjetas"
            checked={settings.integrations.googleMeet}
            disabled={savingSettings || loadingSettings}
            onChange={(val) => handleToggleIntegration('googleMeet', val)}
          />
          <ToggleRow
            title="Importador de Trello"
            description="Permite importar tableros JSON desde Trello"
            checked={settings.integrations.trelloImport}
            disabled={savingSettings || loadingSettings}
            onChange={(val) => handleToggleIntegration('trelloImport', val)}
          />
        </div>
      </div>

      {/* Notificaciones y Seguridad Global */}
      <div className="space-y-8">
        <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-7 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#FF665E]/12 text-[#FF665E]">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Notificaciones Globales</h2>
              <p className="text-xs text-cu-muted dark:text-zinc-500">
                Control maestro sobre envíos SMTP y avisos en tiempo real
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow
              title="Notificaciones por Correo (SMTP)"
              description="Desactívalo para silenciar todos los correos salientes de la plataforma"
              checked={settings.notifications.emailEnabled}
              disabled={savingSettings || loadingSettings}
              onChange={(val) => handleToggleNotification('emailEnabled', val)}
            />
            <ToggleRow
              title="Notificaciones en Campanita (WebSocket)"
              description="Avisos en tiempo real dentro de la aplicación"
              checked={settings.notifications.inAppEnabled}
              disabled={savingSettings || loadingSettings}
              onChange={(val) => handleToggleNotification('inAppEnabled', val)}
            />
          </div>
        </div>

        <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-7 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-[#FFCC40]/18 text-[#d99b00] dark:text-[#FFCC40]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Acceso y Mantenimiento</h2>
              <p className="text-xs text-cu-muted dark:text-zinc-500">
                Políticas globales de registro y avisos de plataforma
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleRow
              title="Permitir Registros Públicos"
              description="Habilita o cierra el registro de nuevas cuentas"
              checked={settings.platform.allowPublicRegistrations}
              disabled={savingSettings || loadingSettings}
              onChange={(val) => {
                const nextPlatform = { ...settings.platform, allowPublicRegistrations: val };
                setSettings((prev) => ({ ...prev, platform: nextPlatform }));
                void persistSettings(
                  { platform: nextPlatform },
                  val ? 'Registros públicos habilitados' : 'Registros públicos cerrados'
                );
              }}
            />

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-cu-muted dark:text-zinc-400 mb-1.5">
                Mensaje de mantenimiento (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.platform.maintenanceBanner}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      platform: { ...prev.platform, maintenanceBanner: e.target.value },
                    }))
                  }
                  placeholder="Ej: Mantenimiento programado hoy a las 23:00..."
                  className="flex-1 bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#12A9A8]"
                />
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() =>
                    void persistSettings(
                      { platform: settings.platform },
                      'Mensaje de mantenimiento actualizado'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#12A9A8] hover:bg-[#0e8f8e] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Storage Setup */}
      <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-7 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#12A9A8]/12 text-[#12A9A8]">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Almacenamiento Google Drive</h2>
              <p className="text-xs text-cu-muted dark:text-zinc-500">
                Conexión corporativa con Google Cloud
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              driveConnected
                ? 'bg-[#12A9A8]/15 text-[#12A9A8]'
                : 'bg-[#FFCC40]/20 text-[#9c6f00] dark:text-[#FFCC40]'
            }`}
          >
            {driveConnected ? 'CONECTADO' : 'PENDIENTE'}
          </span>
        </div>

        {driveError && (
          <div className="mb-5 p-4 bg-[#FF665E]/10 border border-[#FF665E]/30 rounded-2xl flex items-center gap-3 text-[#FF665E] text-sm">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{driveError}</span>
          </div>
        )}

        {driveRefreshToken && (
          <div className="bg-[#12A9A8]/10 border border-[#12A9A8]/30 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2.5 text-[#12A9A8] mb-3">
              <CheckCircle size={20} />
              <span className="font-bold text-sm">Refresh Token generado</span>
            </div>
            <div className="relative">
              <pre className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-xs font-mono overflow-x-auto break-all pr-10">
                GOOGLE_DRIVE_REFRESH_TOKEN=&quot;{driveRefreshToken}&quot;
              </pre>
              <button
                type="button"
                onClick={handleCopyToken}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg cursor-pointer"
              >
                {copied ? <Check size={14} className="text-[#12A9A8]" /> : <Copy size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDriveRefreshToken(null)}
              className="mt-2.5 text-xs text-[#12A9A8] font-bold cursor-pointer"
            >
              Ocultar token
            </button>
          </div>
        )}

        <div className="space-y-4">
          {driveConnected ? (
            <div className="flex items-center gap-3 p-4 bg-[#12A9A8]/10 border border-[#12A9A8]/25 rounded-xl">
              <CheckCircle size={18} className="text-[#12A9A8] shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#12A9A8]">Sistema conectado a Google Drive</p>
                {driveFolderId && (
                  <p className="text-xs text-cu-muted dark:text-zinc-400">
                    Carpeta ID: <code className="font-mono">{driveFolderId}</code>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-cu-muted dark:text-zinc-400">
              Vincula la cuenta corporativa para almacenar adjuntos de tableros de forma centralizada.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConnectDrive}
              disabled={isConnectingDrive}
              className="px-5 py-2.5 bg-[#12A9A8] hover:bg-[#0e8f8e] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-[#12A9A8]/20 cursor-pointer"
            >
              {isConnectingDrive ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <HardDrive size={15} />
              )}
              <span>{driveConnected ? 'Re-autorizar Cuenta' : 'Conectar con Google Drive'}</span>
            </button>
            <button
              type="button"
              onClick={onDriveRefresh}
              className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Verificar estado
            </button>
          </div>
        </div>
      </div>

      {/* Info Arquitectura */}
      <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-7 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-[#12A9A8]/12 text-[#12A9A8]">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Estado de Infraestructura</h2>
            <p className="text-xs text-cu-muted dark:text-zinc-500">
              Arquitectura y servicios activos
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 flex justify-between items-center">
            <span className="text-cu-muted dark:text-zinc-400">Versión del Sistema</span>
            <span className="font-bold">v2.5.0-lumins</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 flex justify-between items-center">
            <span className="text-cu-muted dark:text-zinc-400">Base de Datos</span>
            <span className="font-bold text-[#12A9A8]">MySQL / Prisma Activo</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 flex justify-between items-center">
            <span className="text-cu-muted dark:text-zinc-400">Tiempo Real</span>
            <span className="font-bold text-[#12A9A8]">Socket.IO Conectado</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 flex justify-between items-center">
            <span className="text-cu-muted dark:text-zinc-400">Notificaciones Bell</span>
            <span className="font-bold text-[#12A9A8]">
              {settings.notifications.inAppEnabled ? 'Activas' : 'Pausadas'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
