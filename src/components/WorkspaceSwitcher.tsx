import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Check, Plus, Trash2, Search, Grid, ArrowRight } from 'lucide-react';
import apiClient from '../lib/api-client';
import SmartPopover from './SmartPopover';
import DeleteWorkspaceModal from './DeleteWorkspaceModal';
import { useAuth } from '../contexts/AuthContext';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
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

  const activeWorkspaceId = workspaceId || localStorage.getItem('lastActiveWorkspaceId');
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

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
    } catch (e) {}
  };

  const handleSwitch = (id: string) => {
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const colors = [
    'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'
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
    } catch (e) {}

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
    <div className="w-72 bg-white dark:bg-[#1C1F26] rounded-xl shadow-dropdown border border-zinc-200 dark:border-white/10 p-2 z-50 flex flex-col max-h-[460px] overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="px-2 pt-1.5 pb-2">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            {searchQuery.trim() ? 'Resultados' : 'Tus Espacios Frecuentes'}
          </p>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
            {workspaces.length} en total
          </span>
        </div>

        {/* Search input if more than 4 workspaces */}
        {workspaces.length > 4 && (
          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar espacio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#6C5DD3]"
            />
          </div>
        )}

        {/* Scrollable list with max height */}
        <div className="space-y-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-0.5">
          {visibleWorkspaces.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">No se encontraron espacios</p>
          ) : (
            visibleWorkspaces.map(workspace => (
              <div key={workspace.id} className="relative group/item">
                <button
                  onClick={() => handleSwitch(workspace.id)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                    workspace.id === currentWorkspace?.id
                      ? 'bg-zinc-100 dark:bg-white/5 text-[#6C5DD3]'
                      : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg ${getColor(workspace.id)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0`}
                  >
                    {getInitials(workspace.name)}
                  </div>
                  <span className="flex-1 text-left text-xs font-bold truncate">
                    {workspace.name}
                  </span>
                  {workspace.id === currentWorkspace?.id && (
                    <Check size={14} className="text-[#6C5DD3] shrink-0" />
                  )}
                </button>

                {/* Delete button: only for owners */}
                {workspace.ownerId === user?.id && (
                  <button
                    onClick={e => handleDeleteClick(e, workspace.id, workspace.name)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-all z-10"
                    title="Eliminar espacio"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />

      {/* Footer Actions */}
      <div className="px-1 space-y-1">
        <button
          onClick={() => {
            navigate('/workspaces');
            setIsOpen(false);
          }}
          className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-[#6C5DD3] hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Grid size={14} className="text-zinc-400 group-hover:text-[#6C5DD3] transition-colors" />
            <span>Ver todos los espacios</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-[#6C5DD3]">
            <span>{workspaces.length}</span>
            <ArrowRight size={12} />
          </div>
        </button>

        <button
          onClick={handleCreate}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg text-[#6C5DD3] hover:bg-[#6C5DD3]/5 transition-all font-bold text-xs"
        >
          <div className="w-6 h-6 rounded-md bg-[#6C5DD3]/10 flex items-center justify-center">
            <Plus size={14} />
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
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3 py-2'} rounded transition-all group w-full ${isFloating ? 'hover:bg-white/10' : 'hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/10'}`}
        >
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-violet-500 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black shadow-lg group-hover:scale-105 transition-transform">
            {currentWorkspace ? getInitials(currentWorkspace.name) : 'LW'}
          </div>
          
          <div className={`flex items-center justify-between transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100 ml-3'}`}>
            <span className={`text-[13px] font-bold truncate ${isFloating ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'}`}>
              {currentWorkspace?.name || 'Sin Espacios'}
            </span>
            <ChevronDown size={14} className={`${isFloating ? 'text-white/50' : 'text-zinc-400 dark:text-zinc-500'} min-w-[14px]`} />
          </div>
        </button>
      }
      content={popoverContent}
    />
    
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
