import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Check, Plus, Search, Grid, ArrowRight, Settings, Sliders, ShieldAlert, LogOut } from 'lucide-react';
import apiClient from '../lib/api-client';
import SmartPopover from './SmartPopover';
import DeleteWorkspaceModal from './DeleteWorkspaceModal';
import EditWorkspaceModal, { type WorkspaceEditableData } from './EditWorkspaceModal';
import { useAuth } from '../contexts/AuthContext';
import {
  clearImpersonatedWorkspace,
  getImpersonatedWorkspace,
  isSystemAdminUser,
} from '../lib/superAdminImpersonation';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  description?: string | null;
  createdAt?: string;
  _count?: {
    boards: number;
    members: number;
  };
}

interface WorkspaceSwitcherProps {
  onCreateClick: () => void;
  isCollapsed?: boolean;
  isFloating?: boolean;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ onCreateClick, isCollapsed, isFloating }) => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string, name: string } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<WorkspaceEditableData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await apiClient.get<{ data: { workspaces: Workspace[] } }>('/api/workspaces');
        setWorkspaces(response.data.workspaces || []);
      } catch (err) {
        console.error('Failed to fetch workspaces', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();

    const handleRefresh = () => fetchWorkspaces();
    window.addEventListener('workspace-changed', handleRefresh);
    return () => window.removeEventListener('workspace-changed', handleRefresh);
  }, []);

  const isSystemAdmin = isSystemAdminUser(user);
  const isImpersonating = Boolean(
    isSystemAdmin &&
      !isLoading &&
      workspaceId &&
      workspaceId !== 'global' &&
      !workspaces.some((w) => w.id === workspaceId)
  );
  const impersonatedInfo = isImpersonating ? getImpersonatedWorkspace() : null;

  const activeWorkspaceId = workspaceId || localStorage.getItem('lastActiveWorkspaceId');
  const currentWorkspace = isImpersonating
    ? undefined
    : workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  useEffect(() => {
    if (workspaceId && workspaces.some(w => w.id === workspaceId)) {
      localStorage.setItem('lastActiveWorkspaceId', workspaceId);
    }
  }, [workspaceId, workspaces]);

  const trackRecentWorkspace = (id: string) => {
    try {
      const raw = localStorage.getItem('lumins_recent_workspaces');
      const recents: string[] = raw ? JSON.parse(raw) : [];
      const updated = [id, ...recents.filter(x => x !== id)].slice(0, 15);
      localStorage.setItem('lumins_recent_workspaces', JSON.stringify(updated));
    } catch (e) { }
  };

  const handleSwitch = (id: string) => {
    clearImpersonatedWorkspace();
    trackRecentWorkspace(id);
    localStorage.setItem('lastActiveWorkspaceId', id);
    navigate(`/w/${id}/dashboard`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreate = () => {
    onCreateClick();
    setIsOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setWorkspaceToDelete({ id, name });
    setDeleteModalOpen(true);
    setIsOpen(false);
  };

  const handleEditClick = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation();
    setWorkspaceToEdit(workspace);
    setEditModalOpen(true);
    setIsOpen(false);
  };

  const canManageWorkspace = (w?: Workspace | null) => {
    if (!w) return false;
    return w.ownerId === user?.id || (user as any)?.globalRole === 'SYSTEM_ADMIN';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const colors = [
    'bg-[#12A9A8]', 'bg-[#FF665E]', 'bg-[#0E8786]',
    'bg-amber-500', 'bg-slate-700', 'bg-[#12A9A8]'
  ];

  const getColor = (id: string) => {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const visibleWorkspaces = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return workspaces.filter(w => w.name.toLowerCase().includes(q));
    }

    // Top recent / most used
    let recentIds: string[] = [];
    try {
      const raw = localStorage.getItem('lumins_recent_workspaces');
      if (raw) recentIds = JSON.parse(raw);
    } catch (e) { }

    const sorted = [...workspaces].sort((a, b) => {
      // Current active workspace always first
      if (a.id === currentWorkspace?.id) return -1;
      if (b.id === currentWorkspace?.id) return 1;

      const idxA = recentIds.indexOf(a.id);
      const idxB = recentIds.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    // Show top 6 workspaces if total > 6
    return sorted.slice(0, 6);
  }, [workspaces, searchQuery, currentWorkspace?.id]);

  if (isLoading) {
    return (
      <div className={`w-full ${isCollapsed ? 'h-8 w-8' : 'h-12'} bg-zinc-100 dark:bg-white/5 animate-pulse rounded`} />
    );
  }

  const popoverContent = (
    <div className="w-68 bg-white dark:bg-[#1C1F26] rounded-xl shadow-dropdown border border-slate-200/90 dark:border-white/10 p-1.5 z-50 flex flex-col max-h-[460px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {isImpersonating && (
        <div className="mb-1.5 p-2 rounded-lg bg-[#FF665E]/10 border border-[#FF665E]/25">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF665E]">
            <ShieldAlert size={12} />
            Impersonando espacio externo
          </div>
          <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200 truncate mt-0.5">
            {impersonatedInfo?.id === workspaceId && impersonatedInfo?.name
              ? impersonatedInfo.name
              : 'Espacio de otro usuario'}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {workspaces[0] && (
              <button
                type="button"
                onClick={() => {
                  const ownId = localStorage.getItem('lastActiveWorkspaceId');
                  const target = workspaces.find((w) => w.id === ownId) || workspaces[0];
                  handleSwitch(target.id);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-[#12A9A8] hover:bg-[#0e8f8e] text-white text-[10px] font-bold transition-colors cursor-pointer"
              >
                <LogOut size={11} />
                Ir a mi espacio
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                clearImpersonatedWorkspace();
                setIsOpen(false);
                navigate('/w/global/system-admin?tab=workspaces');
              }}
              className="px-2 py-1 rounded-md bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/15 text-slate-700 dark:text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer"
            >
              Super Panel
            </button>
          </div>
        </div>
      )}

      <div className="px-1.5 pt-1 pb-1.5">
        <div className="flex items-center justify-between mb-1.5 px-1.5">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {searchQuery.trim()
              ? 'Resultados'
              : isSystemAdmin
                ? 'Mis espacios de trabajo'
                : 'Espacios'}
          </p>
          <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
            {workspaces.length} en total
          </span>
        </div>

        {/* Search input if more than 4 workspaces */}
        {workspaces.length > 4 && (
          <div className="relative mb-1.5">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar espacio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 bg-slate-100/80 dark:bg-white/5 rounded-lg text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--lumins-accent)]/25 focus:bg-white transition-all"
            />
          </div>
        )}

        {/* Scrollable list with max height */}
        <div className="space-y-0.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-0.5">
          {visibleWorkspaces.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No se encontraron espacios</p>
          ) : (
            visibleWorkspaces.map(workspace => {
              const isCurrent = workspace.id === currentWorkspace?.id;
              const canManage = canManageWorkspace(workspace);

              return (
                <div
                  key={workspace.id}
                  className={`group/item flex items-center justify-between rounded-lg transition-all ${isCurrent
                    ? 'bg-slate-100/90 dark:bg-white/[0.07] text-slate-900 dark:text-zinc-100'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-300'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSwitch(workspace.id)}
                    className="flex-1 flex items-center gap-2.5 px-2 py-1.5 min-w-0 text-left cursor-pointer"
                  >
                    <div
                      className={`w-6 h-6 rounded-md ${isCurrent ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)]' : `${getColor(workspace.id)} text-white`} flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0`}
                    >
                      {getInitials(workspace.name)}
                    </div>
                    <span className={`text-xs truncate ${isCurrent ? 'font-semibold' : 'font-medium'}`}>
                      {workspace.name}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    {isCurrent && (
                      <Check size={14} className="text-[var(--lumins-accent-fg)] shrink-0" />
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(e, workspace)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 rounded-md transition-all cursor-pointer"
                        title="Propiedades del espacio"
                      >
                        <Settings size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

      {/* Footer Actions */}
      <div className="px-1 space-y-0.5">
        {canManageWorkspace(currentWorkspace) && (
          <button
            type="button"
            onClick={() => {
              if (currentWorkspace) {
                setWorkspaceToEdit(currentWorkspace);
                setEditModalOpen(true);
                setIsOpen(false);
              }
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sliders size={13} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
              <span>Propiedades del espacio</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-700">Editar</span>
          </button>
        )}

        <button
          onClick={() => {
            navigate('/workspaces');
            setIsOpen(false);
          }}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Grid size={13} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
            <span>Ver todos los espacios</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-slate-700">
            <span>{workspaces.length}</span>
            <ArrowRight size={11} />
          </div>
        </button>

        <button
          onClick={handleCreate}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 dark:text-zinc-200 hover:text-slate-900 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all font-semibold text-xs cursor-pointer group"
        >
          <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-white/10 text-[var(--lumins-accent-fg)] group-hover:bg-[var(--lumins-accent)] group-hover:text-[var(--lumins-accent-on)] flex items-center justify-center transition-colors">
            <Plus size={12} strokeWidth={2.5} />
          </div>
          <span>Crear nuevo espacio</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SmartPopover
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
        trigger={
          <button
            onClick={() => setIsOpen(!isOpen)}
            title={isCollapsed ? (currentWorkspace?.name || 'Espacios') : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2.5 py-1.5'} rounded-xl transition-all group w-full cursor-pointer ${isFloating ? 'hover:bg-white/10' : 'hover:bg-slate-100/80 dark:hover:bg-white/5 border border-transparent hover:border-slate-200/80 dark:hover:border-white/10'}`}
          >
            <div className={`w-7 h-7 rounded-lg ${isImpersonating ? 'bg-[#FF665E] text-white' : 'bg-gradient-to-br from-[var(--lumins-accent)] to-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)]'} flex-shrink-0 flex items-center justify-center text-[10px] font-black shadow-xs group-hover:scale-105 transition-transform`}>
              {isImpersonating
                ? 'IMP'
                : currentWorkspace
                  ? getInitials(currentWorkspace.name)
                  : 'LW'}
            </div>

            <div className={`flex items-center justify-between transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100 ml-2.5'}`}>
              <span className={`text-xs font-bold truncate ${isFloating ? 'text-white' : isImpersonating ? 'text-[#FF665E]' : 'text-slate-800 dark:text-zinc-100'}`}>
                {isImpersonating
                  ? (impersonatedInfo?.id === workspaceId && impersonatedInfo?.name
                      ? impersonatedInfo.name
                      : 'Impersonando espacio')
                  : (currentWorkspace?.name || 'Sin Espacios')}
              </span>
              <ChevronDown size={14} className={`${isFloating ? 'text-white/50' : 'text-slate-400 dark:text-zinc-500'} min-w-[14px]`} />
            </div>
          </button>
        }
        content={popoverContent}
      />

      {workspaceToEdit && (
        <EditWorkspaceModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setWorkspaceToEdit(null);
          }}
          workspace={workspaceToEdit}
          onWorkspaceUpdated={(updated) => {
            setWorkspaces(prev => prev.map(w => w.id === updated.id ? { ...w, ...updated } : w));
          }}
          onRequestDelete={(id, name) => {
            setWorkspaceToDelete({ id, name });
            setDeleteModalOpen(true);
          }}
        />
      )}

      {workspaceToDelete && (
        <DeleteWorkspaceModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          workspaceId={workspaceToDelete.id}
          workspaceName={workspaceToDelete.name}
        />
      )}
    </>
  );
};

export default WorkspaceSwitcher;
