import React, { useMemo, useState, useEffect } from 'react';
import {
  UsersRound,
  Search,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  HardDrive,
  CheckSquare,
  Layers3,
  Building2,
  Activity,
  Edit3,
  Save,
  X,
  Mail,
  Laptop,
  LogOut,
  Clock3,
  Trash2,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import {
  formatBytes,
  parseUserAgentLabel,
  type AdminUserSummary,
  type AdminUserDetails,
} from './types';

interface AdminUsersTabProps {
  users: AdminUserSummary[];
  currentUserId?: string;
  selectedUser: AdminUserSummary | null;
  userDetails: AdminUserDetails | null;
  loadingDetails: boolean;
  onSelectUser: (u: AdminUserSummary) => void;
  onUsersUpdated: () => void;
  onRefreshSelectedUser: (userId: string) => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  currentUserId,
  selectedUser,
  userDetails,
  loadingDetails,
  onSelectUser,
  onUsersUpdated,
  onRefreshSelectedUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Edit user modal/inline form state
  const [isEditing, setIsEditing] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editLanguage, setEditLanguage] = useState('es');
  const [editGlobalRole, setEditGlobalRole] = useState<'USER' | 'SYSTEM_ADMIN'>('USER');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailAssign, setEmailAssign] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  // Workspace filter for user's detailed activity
  const [activityWorkspaceFilter, setActivityWorkspaceFilter] = useState<string>('all');
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (userDetails?.user) {
      setIsEditing(false);
      setActivityWorkspaceFilter('all');
      setEditName(userDetails.user.name || '');
      setEditEmail(userDetails.user.email || '');
      setEditCountry(userDetails.user.country || '');
      setEditLanguage(userDetails.user.language || 'es');
      setEditGlobalRole(
        userDetails.user.globalRole === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : 'USER'
      );
      const prefs = userDetails.user.notificationPrefs || {};
      setEmailEnabled(prefs.email_enabled !== false);
      setEmailAssign(prefs.email_assign !== false);
      setEmailReminders(prefs.email_reminders !== false);
      setEmailDigest(prefs.email_digest !== false);
    }
  }, [userDetails]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredUsers.slice(start, start + perPage);
  }, [filteredUsers, page, perPage]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      await apiClient.patch(`/api/system/users/${selectedUser.id}`, {
        name: editName,
        email: editEmail,
        country: editCountry || null,
        language: editLanguage,
        globalRole: editGlobalRole,
        notificationPrefs: {
          email_enabled: emailEnabled,
          email_assign: emailAssign,
          email_reminders: emailReminders,
          email_digest: emailDigest,
        },
      });
      toast.success('Datos del usuario actualizados');
      setIsEditing(false);
      onUsersUpdated();
      onRefreshSelectedUser(selectedUser.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo actualizar el usuario');
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserEmailsQuick = async () => {
    if (!selectedUser || !userDetails) return;
    const nextEnabled = !emailEnabled;
    setEmailEnabled(nextEnabled);
    try {
      await apiClient.patch(`/api/system/users/${selectedUser.id}`, {
        notificationPrefs: {
          email_enabled: nextEnabled,
          email_assign: emailAssign,
          email_reminders: emailReminders,
          email_digest: emailDigest,
        },
      });
      toast.success(
        nextEnabled
          ? 'Notificaciones por correo habilitadas para este usuario'
          : 'Notificaciones por correo desactivadas para este usuario'
      );
      onRefreshSelectedUser(selectedUser.id);
    } catch (err: any) {
      setEmailEnabled(!nextEnabled);
      toast.error(err?.response?.data?.message || 'Error al cambiar preferencia de correo');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!selectedUser) return;
    setRevokingSessionId(sessionId);
    try {
      await apiClient.delete(`/api/system/users/${selectedUser.id}/sessions/${sessionId}`);
      toast.success('Sesión revocada');
      onRefreshSelectedUser(selectedUser.id);
    } catch {
      toast.error('No se pudo revocar la sesión');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!selectedUser) return;
    setRevokingSessionId('ALL');
    try {
      await apiClient.delete(`/api/system/users/${selectedUser.id}/sessions`);
      toast.success('Todas las sesiones del usuario fueron cerradas');
      onRefreshSelectedUser(selectedUser.id);
    } catch {
      toast.error('No se pudieron cerrar las sesiones');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const filteredCardEvents = useMemo(() => {
    const events = userDetails?.cardEvents || [];
    if (activityWorkspaceFilter === 'all') return events;
    return events.filter((ev) => ev.workspaceId === activityWorkspaceFilter);
  }, [userDetails?.cardEvents, activityWorkspaceFilter]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* Lista de usuarios */}
      <div className="xl:col-span-5 bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-cu-border dark:border-dark-border">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-4">
            <UsersRound size={20} className="text-[#12A9A8]" />
            Cuentas Registradas ({filteredUsers.length})
          </h2>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-cu-muted dark:text-zinc-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-[#12A9A8]/60 outline-none transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-cu-border dark:divide-dark-border max-h-[650px] overflow-y-auto custom-scrollbar">
          {paginatedUsers.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectUser(item)}
              className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4 group ${
                selectedUser?.id === item.id
                  ? 'bg-[#12A9A8]/[0.07] border-l-4 border-[#12A9A8]'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12A9A8] to-[#0e8f8e] flex items-center justify-center text-white text-sm font-black shrink-0">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-cu-text dark:text-zinc-100 truncate group-hover:text-[#12A9A8] transition-colors flex items-center gap-2">
                    <span className="truncate">{item.name}</span>
                    {item.referralSource && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#12A9A8]/10 text-[#0E8786] dark:text-[#12A9A8] border border-[#12A9A8]/20 shrink-0">
                        {item.referralSource}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-cu-muted dark:text-zinc-500 truncate">{item.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    item.globalRole === 'SYSTEM_ADMIN'
                      ? 'bg-[#FF665E]/12 text-[#FF665E] border border-[#FF665E]/25'
                      : 'bg-[#12A9A8]/12 text-[#12A9A8]'
                  }`}
                >
                  {item.globalRole === 'SYSTEM_ADMIN' ? 'SUPER' : 'USER'}
                </span>
                <ChevronRight
                  size={16}
                  className="text-cu-muted dark:text-zinc-600 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          ))}
          {paginatedUsers.length === 0 && (
            <div className="p-12 text-center text-cu-muted dark:text-zinc-500 text-sm">
              No se encontraron usuarios.
            </div>
          )}
        </div>

        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 border-t border-cu-border dark:border-dark-border flex justify-between items-center text-xs font-semibold text-cu-muted dark:text-zinc-400">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-lg px-2 py-1 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 disabled:opacity-30 cursor-pointer"
              >
                Ant
              </button>
              <span className="px-2">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 disabled:opacity-30 cursor-pointer"
              >
                Sig
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspector avanzado del usuario */}
      <div className="xl:col-span-7">
        {selectedUser ? (
          loadingDetails ? (
            <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl p-12 flex flex-col items-center justify-center gap-4 min-h-[400px]">
              <div className="w-8 h-8 border-2 border-[#12A9A8] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-cu-muted dark:text-zinc-400">
                Analizando cuenta, sesiones y actividad...
              </p>
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* Tarjeta principal + acciones rápidas */}
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 pb-6 border-b border-cu-border dark:border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12A9A8] to-[#0e8f8e] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#12A9A8]/20 shrink-0">
                      {userDetails.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-2xl font-black">{userDetails.user.name}</h3>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            userDetails.user.globalRole === 'SYSTEM_ADMIN'
                              ? 'bg-[#FF665E]/12 text-[#FF665E] border border-[#FF665E]/25'
                              : 'bg-[#12A9A8]/12 text-[#12A9A8]'
                          }`}
                        >
                          {userDetails.user.globalRole}
                        </span>
                      </div>
                      <p className="text-sm text-cu-muted dark:text-zinc-400">
                        {userDetails.user.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-cu-muted dark:text-zinc-500 mt-1.5">
                        <span>
                          Registro: {new Date(userDetails.user.createdAt).toLocaleDateString()}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-[#12A9A8] font-semibold">
                          <Clock3 size={12} />
                          Último acceso:{' '}
                          {userDetails.lastLoginAt
                            ? new Date(userDetails.lastLoginAt).toLocaleString()
                            : 'Sin registro'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing((v) => !v)}
                      className="px-3.5 py-2 rounded-xl bg-[#12A9A8]/10 hover:bg-[#12A9A8]/20 text-[#12A9A8] border border-[#12A9A8]/25 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                      {isEditing ? 'Cancelar edición' : 'Editar usuario'}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleUserEmailsQuick}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                        emailEnabled
                          ? 'bg-[#FFCC40]/15 hover:bg-[#FFCC40]/25 text-[#9c6f00] dark:text-[#FFCC40] border-[#FFCC40]/30'
                          : 'bg-[#FF665E]/10 hover:bg-[#FF665E]/20 text-[#FF665E] border-[#FF665E]/25'
                      }`}
                    >
                      <Mail size={14} />
                      {emailEnabled ? 'Desactivar correos' : 'Correos desactivados'}
                    </button>
                  </div>
                </div>

                {/* Formulario de edición avanzada de usuario */}
                {isEditing && (
                  <form
                    onSubmit={handleSaveUser}
                    className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-[#12A9A8]/30 space-y-4"
                  >
                    <div className="text-xs font-black uppercase tracking-wider text-[#12A9A8]">
                      Editar datos y preferencias del usuario
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-cu-muted mb-1">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white dark:bg-[#1E222D] border border-cu-border dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#12A9A8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-cu-muted mb-1">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-white dark:bg-[#1E222D] border border-cu-border dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#12A9A8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-cu-muted mb-1">
                          País
                        </label>
                        <input
                          type="text"
                          value={editCountry}
                          onChange={(e) => setEditCountry(e.target.value)}
                          placeholder="Ej: Venezuela, España..."
                          className="w-full bg-white dark:bg-[#1E222D] border border-cu-border dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#12A9A8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-cu-muted mb-1">
                          Rol Global
                        </label>
                        <select
                          disabled={userDetails.user.id === currentUserId}
                          value={editGlobalRole}
                          onChange={(e) =>
                            setEditGlobalRole(e.target.value as 'USER' | 'SYSTEM_ADMIN')
                          }
                          className="w-full bg-white dark:bg-[#1E222D] border border-cu-border dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#12A9A8] disabled:opacity-50"
                        >
                          <option value="USER">USER</option>
                          <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-cu-border dark:border-white/10">
                      <div className="text-[11px] font-bold text-cu-muted uppercase tracking-wider mb-2">
                        Preferencias de notificación por correo
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailEnabled}
                            onChange={(e) => setEmailEnabled(e.target.checked)}
                            className="accent-[#12A9A8]"
                          />
                          <span>Correos activos</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailAssign}
                            onChange={(e) => setEmailAssign(e.target.checked)}
                            className="accent-[#12A9A8]"
                          />
                          <span>Asignaciones</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailReminders}
                            onChange={(e) => setEmailReminders(e.target.checked)}
                            className="accent-[#12A9A8]"
                          />
                          <span>Recordatorios</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailDigest}
                            onChange={(e) => setEmailDigest(e.target.checked)}
                            className="accent-[#12A9A8]"
                          />
                          <span>Resumen diario</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        disabled={savingUser}
                        className="px-4 py-2 rounded-xl bg-[#12A9A8] hover:bg-[#0e8f8e] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {savingUser ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Save size={13} />
                        )}
                        Guardar cambios
                      </button>
                    </div>
                  </form>
                )}

                {/* Métricas rápidas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5">
                    <div className="text-[11px] font-bold uppercase text-cu-muted flex items-center gap-1.5">
                      <HardDrive size={13} className="text-[#12A9A8]" /> Almacenamiento
                    </div>
                    <div className="text-xl font-black mt-1">
                      {formatBytes(userDetails.storageBytes)}
                    </div>
                    <div className="text-xs text-cu-muted">
                      {userDetails.attachmentsCount} archivos
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5">
                    <div className="text-[11px] font-bold uppercase text-cu-muted flex items-center gap-1.5">
                      <CheckSquare size={13} className="text-[#FFCC40]" /> Tareas Asignadas
                    </div>
                    <div className="text-xl font-black mt-1">{userDetails.assignedCardsCount}</div>
                    <div className="text-xs text-cu-muted">
                      {userDetails.completedAssignedCards} completadas
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5">
                    <div className="text-[11px] font-bold uppercase text-cu-muted flex items-center gap-1.5">
                      <Building2 size={13} className="text-[#FF665E]" /> Espacios y Tableros
                    </div>
                    <div className="text-xl font-black mt-1">
                      {userDetails.workspaces.length} / {userDetails.boards.length}
                    </div>
                    <div className="text-xs text-cu-muted">espacios / tableros</div>
                  </div>
                </div>
              </div>

              {/* Canal de Adquisición / ¿Cómo nos conoció? */}
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-cu-muted flex items-center gap-2 mb-3">
                  <Share2 size={15} className="text-[#12A9A8]" />
                  Canal de Adquisición / ¿Cómo nos conoció?
                </h4>
                {userDetails.user.referralSource ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#12A9A8]/15 text-[#0E8786] dark:text-[#12A9A8] border border-[#12A9A8]/25">
                        {userDetails.user.referralSource}
                      </span>
                      {userDetails.user.referralAnsweredAt && (
                        <span className="text-xs text-cu-muted">
                          Registrado el {new Date(userDetails.user.referralAnsweredAt).toLocaleDateString()} a las{' '}
                          {new Date(userDetails.user.referralAnsweredAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    {userDetails.user.referralDetails && (
                      <div className="text-xs text-cu-text dark:text-zinc-300 pt-2 border-t border-cu-border/50 dark:border-white/5">
                        <span className="text-cu-muted font-medium">Detalle proporcionado: </span>
                        <span className="font-semibold italic">
                          "{userDetails.user.referralDetails}"
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-dashed border-cu-border dark:border-white/10 text-xs text-cu-muted">
                    Sin datos de adquisición registrados (cuenta anterior o cuestionario omitido).
                  </div>
                )}
              </div>

              {/* Sesiones e Inicios de Sesión */}
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cu-muted flex items-center gap-2">
                    <Laptop size={15} className="text-[#12A9A8]" />
                    Sesiones e Inicios de Sesión ({userDetails.sessions?.length || 0})
                  </h4>
                  {(userDetails.sessions?.length || 0) > 0 && (
                    <button
                      type="button"
                      disabled={revokingSessionId === 'ALL'}
                      onClick={handleRevokeAllSessions}
                      className="px-3 py-1 rounded-lg bg-[#FF665E]/10 hover:bg-[#FF665E]/20 text-[#FF665E] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut size={12} />
                      Cerrar todas
                    </button>
                  )}
                </div>

                {userDetails.sessions && userDetails.sessions.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {userDetails.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                            <span>{parseUserAgentLabel(s.userAgent)}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                                s.isExpired
                                  ? 'bg-slate-200 dark:bg-white/10 text-slate-500'
                                  : 'bg-[#12A9A8]/15 text-[#12A9A8]'
                              }`}
                            >
                              {s.isExpired ? 'Expirada' : 'Activa'}
                            </span>
                          </div>
                          <div className="text-[11px] text-cu-muted dark:text-zinc-500 mt-0.5">
                            Inicio: {new Date(s.createdAt).toLocaleString()} · IP:{' '}
                            {s.ipAddress || 'N/D'}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={revokingSessionId === s.id}
                          onClick={() => handleRevokeSession(s.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#FF665E] hover:bg-[#FF665E]/10 transition-colors cursor-pointer"
                          title="Revocar sesión"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-cu-muted">No hay sesiones registradas recientemente.</p>
                )}
              </div>

              {/* Espacios & Tableros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cu-muted mb-3 flex items-center gap-2">
                    <Building2 size={15} className="text-[#FF665E]" />
                    Espacios ({userDetails.workspaces.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {userDetails.workspaces.map((ws) => (
                      <div
                        key={ws.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{ws.name}</div>
                          <div className="text-[11px] text-cu-muted">
                            {ws.boardsCount} tableros · {ws.membersCount} miembros
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#12A9A8]/12 text-[#12A9A8] uppercase">
                          {ws.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cu-muted mb-3 flex items-center gap-2">
                    <Layers3 size={15} className="text-[#12A9A8]" />
                    Tableros ({userDetails.boards.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {userDetails.boards.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold truncate">{b.name}</div>
                          <div className="text-[11px] text-cu-muted truncate">
                            {b.workspaceName} · {b.cardsCount} tarjetas
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-[#12A9A8] uppercase">
                          {b.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actividad detallada por espacio */}
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cu-muted flex items-center gap-2">
                    <Activity size={15} className="text-[#12A9A8]" />
                    Actividad detallada en Espacios y Tarjetas
                  </h4>
                  <select
                    value={activityWorkspaceFilter}
                    onChange={(e) => setActivityWorkspaceFilter(e.target.value)}
                    className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                  >
                    <option value="all">Todos sus espacios</option>
                    {userDetails.workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredCardEvents.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {filteredCardEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-[#12A9A8]">{ev.type}</span>{' '}
                          <span className="text-slate-700 dark:text-zinc-200 font-semibold">
                            {ev.cardTitle || 'Tarjeta'}
                          </span>
                          <div className="text-[11px] text-cu-muted dark:text-zinc-500 mt-0.5 truncate">
                            {ev.workspaceName || 'Espacio'} → {ev.boardName || 'Tablero'}
                          </div>
                        </div>
                        <span className="text-[11px] text-cu-muted shrink-0">
                          {new Date(ev.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-cu-muted py-3">
                    Sin eventos de tarjetas registrados para este filtro.
                  </p>
                )}

                {userDetails.recentActivity.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-cu-border dark:border-white/10">
                    <div className="text-[11px] font-black uppercase tracking-wider text-cu-muted mb-2">
                      Eventos de Cuenta y Auditoría
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {userDetails.recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]"
                        >
                          <span className="font-mono text-[11px] text-[#12A9A8]">{act.action}</span>
                          <span className="text-cu-muted text-[11px]">
                            {act.ipAddress ? `IP ${act.ipAddress} · ` : ''}
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null
        ) : (
          <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
            <UsersRound size={48} className="text-slate-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-600 dark:text-zinc-300">
              Selecciona un usuario
            </h3>
            <p className="text-sm text-cu-muted dark:text-zinc-500 max-w-sm mt-2">
              Edita sus datos, desactiva correos, revisa sus inicios de sesión y audita su actividad por espacio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersTab;
