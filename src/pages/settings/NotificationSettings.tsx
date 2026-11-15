import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, Check } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import LuminsLogoLoader from '../../components/ui/LuminsLogoLoader';
import { LuminsInfoIcon } from '../../components/icons/LuminsIcons';

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-100 dark:border-white/5 last:border-0">
    <div className="min-w-0 pr-2">
      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">{label}</h4>
      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
        {description}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        borderRadius: '9999px',
        backgroundColor: checked ? 'var(--lumins-accent)' : undefined,
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
        checked ? '' : 'bg-slate-200 dark:bg-zinc-700'
      }`}
    >
      <span
        style={{
          borderRadius: '9999px',
          color: checked ? 'var(--lumins-accent-fg)' : 'transparent',
        }}
        className={`flex h-5 w-5 transform items-center justify-center bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        <Check size={11} strokeWidth={3.5} />
      </span>
    </button>
  </div>
);

interface PrefsState {
  email_digest: boolean;
  email_assignments: boolean;
  app_mentions: boolean;
  app_due_dates: boolean;
}

const NotificationSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<PrefsState>({
    email_digest: true,
    email_assignments: true,
    app_mentions: true,
    app_due_dates: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await apiClient.get<{ data: { user: any } }>('/api/auth/me');
        const saved = res.data.user?.preferences?.notifications;
        if (saved) {
          setPrefs({
            email_digest: saved.email_digest ?? true,
            email_assignments: saved.email_assignments ?? true,
            app_mentions: saved.app_mentions ?? true,
            app_due_dates: saved.app_due_dates ?? true,
          });
        }
      } catch (err) {
        console.error('Error fetching notification prefs', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const toggle = async (key: keyof PrefsState) => {
    const nextPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(nextPrefs);
    setSaving(true);
    try {
      await apiClient.patch('/api/auth/me', {
        preferences: {
          notifications: nextPrefs,
        },
      });
      toast.success('Preferencia guardada');
    } catch (err) {
      console.error('Error saving prefs', err);
      toast.error('No se pudo guardar');
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-0.5 text-xs text-slate-500 dark:text-zinc-400">
        <div className="flex items-center gap-2 min-w-0">
          <LuminsInfoIcon size={15} className="shrink-0" />
          <span className="truncate">
            Las notificaciones push están sincronizadas con las preferencias de tu navegador.
          </span>
        </div>
        {saving && <LuminsLogoLoader size="xs" />}
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-10 flex flex-col items-center justify-center gap-2">
          <LuminsLogoLoader size="xs" />
          <span className="text-xs font-semibold text-slate-400">Cargando preferencias...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
          {/* Email Notifications */}
          <section className="bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-2 border-b border-slate-100 dark:border-white/5">
              <Mail size={16} className="text-[var(--lumins-accent-fg)] shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Correo Electrónico
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Resúmenes y asignaciones directas
                </p>
              </div>
            </div>

            <div>
              <NotificationToggle
                label="Resumen diario"
                description="Un email matinal con lo más importante."
                checked={prefs.email_digest}
                onChange={() => toggle('email_digest')}
              />
              <NotificationToggle
                label="Asignaciones"
                description="Avisarme si me añaden a una tarjeta."
                checked={prefs.email_assignments}
                onChange={() => toggle('email_assignments')}
              />
            </div>
          </section>

          {/* In-App Notifications */}
          <section className="bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-2 border-b border-slate-100 dark:border-white/5">
              <Smartphone size={16} className="text-[var(--lumins-accent-fg)] shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Notificaciones en App
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Avisos en tiempo real dentro de Lumins
                </p>
              </div>
            </div>

            <div>
              <NotificationToggle
                label="Menciones en comentarios (@)"
                description="Alertas cuando alguien te menciona directamente."
                checked={prefs.app_mentions}
                onChange={() => toggle('app_mentions')}
              />
              <NotificationToggle
                label="Alertas de fecha de vencimiento"
                description="Recordatorios visuales cuando una tarea está por expirar."
                checked={prefs.app_due_dates}
                onChange={() => toggle('app_due_dates')}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
