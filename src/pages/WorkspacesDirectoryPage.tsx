import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Users,
  Layout,
  ArrowRight,
  Crown,
  ShieldCheck,
  User,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Settings
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import DeleteWorkspaceModal from '../components/DeleteWorkspaceModal';
import EditWorkspaceModal, { type WorkspaceEditableData } from '../components/EditWorkspaceModal';
import Badge, { type BadgeTone } from '../components/ui/Badge';
import { LuminsBoardIcon, LuminsMembersIcon } from '../components/icons/LuminsIcons';
import { toast } from 'sonner';
import { useModuleLoading } from '../contexts/NavigationLoaderContext';

interface WorkspaceItem {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  members?: {
    userId: string;
    role: string;
  }[];
  _count?: {
    boards: number;
    members: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const WorkspacesDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  useModuleLoading(isLoading, 'workspaces-directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'OWNER' | 'MEMBER'>('all');

  // Delete modal state
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);
  // Edit modal state
  const [workspaceToEdit, setWorkspaceToEdit] = useState<WorkspaceEditableData | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const response = await apiClient.get<{
        data: {
          workspaces: WorkspaceItem[];
          pagination?: PaginationInfo;
        };
      }>(`/api/workspaces?${params.toString()}`);

      setWorkspaces(response.data.workspaces || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      } else {
        setPagination(prev => ({
          ...prev,
          total: response.data.workspaces?.length || 0,
          totalPages: 1,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch workspaces in directory', err);
      toast.error('Error al cargar espacios de trabajo');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Listen to global changes
  useEffect(() => {
    const handleRefresh = () => fetchWorkspaces();
    window.addEventListener('workspace-changed', handleRefresh);
    return () => window.removeEventListener('workspace-changed', handleRefresh);
  }, [fetchWorkspaces]);

  const handleEnterWorkspace = (id: string) => {
    try {
      const raw = localStorage.getItem('lumins_recent_workspaces');
      const recents: string[] = raw ? JSON.parse(raw) : [];
      const updated = [id, ...recents.filter(x => x !== id)].slice(0, 15);
      localStorage.setItem('lumins_recent_workspaces', JSON.stringify(updated));
    } catch (e) { }

    localStorage.setItem('lastActiveWorkspaceId', id);
    navigate(`/w/${id}/dashboard`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const colors = [
    { bg: 'from-[var(--lumins-accent)] to-[var(--lumins-accent-hover)]', text: 'text-[var(--lumins-accent-on)]' },
    { bg: 'from-[#FF665E] to-[#E54D45]', text: 'text-white' },
    { bg: 'from-amber-400 to-amber-500', text: 'text-[#13151A]' },
    { bg: 'from-slate-700 to-slate-800', text: 'text-white' },
  ];

  const getGradient = (id: string) => {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getUserRole = (ws: WorkspaceItem): { label: string; tone: BadgeTone } => {
    if (ws.ownerId === user?.id) return { label: 'Propietario', tone: 'amber' };
    const member = ws.members?.find(m => m.userId === user?.id);
    if (member?.role === 'ADMIN') return { label: 'Administrador', tone: 'teal' };
    return { label: 'Miembro', tone: 'neutral' };
  };

  return (
    <div className="flex-1 flex flex-col font-sans min-w-0 w-full overflow-x-hidden">
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full min-w-0 space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[var(--lumins-accent-fg)] mb-0.5">
              <LuminsBoardIcon size={16} />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Gestión de Espacios</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              Mis Espacios de Trabajo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
              Explora, busca y accede a todos los espacios de trabajo a los que tienes acceso.
            </p>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[var(--lumins-accent)] hover:bg-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)] text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Plus size={15} />
            <span>Crear nuevo espacio</span>
          </button>
        </div>

        {/* Toolbar: Search & Role Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-1.5 bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-sm">
          {/* Search bar */}
          <div className="relative flex items-center flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar espacio por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-4 bg-transparent text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => { setRoleFilter('all'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all shrink-0 ${roleFilter === 'all'
                ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              Todos ({pagination.total})
            </button>
            <button
              onClick={() => { setRoleFilter('OWNER'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all shrink-0 ${roleFilter === 'OWNER'
                ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              Mis Espacios
            </button>
            <button
              onClick={() => { setRoleFilter('MEMBER'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all shrink-0 ${roleFilter === 'MEMBER'
                ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              Colaboraciones
            </button>
          </div>
        </div>

        {/* Content: Grid or Empty State */}
        {isLoading ? null : workspaces.length === 0 ? (
          <div className="py-14 px-6 text-center bg-white dark:bg-[#1C1F26] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] flex items-center justify-center mb-3">
              <LuminsBoardIcon size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">
              No se encontraron espacios
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-5">
              {searchQuery
                ? `No hay coincidencias para "${searchQuery}". Intenta con otro término o limpia los filtros.`
                : 'Aún no perteneces a ningún espacio de trabajo. Comienza creando el primero.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[var(--lumins-accent)] hover:bg-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)] text-xs font-semibold transition-all shadow-sm"
              >
                <Plus size={14} />
                <span>Crear espacio</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspaces.map(ws => {
              const role = getUserRole(ws);
              const isOwner = ws.ownerId === user?.id;

              return (
                <div
                  key={ws.id}
                  className="group relative p-4 rounded-xl bg-white dark:bg-[#1C1F26] border border-slate-200/90 dark:border-white/10 shadow-sm hover:shadow-md hover:border-[var(--lumins-accent-border)] transition-all flex flex-col justify-between gap-3.5"
                >
                  <div>
                    {/* Header: Avatar, Name, Role Badge */}
                    <div className="flex items-start justify-between gap-2.5 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {(() => {
                          const grad = getGradient(ws.id);
                          return (
                            <div
                              className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${grad.bg} ${grad.text} flex items-center justify-center text-xs font-black shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
                            >
                              {getInitials(ws.name)}
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <h3
                            onClick={() => handleEnterWorkspace(ws.id)}
                            className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate cursor-pointer hover:text-[var(--lumins-accent-fg)] transition-colors"
                            title={ws.name}
                          >
                            {ws.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium truncate">
                            {isOwner ? 'Creado por ti' : `Por: ${ws.owner?.name || ws.owner?.email || 'Admin'}`}
                          </p>
                        </div>
                      </div>

                      {/* Role Pill */}
                      <Badge variant="dot" size="xs" tone={role.tone} className="shrink-0">
                        {role.label}
                      </Badge>
                    </div>

                    {/* Description if present */}
                    {ws.description && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {ws.description}
                      </p>
                    )}
                  </div>

                  {/* Footer: Metrics and Enter Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-3">
                      <div title="Tableros">
                        <Badge variant="inline" size="xs" icon={<LuminsBoardIcon size={13} />}>
                          {ws._count?.boards || 0}
                        </Badge>
                      </div>
                      <div title="Miembros">
                        <Badge variant="inline" size="xs" icon={<LuminsMembersIcon size={13} />}>
                          {ws._count?.members || 1}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {(isOwner || role.label === 'Administrador' || (user as any)?.globalRole === 'SYSTEM_ADMIN') && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setWorkspaceToEdit(ws);
                          }}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-[var(--lumins-accent-fg)] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          title="Propiedades del espacio"
                        >
                          <Settings size={13} />
                        </button>
                      )}

                      {isOwner && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setWorkspaceToDelete({ id: ws.id, name: ws.name });
                          }}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-[#E54D45] hover:bg-[#FF665E]/10 transition-colors"
                          title="Eliminar espacio"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => handleEnterWorkspace(ws.id)}
                        className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-[var(--lumins-accent)] text-slate-700 dark:text-zinc-300 hover:text-[var(--lumins-accent-on)] text-xs font-semibold transition-all group/btn active:scale-95"
                      >
                        <span>Ingresar</span>
                        <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Mostrando página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong> ({pagination.total} espacios)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  // Show current, first, last, or adjacent
                  if (
                    p === 1 ||
                    p === pagination.totalPages ||
                    (p >= pagination.page - 1 && p <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === pagination.page
                          ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === pagination.page - 2 || p === pagination.page + 2) {
                    return <span key={p} className="text-xs text-slate-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Workspace Modal */}
      {workspaceToEdit && (
        <EditWorkspaceModal
          isOpen={!!workspaceToEdit}
          onClose={() => setWorkspaceToEdit(null)}
          workspace={workspaceToEdit}
          onWorkspaceUpdated={(updated) => {
            setWorkspaces(prev => prev.map(w => w.id === updated.id ? { ...w, ...updated } : w));
          }}
          onRequestDelete={(id, name) => {
            setWorkspaceToDelete({ id, name });
          }}
        />
      )}

      {/* Delete Workspace Modal */}
      {workspaceToDelete && (
        <DeleteWorkspaceModal
          isOpen={!!workspaceToDelete}
          onClose={() => setWorkspaceToDelete(null)}
          workspaceId={workspaceToDelete.id}
          workspaceName={workspaceToDelete.name}
        />
      )}
    </div>
  );
};

export default WorkspacesDirectoryPage;

