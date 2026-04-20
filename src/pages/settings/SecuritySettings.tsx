import React, { useState, useEffect } from 'react';
import { Shield, Key, Monitor, Save, Loader2, CheckCircle2, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="space-y-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-zinc-900">Seguridad</h2>
        <p className="text-zinc-500 mt-1">Protege tu cuenta y gestiona tus accesos.</p>
      </div>

      {/* Change Password Card */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
            <Key size={20} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Cambiar Contraseña</h3>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Contraseña Actual</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Nueva Contraseña</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg border ${formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? 'border-red-500' : 'border-zinc-200'} focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all`}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
              <CheckCircle2 size={16} />
              ¡Contraseña actualizada con éxito!
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Actualizar contraseña
            </button>
          </div>
        </form>
      </section>

      {/* Active Sessions Card */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
            <Monitor size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Sesiones Activas</h3>
            <p className="text-sm text-zinc-500">Dispositivos con acceso a tu cuenta.</p>
          </div>
        </div>

        {sessionError && (
          <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
            <AlertTriangle size={16} />
            {sessionError}
          </div>
        )}

        <div className="space-y-3">
          {sessionsLoading ? (
            <>
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No se encontraron sesiones activas.</p>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-slate-50/50 gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-400 border border-zinc-100 flex-shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">
                      Sesión iniciada el{' '}
                      {format(new Date(session.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Expira el {format(new Date(session.expiresAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {session.isCurrent ? (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      En Línea
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingId === session.id}
                      className="flex items-center gap-1.5 text-rose-500 hover:bg-rose-50 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-50"
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
