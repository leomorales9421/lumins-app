import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import CreateWorkspaceModal from '../CreateWorkspaceModal';
import CreateBoardModal from '../CreateBoardModal';
import PageTransitionWrapper from '../PageTransitionWrapper';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members?: { userId: string; role: string }[];
}

interface MainLayoutProps {}

const MainLayout: React.FC<MainLayoutProps> = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const location = useLocation();
  const isBoardView = location.pathname.startsWith('/boards/');
  const [boardBackground, setBoardBackground] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingBg, setIsLoadingBg] = useState(false);

  useEffect(() => {
    const handleBgChange = (e: any) => {
      const newBg = e.detail.background;
      
      if (newBg?.startsWith('http')) {
        setIsLoadingBg(true);
        const img = new Image();
        img.src = newBg;
        img.onload = () => {
          setBoardBackground(newBg);
          setIsLoadingBg(false);
        };
        img.onerror = () => {
          setBoardBackground(newBg);
          setIsLoadingBg(false);
        };
      } else {
        setBoardBackground(newBg);
        setIsLoadingBg(false);
      }
    };
    const handleToggleSidebar = () => {
      setIsSidebarOpen(prev => !prev);
    };
    window.addEventListener('set-board-background', handleBgChange);
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => {
      window.removeEventListener('set-board-background', handleBgChange);
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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
    
    window.addEventListener('workspace-changed', fetchWorkspaces);
    return () => window.removeEventListener('workspace-changed', fetchWorkspaces);
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
    <div 
      className={`flex flex-col min-h-[100dvh] overflow-hidden transition-all duration-700 relative ${!isBoardView ? 'bg-[#F4F6F9] dark:bg-[#13151A]' : boardBackground?.startsWith('http') ? 'bg-zinc-900' : (boardBackground || 'bg-zinc-900 dark:bg-[#13151A]')}`}
      style={isBoardView && boardBackground?.startsWith('http') ? { 
        backgroundImage: `url(${boardBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Polarized Filter (Contrast Shield) */}
      {isBoardView && boardBackground?.startsWith('http') && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />
      )}

      {/* Background will now load naturally without a full-screen blocking overlay */}


      {/* UI Content Layer */}
      <div className="flex flex-col h-screen overflow-hidden w-full relative z-10">
        <NavBar 
          user={user} 
          onCreateBoard={() => setShowCreateBoardModal(true)}
          onCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
          canCreateBoard={canCreateBoard}
          isBoardView={isBoardView}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Conditional behavior */}
          <Sidebar 
            onCreateWorkspace={() => setShowCreateWorkspaceModal(true)} 
            isFloating={isBoardView}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            logout={logout}
          />
          
          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <PageTransitionWrapper>
              <Outlet />
            </PageTransitionWrapper>
          </main>
        </div>
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
