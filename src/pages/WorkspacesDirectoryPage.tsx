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
  ExternalLink
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import DeleteWorkspaceModal from '../components/DeleteWorkspaceModal';
import { toast } from 'sonner';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'OWNER' | 'MEMBER'>('all');

  // Delete modal state
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);

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
    } catch (e) {}

    localStorage.setItem('lastActiveWorkspaceId', id);
    navigate(`/w/${id}/dashboard`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const colors = [
    'from-indigo-500 to-violet-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-purple-500 to-indigo-600',
  ];

  const getGradient = (id: string) => {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getUserRole = (ws: WorkspaceItem) => {
    if (ws.ownerId === user?.id) return { label: 'Propietario', icon: Crown, color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' };
    const member = ws.members?.find(m => m.userId === user?.id);
    if (member?.role === 'ADMIN') return { label: 'Administrador', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/30' };
    return { label: 'Miembro', icon: User, color: 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/10 border-zinc-200 dark:border-white/10' };
  };

  return (
    <div className="flex-1 flex flex-col font-sans min-w-0 w-full overflow-x-hidden">
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full min-w-0 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#6C5DD3] mb-1">
              <Building2 size={18} strokeWidth={2.5} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Gestión de Espacios</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Mis Espacios de Trabajo
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              Explora, busca y accede a todos los espacios de trabajo a los que tienes acceso.
            </p>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-bold transition-all shadow-md shadow-[#6C5DD3]/25 active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span>Crear nuevo espacio</span>
          </button>
        </div>

        {/* Toolbar: Search & Role Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-soft">
          {/* Search bar */}
          <div className="relative flex items-center flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar espacio por nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-md text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => { setRoleFilter('all'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                roleFilter === 'all'
                  ? 'bg-[#6C5DD3] text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              Todos ({pagination.total})
            </button>
            <button
              onClick={() => { setRoleFilter('OWNER'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                roleFilter === 'OWNER'
                  ? 'bg-[#6C5DD3] text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              Mis Espacios
            </button>
            <button
              onClick={() => { setRoleFilter('MEMBER'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                roleFilter === 'MEMBER'
                  ? 'bg-[#6C5DD3] text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              Colaboraciones
            </button>
          </div>
        </div>

        {/* Content: Grid or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 shadow-soft animate-pulse flex flex-col gap-4 h-48"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-white/10" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-3/4 bg-zinc-200 dark:bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-zinc-100 dark:bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded" />
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
                  <div className="h-4 w-20 bg-zinc-100 dark:bg-white/5 rounded" />
                  <div className="h-7 w-20 bg-zinc-200 dark:bg-white/10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-soft flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center mb-3">
              <Building2 size={26} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              No se encontraron espacios
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-5">
              {searchQuery
                ? `No hay coincidencias para "${searchQuery}". Intenta con otro término o limpia los filtros.`
                : 'Aún no perteneces a ningún espacio de trabajo. Comienza creando el primero.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-bold transition-all shadow-md shadow-[#6C5DD3]/25"
              >
                <Plus size={14} />
                <span>Crear espacio</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {workspaces.map(ws => {
              const role = getUserRole(ws);
              const RoleIcon = role.icon;
              const isOwner = ws.ownerId === user?.id;

              return (
                <div
                  key={ws.id}
                  className="group relative p-5 rounded-2xl bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 shadow-soft hover:shadow-lg hover:border-[#6C5DD3]/40 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Header: Avatar, Name, Role Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${getGradient(
                            ws.id
                          )} text-white flex items-center justify-center text-xs font-black shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          {getInitials(ws.name)}
                        </div>
                        <div className="min-w-0">
                          <h3
                            onClick={() => handleEnterWorkspace(ws.id)}
                            className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:text-[#6C5DD3] transition-colors"
                            title={ws.name}
                          >
                            {ws.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium truncate">
                            {isOwner ? 'Creado por ti' : `Por: ${ws.owner?.name || ws.owner?.email || 'Admin'}`}
                          </p>
                        </div>
                      </div>

                      {/* Role Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${role.color} shrink-0`}
                      >
                        <RoleIcon size={10} />
                        <span>{role.label}</span>
                      </span>
                    </div>

                    {/* Description if present */}
                    {ws.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {ws.description}
                      </p>
                    )}
                  </div>

                  {/* Footer: Metrics and Enter Button */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                      <div className="flex items-center gap-1" title="Tableros">
                        <Layout size={13} className="text-zinc-400" />
                        <span>{ws._count?.boards || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Miembros">
                        <Users size={13} className="text-zinc-400" />
                        <span>{ws._count?.members || 1}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOwner && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setWorkspaceToDelete({ id: ws.id, name: ws.name });
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Eliminar espacio"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => handleEnterWorkspace(ws.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-[#6C5DD3] text-zinc-700 dark:text-zinc-300 hover:text-white text-xs font-bold transition-all group/btn shadow-xs active:scale-95"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-white/10">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Mostrando página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong> ({pagination.total} espacios)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
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
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          p === pagination.page
                            ? 'bg-[#6C5DD3] text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === pagination.page - 2 || p === pagination.page + 2) {
                    return <span key={p} className="text-xs text-zinc-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Workspace Modal */}
      {workspaceToDelete && (
        <DeleteWorkspaceModal
          isOpen={!!workspaceToDelete}
          onClose={() => setWorkspaceToDelete(null)}
          workspaceId={workspaceToDelete.id}
          workspaceName={workspaceToDelete.name}
          onWorkspaceDeleted={() => {
            setWorkspaceToDelete(null);
            fetchWorkspaces();
          }}
        />
      )}
    </div>
  );
};

export default WorkspacesDirectoryPage;
