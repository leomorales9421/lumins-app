import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import CreateWorkspaceModal from '../CreateWorkspaceModal';
import CreateBoardModal from '../CreateBoardModal';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members?: { userId: string; role: string }[];
}

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: { workspaces: Workspace[] } }>('/api/workspaces');
      setWorkspaces(response.data.workspaces || []);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Event listeners for global triggers
  useEffect(() => {
    const openBoard = () => setShowCreateBoardModal(true);
    const openWorkspace = () => setShowCreateWorkspaceModal(true);
    
    window.addEventListener('open-create-board', openBoard);
    window.addEventListener('open-create-workspace', openWorkspace);
    
    return () => {
      window.removeEventListener('open-create-board', openBoard);
      window.removeEventListener('open-create-workspace', openWorkspace);
    };
  }, []);

  const currentWorkspace = workspaces.find(w => w.id === workspaceId);
  
  // Permission Check: OWNER or ADMIN
  const canCreateBoard = currentWorkspace ? (
    currentWorkspace.ownerId === user?.id || 
    currentWorkspace.members?.some(m => m.userId === user?.id && (m.role === 'OWNER' || m.role === 'ADMIN'))
  ) : (workspaces.length > 0);

  const handleWorkspaceCreated = (newWorkspace: any) => {
    fetchWorkspaces();
    // Redirect logic is already in CreateWorkspaceModal, but we can double check here
  };

  const handleBoardCreated = () => {
    // Dispatch event so sub-pages can refresh
    window.dispatchEvent(new CustomEvent('board-created'));
    setShowCreateBoardModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F1F3] flex flex-col font-sans">
      <NavBar 
        user={user} 
        logout={logout} 
        onCreateBoard={() => setShowCreateBoardModal(true)}
        onCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
        canCreateBoard={canCreateBoard}
      />
      
      <div className="flex flex-1">
        <Sidebar onCreateWorkspace={() => setShowCreateWorkspaceModal(true)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>

      <CreateWorkspaceModal 
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
      />

      <CreateBoardModal
        isOpen={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onBoardCreated={handleBoardCreated}
        workspaces={workspaces}
        defaultWorkspaceId={workspaceId}
      />
    </div>
  );
};

export default MainLayout;
