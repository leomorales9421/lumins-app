import React, { useState, useEffect } from 'react';
import { Key, Monitor, Save, Loader2, CheckCircle2, Smartphone, AlertTriangle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { LuminsTrashIcon } from '../../components/icons/LuminsIcons';
import LuminsLogoLoader from '../../components/ui/LuminsLogoLoader';
import apiClient from '../../lib/api-client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ConfirmActionModal from '../../components/ConfirmActionModal';

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  userAgent?: string;
  ipAddress?: string;
}

const parseUA = (ua?: string) => {
  if (!ua) return 'Dispositivo desconocido';
  if (ua.includes('Mobi')) return 'Dispositivo móvil';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Macintosh')) return 'Mac OS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone')) return 'iPhone';
  return 'Navegador Web';
};

const getBrowser = (ua?: string) => {
  if (!ua) return '';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Navegador';
};

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
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
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

  const handleRevokeOtherSessions = () => {
    setIsRevokeConfirmOpen(true);
  };

  const confirmRevokeOtherSessions = async () => {
    setRevokingOthers(true);
    setSessionError('');
    try {
      await apiClient.delete('/api/auth/sessions/others');
      setSessions(prev => prev.filter(s => s.isCurrent));
      setIsRevokeConfirmOpen(false);
    } catch (err) {
      setSessionError('No se pudieron cerrar las otras sesiones.');
    } finally {
      setRevokingOthers(false);
    }
  };

  const isFormValid = formData.currentPassword && formData.newPassword && formData.confirmPassword && (formData.newPassword === formData.confirmPassword);

  const inputClasses = "w-full h-9 px-3 rounded-lg border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#13151A] text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)] outline-none transition-all";
  const labelClasses = "text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1.5";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
      {/* Change Password Card */}
      <section className="lg:col-span-5 bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 shadow-xs flex flex-col">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
          <Key size={16} className="text-[var(--lumins-accent-fg)] shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Cambiar Contraseña</h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">Actualiza tu clave de acceso</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
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
              className={`w-full h-9 px-3 rounded-lg border ${formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? 'border-[#FF665E]' : 'border-slate-200/90 dark:border-white/10'} bg-white dark:bg-[#13151A] text-xs font-medium text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)] outline-none transition-all`}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs font-semibold text-[#D94841] dark:text-[#FF857E]">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 size={15} />
              ¡Contraseña actualizada con éxito!
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              style={{
                backgroundColor: 'var(--lumins-accent)',
                color: 'var(--lumins-accent-on)',
              }}
              className="w-full sm:w-auto h-9 px-4 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs hover:opacity-95 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-xs"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Actualizar contraseña
            </button>
          </div>
        </form>
      </section>

      {/* Active Sessions Card */}
      <section className="lg:col-span-7 bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 shadow-xs flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <Monitor size={16} className="text-[var(--lumins-accent-fg)] shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Sesiones Activas</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Dispositivos con acceso a tu cuenta.</p>
            </div>
          </div>
          
          {!sessionsLoading && sessions.length > 1 && (
            <button
              onClick={handleRevokeOtherSessions}
              disabled={revokingOthers}
              className="text-xs font-bold text-[#D94841] dark:text-[#FF857E] hover:bg-[#FF665E]/10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FF665E]/25 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {revokingOthers ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
              Cerrar las demás
            </button>
          )}
        </div>

        {sessionError && (
          <div className="flex items-center gap-2 text-xs font-medium text-[#D94841] dark:text-[#FF857E] bg-[#FF665E]/10 p-3 rounded-xl border border-[#FF665E]/25 mb-4">
            <AlertTriangle size={15} />
            {sessionError}
          </div>
        )}

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {sessionsLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <LuminsLogoLoader size="xs" />
              <span className="text-xs font-semibold text-slate-400">Cargando sesiones...</span>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-zinc-400 text-center py-4">No se encontraron sesiones activas.</p>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#13151A] flex items-center justify-center text-slate-400 dark:text-zinc-500 border border-slate-200/80 dark:border-white/10 flex-shrink-0">
                    {session.userAgent?.includes('Mobi') ? <Smartphone size={18} /> : <Monitor size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm truncate">
                      {parseUA(session.userAgent)} · {getBrowser(session.userAgent)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                      {format(new Date(session.createdAt), "d 'de' MMM, HH:mm", { locale: es })}
                      {session.ipAddress && ` · IP: ${session.ipAddress}`}
                      {` · Expira ${format(new Date(session.expiresAt), "d MMM yyyy", { locale: es })}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 flex-shrink-0">
                  {session.isCurrent ? (
                    <Badge tone="teal" variant="dot" size="xs">
                      Sesión actual
                    </Badge>
                  ) : (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingId === session.id}
                      className="flex items-center gap-1.5 text-[#D94841] dark:text-[#FF857E] hover:bg-[#FF665E]/10 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {revokingId === session.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <LuminsTrashIcon size={14} />
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

      <ConfirmActionModal
        isOpen={isRevokeConfirmOpen}
        title="Cerrar otras sesiones"
        description="¿Estás seguro de que deseas cerrar todas las demás sesiones activas? Se desconectarán todos tus otros dispositivos."
        confirmLabel="Sí, cerrar sesiones"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={revokingOthers}
        onClose={() => {
          if (!revokingOthers) setIsRevokeConfirmOpen(false);
        }}
        onConfirm={confirmRevokeOtherSessions}
      />
    </div>
  );
};

export default SecuritySettings;
