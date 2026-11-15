import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Search, RefreshCw, Users, Layout, Building2, Zap } from 'lucide-react';
import apiClient from '../../lib/api-client';
import type { AdminActivityItem, AdminUserSummary, AdminWorkspace } from './types';

interface AdminActivityTabProps {
  users: AdminUserSummary[];
  workspaces: AdminWorkspace[];
}

const AdminActivityTab: React.FC<AdminActivityTabProps> = ({ users, workspaces }) => {
  const [logs, setLogs] = useState<AdminActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [category, setCategory] = useState('all');
  const [userId, setUserId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: { logs: AdminActivityItem[]; total: number } }>(
        '/api/system/activity',
        {
          params: {
            page,
            limit: perPage,
            category,
            search: search.trim() || undefined,
            userId: userId || undefined,
            workspaceId: workspaceId || undefined,
          },
        }
      );
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, category, search, userId, workspaceId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchActivity();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchActivity]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Activity size={20} className="text-[#12A9A8]" />
            Auditoría y Actividad Global ({total})
          </h2>
          <p className="text-xs text-cu-muted dark:text-zinc-500 mt-1">
            Filtra por categoría, usuario específico, espacio de trabajo o inicios de sesión.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchActivity()}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#12A9A8]' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cu-muted"
          />
          <input
            type="text"
            placeholder="Buscar acción o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs outline-none focus:border-[#12A9A8]"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
        >
          <option value="all">Todas las categorías</option>
          <option value="auth">Inicios de sesión y cuentas</option>
          <option value="workspace">Espacios de trabajo</option>
          <option value="board">Tableros</option>
          <option value="card">Tarjetas</option>
          <option value="telemetry">Telemetría</option>
        </select>

        <select
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
        >
          <option value="">Todos los usuarios</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>

        <select
          value={workspaceId}
          onChange={(e) => {
            setWorkspaceId(e.target.value);
            setPage(1);
          }}
          className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
        >
          <option value="">Todos los espacios</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading && logs.length === 0 ? (
        <div className="py-14 flex items-center justify-center">
          <RefreshCw size={22} className="animate-spin text-[#12A9A8]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-14 text-center text-sm text-cu-muted">
          No hay registros de actividad con estos filtros.
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((act) => (
            <div
              key={act.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-white/5 hover:border-[#12A9A8]/30 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    act.type === 'workspace'
                      ? 'bg-[#FF665E]/12 text-[#FF665E]'
                      : act.type === 'user'
                        ? 'bg-[#12A9A8]/12 text-[#12A9A8]'
                        : act.type === 'board'
                          ? 'bg-[#FFCC40]/18 text-[#d99b00] dark:text-[#FFCC40]'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                  }`}
                >
                  {act.type === 'workspace' ? (
                    <Building2 size={16} />
                  ) : act.type === 'user' ? (
                    <Users size={16} />
                  ) : act.type === 'board' ? (
                    <Layout size={16} />
                  ) : (
                    <Zap size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    <span className="font-bold text-[#12A9A8]">{act.user}</span>{' '}
                    <span className="text-slate-600 dark:text-zinc-300">{act.action}</span>{' '}
                    {act.target && (
                      <span className="font-bold text-slate-900 dark:text-white">{act.target}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-cu-muted dark:text-zinc-500 mt-0.5 flex flex-wrap gap-2">
                    <span className="font-mono">{act.actionCode}</span>
                    {act.ipAddress && <span>· IP: {act.ipAddress}</span>}
                  </div>
                </div>
              </div>

              <span className="text-xs text-cu-muted dark:text-zinc-500 shrink-0">
                {new Date(act.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="mt-6 pt-4 border-t border-cu-border dark:border-dark-border flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-semibold text-cu-muted">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-lg px-2 py-1"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span>de {total} eventos</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 disabled:opacity-30 cursor-pointer"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 disabled:opacity-30 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityTab;
