import React, { useState, useEffect } from 'react';
import { Key, Monitor, Save, Loader2, CheckCircle2, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
import apiClient from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

const SecuritySettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState('');

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await apiClient.get<{ data: { sessions: Session[] } }>('/api/auth/sessions');
      setSessions(res.data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    setSessionError('');
    try {
      await apiClient.delete(`/api/auth/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setSessionError('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    } finally {
      setRevokingId(null);
    }
  };

  const isFormValid = formData.currentPassword && formData.newPassword && formData.confirmPassword && (formData.newPassword === formData.confirmPassword);

  const inputClasses = "w-full p-3 rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all";
  const labelClasses = "text-sm font-bold text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">Seguridad</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Protege tu cuenta y gestiona tus accesos.</p>
      </div>

      {/* Change Password Card */}
      <section className="bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0">
            <Key size={20} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">Cambiar Contraseña</h3>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <label className={labelClasses}>Contraseña Actual</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={inputClasses}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Nueva Contraseña</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={inputClasses}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 rounded border ${formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? 'border-red-500' : 'border-zinc-200 dark:border-white/10'} bg-white dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all`}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 size={16} />
              ¡Contraseña actualizada con éxito!
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full sm:w-auto bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Actualizar contraseña
            </button>
          </div>
        </form>
      </section>

      {/* Active Sessions Card */}
      <section className="bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
            <Monitor size={20} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">Sesiones Activas</h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Dispositivos con acceso a tu cuenta.</p>
          </div>
        </div>

        {sessionError && (
          <div className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3 rounded border border-rose-100 dark:border-rose-500/20 mb-4">
            <AlertTriangle size={16} />
            {sessionError}
          </div>
        )}

        <div className="space-y-3">
          {sessionsLoading ? (
            <>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded" />
              ))}
            </>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No se encontraron sesiones activas.</p>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-white dark:bg-[#1C1F26] flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-white/10 flex-shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[13px] sm:text-sm leading-tight sm:leading-normal">
                      Sesión iniciada el{' '}
                      {format(new Date(session.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Expira el {format(new Date(session.expiresAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-100 dark:border-white/5">
                  {session.isCurrent ? (
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded uppercase tracking-wider">
                      En Línea
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingId === session.id}
                      className="flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors disabled:opacity-50 active:scale-95"
                    >
                      {revokingId === session.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Cerrar sesión
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default SecuritySettings;
