import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
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

  const currentWorkspace = workspaces.find(w => w.id === workspaceId) || workspaces[0];

  const handleSwitch = (id: string) => {
    localStorage.setItem('lastActiveWorkspaceId', id);
    navigate(`/w/${id}/dashboard`);
    setIsOpen(false);
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

  if (isLoading) {
    return (
      <div className={`w-full ${isCollapsed ? 'h-8 w-8' : 'h-12'} bg-zinc-100 dark:bg-white/5 animate-pulse rounded-xl`} />
    );
  }

  const popoverContent = (
    <div className="w-64 bg-white dark:bg-[#1C1F26] rounded-xl shadow-dropdown border border-zinc-200 dark:border-white/10 p-2 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="px-3 py-2">
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-2">
          Tus Espacios
        </p>
        
        <div className="space-y-1">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="relative group/item">
              <button
                onClick={() => handleSwitch(workspace.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                  workspace.id === workspaceId 
                    ? 'bg-zinc-100 dark:bg-white/5 text-[#6C5DD3]' 
                    : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg ${getColor(workspace.id)} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                  {getInitials(workspace.name)}
                </div>
                <span className="flex-1 text-left text-[13px] font-bold truncate">
                  {workspace.name}
                </span>
                {workspace.id === workspaceId && (
                  <Check size={14} className="text-[#6C5DD3]" />
                )}
              </button>
              
              {/* Delete button: only for owners */}
              {workspace.ownerId === user?.id && (
                <button
                  onClick={(e) => handleDeleteClick(e, workspace.id, workspace.name)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all z-10"
                  title="Eliminar espacio"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />

      <div className="px-1 mt-1">
        <button
          onClick={handleCreate}
          className="w-full flex items-center gap-3 p-2 rounded-lg text-[#6C5DD3] hover:bg-zinc-50 dark:hover:bg-white/5 transition-all font-bold text-[13px]"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
            <Plus size={16} />
          </div>
          Crear nuevo espacio
        </button>
      </div>
    </div>
  );

  return (
    <>
    <SmartPopover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <button 
          onClick={() => setIsOpen(!isOpen)}
          title={isCollapsed ? (currentWorkspace?.name || 'Espacios') : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-xl transition-all group w-full ${isFloating ? 'hover:bg-white/10' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#6C5DD3] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
            {currentWorkspace ? getInitials(currentWorkspace.name) : 'LW'}
          </div>
          
          <div className={`flex items-center justify-between transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100 ml-3'}`}>
            <span className={`text-sm font-bold truncate ${isFloating ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {currentWorkspace?.name || 'Sin Espacios'}
            </span>
            <ChevronDown size={16} className={`${isFloating ? 'text-white/50' : 'text-zinc-500 dark:text-zinc-400'} min-w-[16px]`} />
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
