import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Smartphone, Info, CheckCircle2 } from 'lucide-react';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { Skeleton } from '../../components/ui/Skeleton';

interface NotificationPrefs {
  email_daily: boolean;
  email_assign: boolean;
  app_mentions: boolean;
  app_due_dates: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  email_daily: true,
  email_assign: true,
  app_mentions: true,
  app_due_dates: true,
};

const NotificationToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-zinc-100 last:border-0">
    <div className="pr-4">
      <p className="font-bold text-zinc-900">{label}</p>
      {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={onChange}
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-[#6C5DD3]' : 'bg-zinc-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

const ToggleSkeleton = () => (
  <div className="flex items-center justify-between py-4 border-b border-zinc-100 last:border-0">
    <div className="flex-1 pr-4 space-y-2">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-72" />
    </div>
    <Skeleton className="h-6 w-11 rounded-full flex-shrink-0" />
  </div>
);

const NotificationSettings: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Load preferences from user object
  useEffect(() => {
    if (user?.notificationPrefs) {
      try {
        const parsed = typeof user.notificationPrefs === 'string'
          ? JSON.parse(user.notificationPrefs)
          : user.notificationPrefs;
        setPrefs({ ...DEFAULT_PREFS, ...parsed });
      } catch {
        setPrefs(DEFAULT_PREFS);
      }
    }
  }, [user]);

  const savePrefs = useCallback(async (newPrefs: NotificationPrefs, key: string) => {
    setSaving(key);
    setError('');
    try {
      await apiClient.patch('/api/auth/me', { notificationPrefs: newPrefs });
    } catch (err) {
      // Revert on failure
      setPrefs(prev => ({ ...prev, [key]: !prev[key as keyof NotificationPrefs] }));
      setError('No se pudo guardar el cambio. Inténtalo de nuevo.');
    } finally {
      setSaving(null);
    }
  }, []);

  const toggle = (key: keyof NotificationPrefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs); // Optimistic update
    savePrefs(newPrefs, key);
  };

  const isLoading = authLoading;

  return (
    <div className="space-y-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-zinc-900">Notificaciones</h2>
        <p className="text-zinc-500 mt-1">Elige qué avisos quieres recibir y dónde.</p>
      </div>

      <div className="bg-[#E9EFFF] border border-[#D0DFFF] rounded-xl p-4 flex gap-3 text-[#3E5C9A]">
        <Info size={20} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium">
          Las notificaciones push están actualmente sincronizadas con las preferencias de tu navegador.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Email Notifications */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Mail size={20} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Correo Electrónico</h3>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <><ToggleSkeleton /><ToggleSkeleton /></>
          ) : (
            <>
              <NotificationToggle
                label="Resumen diario de actividad"
                description="Recibe un email cada mañana con lo más importante de tus tableros."
                checked={prefs.email_daily}
                onChange={() => toggle('email_daily')}
              />
              <NotificationToggle
                label="Cuando me asignan una tarea"
                description="Avisarme instantáneamente si alguien me añade a una tarjeta."
                checked={prefs.email_assign}
                onChange={() => toggle('email_assign')}
              />
            </>
          )}
        </div>
      </section>

      {/* In-App Notifications */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#6C5DD3] flex items-center justify-center">
            <Smartphone size={20} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Notificaciones en la App</h3>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <><ToggleSkeleton /><ToggleSkeleton /></>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>

      {saving && (
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-[#6C5DD3] rounded-full animate-spin" />
          Guardando preferencias...
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
