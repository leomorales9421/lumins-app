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
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ onCreateClick, isCollapsed }) => {
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
    'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'
  ];

  const getColor = (id: string) => {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className={`w-full ${isCollapsed ? 'h-8 w-8' : 'h-12'} bg-white/5 animate-pulse rounded-xl`} />
    );
  }

  const popoverContent = (
    <div className="w-64 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-zinc-100 p-2 z-50 flex flex-col overflow-hidden">
      <div className="px-3 py-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
          Tus Espacios
        </p>
        
        <div className="space-y-1">
          {workspaces.map((workspace) => (
            <div key={workspace.id} className="relative group/item">
              <button
                onClick={() => handleSwitch(workspace.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                  workspace.id === workspaceId 
                    ? 'bg-purple-50 text-purple-700' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg ${getColor(workspace.id)} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {getInitials(workspace.name)}
                </div>
                <span className="flex-1 text-left text-[13px] font-bold truncate">
                  {workspace.name}
                </span>
                {workspace.id === workspaceId && (
                  <Check size={14} className="text-purple-600" />
                )}
              </button>
              
              {/* Delete button: only for owners */}
              {workspace.ownerId === user?.id && (
                <button
                  onClick={(e) => handleDeleteClick(e, workspace.id, workspace.name)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-all z-10"
                  title="Eliminar espacio"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-100 my-1" />

      <div className="px-1 mt-1">
        <button
          onClick={handleCreate}
          className="w-full flex items-center gap-3 p-2 rounded-xl text-[#6C5DD3] hover:bg-slate-50 transition-all font-bold text-[13px]"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
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
          className={`flex items-center gap-3 p-2 rounded-xl bg-[#F4F6F9] hover:bg-[#E5EAF2] border border-zinc-200 transition-all group
            ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full'}
          `}
        >
          <div className="w-8 h-8 rounded-lg bg-[#7A5AF8] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {currentWorkspace ? getInitials(currentWorkspace.name) : 'LW'}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-[13px] font-bold text-slate-900 truncate">
                  {currentWorkspace?.name || 'Sin Espacios'}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </>
          )}
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
