import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Lock, Palette, Share2 } from 'lucide-react';
import UserProfileForm from '../../components/settings/UserProfileForm';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { LuminsBoardIcon, LuminsMembersIcon } from '../../components/icons/LuminsIcons';
import { Skeleton } from '../../components/ui/Skeleton';

interface SummaryWorkspace {
  id: string;
  name: string;
  ownerId: string;
  members?: { userId: string; role: string }[];
  _count?: {
    boards: number;
    members: number;
  };
}

const getWorkspaceRoleMeta = (
  ws: SummaryWorkspace,
  userId?: string
): { label: string; tone: BadgeTone } => {
  if (ws.ownerId === userId) return { label: 'Propietario', tone: 'amber' };
  const role = ws.members?.find(m => m.userId === userId)?.role;
  if (role === 'ADMIN') return { label: 'Administrador', tone: 'teal' };
  if (role === 'GUEST') return { label: 'Invitado', tone: 'coral' };
  return { label: 'Miembro', tone: 'neutral' };
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const AccountSummaryCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<SummaryWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadWorkspaces = async () => {
      try {
        const res = await apiClient.get<{ data: { workspaces: SummaryWorkspace[] } }>(
          '/api/workspaces?limit=50'
        );
        if (active) {
          setWorkspaces(res.data?.workspaces || []);
        }
      } catch {
        if (active) setWorkspaces([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadWorkspaces();
    return () => {
      active = false;
    };
  }, []);

  const ownedCount = workspaces.filter(ws => ws.ownerId === user?.id).length;
  const invitedCount = Math.max(0, workspaces.length - ownedCount);
  const totalBoards = workspaces.reduce((sum, ws) => sum + (ws._count?.boards || 0), 0);

  return (
    <aside className="h-full bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-5">
      <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col">
        {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Briefcase size={16} className="text-[var(--lumins-accent-fg)] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
              Resumen de Cuenta
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              Tu actividad y espacios vinculados
            </p>
          </div>
        </div>
        {workspaces.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/workspaces')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--lumins-accent-fg)] hover:underline shrink-0 cursor-pointer"
          >
            <span>Ver todos</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Espacios
          </p>
          <p className="text-lg font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 leading-none">
            {loading ? '–' : workspaces.length}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
            {loading ? '...' : `${ownedCount} propios · ${invitedCount} inv.`}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Tableros
          </p>
          <p className="text-lg font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 leading-none">
            {loading ? '–' : totalBoards}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
            Accesibles
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Cuenta
          </p>
          <p className="text-xs font-extrabold text-[var(--lumins-accent-fg)] mt-1 leading-tight truncate">
            {user?.globalRole === 'SYSTEM_ADMIN' ? 'Admin' : 'Activa'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
            Sesión verificada
          </p>
        </div>
      </div>

      {/* Workspaces list */}
      <div className="space-y-2 flex-1 flex flex-col">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
          Espacios donde participas
        </span>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-6 text-center rounded-lg border border-dashed border-slate-200 dark:border-white/10">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Aún no perteneces a ningún espacio.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[210px] overflow-y-auto custom-scrollbar pr-0.5">
            {workspaces.map(ws => {
              const roleMeta = getWorkspaceRoleMeta(ws, user?.id);
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => navigate(`/w/${ws.id}/boards`)}
                  className="w-full flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:border-[var(--lumins-accent-border)] hover:bg-[var(--lumins-accent-soft)]/40 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] flex items-center justify-center text-[10px] font-black shrink-0">
                      {getInitials(ws.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-[var(--lumins-accent-fg)] transition-colors">
                        {ws.name}
                      </p>
                      <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <LuminsBoardIcon size={11} />
                          {ws._count?.boards || 0} tableros
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <LuminsMembersIcon size={11} />
                          {ws._count?.members || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="dot" size="xs" tone={roleMeta.tone} className="shrink-0">
                    {roleMeta.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      </div>

      {/* Quick Shortcuts */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-white/5 space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
          Accesos rápidos
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings/security')}
            className="flex items-center justify-center gap-1.5 h-9 sm:h-8 px-2 rounded-lg border border-slate-200/80 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:border-[var(--lumins-accent-border)] hover:text-[var(--lumins-accent-fg)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Lock size={12} />
            <span className="truncate">Seguridad</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings/integrations')}
            className="flex items-center justify-center gap-1.5 h-9 sm:h-8 px-2 rounded-lg border border-slate-200/80 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:border-[var(--lumins-accent-border)] hover:text-[var(--lumins-accent-fg)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Share2 size={12} />
            <span className="truncate">Apps</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings/preferences')}
            className="flex items-center justify-center gap-1.5 h-9 sm:h-8 px-2 rounded-lg border border-slate-200/80 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:border-[var(--lumins-accent-border)] hover:text-[var(--lumins-accent-fg)] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Palette size={12} />
            <span className="truncate">Tema</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const ProfileSettings: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
      <div className="lg:col-span-7">
        <UserProfileForm />
      </div>
      <div className="lg:col-span-5">
        <AccountSummaryCard />
      </div>
    </div>
  );
};

export default ProfileSettings;
