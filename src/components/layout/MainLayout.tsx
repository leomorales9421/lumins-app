import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import CreateWorkspaceModal from '../CreateWorkspaceModal';
import CreateBoardModal from '../CreateBoardModal';
import TrelloImportModal from '../TrelloImportModal';
import PageTransitionWrapper from '../PageTransitionWrapper';
import { motion } from 'framer-motion';

import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  DEFAULT_BOARD_BACKGROUND,
  normalizeBoardBackground,
  preloadImageUrl,
  resolveBoardBackground,
} from '../../lib/board-backgrounds';

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
  const [showTrelloImportModal, setShowTrelloImportModal] = useState(false);

  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const location = useLocation();
  const isBoardView = location.pathname.startsWith('/boards/');
  const [boardBackground, setBoardBackground] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingBg, setIsLoadingBg] = useState(false);
  const bgRequestRef = useRef(0);
  const resolvedBackground = resolveBoardBackground(boardBackground);

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
    const handleBgChange = (e: any) => {
      const newBg = normalizeBoardBackground(e.detail.background);
      const requestId = ++bgRequestRef.current;

      const resolved = resolveBoardBackground(newBg);

      if (resolved.kind === 'none') {
        setIsLoadingBg(false);
        setBoardBackground(null);
        return;
      }

      if (resolved.kind === 'image') {
        setIsLoadingBg(true);
        void preloadImageUrl(resolved.value).then((ok) => {
          if (bgRequestRef.current !== requestId) return;
          setBoardBackground(ok ? resolved.value : DEFAULT_BOARD_BACKGROUND);
          setIsLoadingBg(false);
        });
        return;
      }

      setIsLoadingBg(false);
      setBoardBackground(resolved.rawValue);
    };
    const handlePermissionUpdate = (e: any) => {
      const { type, resourceId, newRole } = e.detail;
      console.log('MainLayout: Permission update received', { type, resourceId, newRole });
      
      if (type === 'WORKSPACE_REMOVED') {
        toast.error('Acceso denegado', { 
          description: 'Has sido eliminado de este espacio de trabajo.' 
        });

        // Clean up last active workspace if it was the removed one
        if (localStorage.getItem('lastActiveWorkspaceId') === resourceId) {
          localStorage.removeItem('lastActiveWorkspaceId');
        }

        // If we are currently viewing the removed workspace, go to /app
        // BoardsPage will then redirect to the next available workspace
        if (workspaceId === resourceId) {
          navigate('/app', { replace: true });
        }
      } else if (type === 'BOARD_REMOVED') {
        toast.error('Acceso denegado', { 
          description: 'Has sido eliminado de este tablero.' 
        });
        // Check if we are currently on that board
        if (location.pathname.includes(`/boards/${resourceId}`)) {
          navigate('/app', { replace: true });
        }
      } else {
        toast.info('Permisos actualizados', { 
          description: `Tus permisos en ${type === 'WORKSPACE' ? 'el espacio de trabajo' : 'el tablero'} han cambiado.` 
        });
      }

      // Always refresh workspaces and notify other components
      fetchWorkspaces();
      window.dispatchEvent(new CustomEvent('workspace-changed'));
      window.dispatchEvent(new CustomEvent('permission-changed'));
    };

    const handleToggleSidebar = () => {
      setIsSidebarOpen(prev => !prev);
    };

    window.addEventListener('set-board-background', handleBgChange);
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    window.addEventListener('lumins:permission-updated', handlePermissionUpdate);

    return () => {
      window.removeEventListener('set-board-background', handleBgChange);
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
      window.removeEventListener('lumins:permission-updated', handlePermissionUpdate);
    };
  }, [workspaceId, navigate, fetchWorkspaces]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Ensure stale board background is cleared outside board routes.
  useEffect(() => {
    if (!isBoardView) {
      bgRequestRef.current += 1;
      setBoardBackground(null);
      setIsLoadingBg(false);
    }
  }, [isBoardView]);


  useEffect(() => {
    fetchWorkspaces();
    
    window.addEventListener('workspace-changed', fetchWorkspaces);
    return () => window.removeEventListener('workspace-changed', fetchWorkspaces);
  }, [fetchWorkspaces]);

  // Event listeners for global triggers
  useEffect(() => {
    const openBoard = () => setShowCreateBoardModal(true);
    const openWorkspace = () => setShowCreateWorkspaceModal(true);
    const openTrello = () => setShowTrelloImportModal(true);
    
    window.addEventListener('open-create-board', openBoard);
    window.addEventListener('open-create-workspace', openWorkspace);
    window.addEventListener('open-trello-import', openTrello);
    
    return () => {
      window.removeEventListener('open-create-board', openBoard);
      window.removeEventListener('open-create-workspace', openWorkspace);
      window.removeEventListener('open-trello-import', openTrello);
    };

  }, []);

  const currentWorkspace = workspaces.find(w => w.id === workspaceId);
  
  // Permission Check: OWNER or ADMIN
  const canCreateBoard = currentWorkspace ? (
    currentWorkspace.ownerId === user?.id || 
    !!currentWorkspace.members?.some(m => m.userId === user?.id && (m.role === 'OWNER' || m.role === 'ADMIN'))
  ) : (workspaces.length > 0);

  const handleWorkspaceCreated = (newWorkspace: any) => {
    fetchWorkspaces();
    window.dispatchEvent(new CustomEvent('workspace-changed'));
  };

  const handleBoardCreated = () => {
    // Dispatch event so sub-pages can refresh
    window.dispatchEvent(new CustomEvent('board-created'));
    setShowCreateBoardModal(false);
    setShowTrelloImportModal(false);
  };


  return (
    <div 
      className={`flex flex-col min-h-[100dvh] overflow-hidden transition-all duration-700 relative ${!isBoardView ? 'bg-[#F4F6F9] dark:bg-[#13151A]' : resolvedBackground.kind === 'image' ? 'bg-zinc-900' : resolvedBackground.kind === 'preset' ? resolvedBackground.value : DEFAULT_BOARD_BACKGROUND}`}
      style={isBoardView && resolvedBackground.kind === 'image' ? {
        backgroundImage: `url(${resolvedBackground.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Polarized Filter (Contrast Shield) */}
      {isBoardView && resolvedBackground.kind === 'image' && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />
      )}

      {/* Soft Glass Effect & Lava Animation for Preset Colors to reduce visual weight and add life */}
      {isBoardView && resolvedBackground.kind === 'preset' && resolvedBackground.value !== DEFAULT_BOARD_BACKGROUND && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Animated Lava Blobs (Lava lamp effect blending with underlying preset gradient) */}
          {resolvedBackground.lava && (
            <div className="absolute inset-0 opacity-100 mix-blend-overlay pointer-events-none overflow-hidden">
              {/* Rising White Blob */}
              <motion.div
                animate={{ 
                  y: ['80%', '-40%', '80%'], 
                  x: ['-10%', '20%', '-10%'],
                  scale: [1, 1.5, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[5%] w-[45%] h-[45%] bg-white/40 dark:bg-white/15 rounded-[40%_60%_70%_30%] blur-[80px] will-change-transform"
              />
              {/* Falling Dark Blob */}
              <motion.div
                animate={{ 
                  y: ['-40%', '80%', '-40%'], 
                  x: ['20%', '-10%', '20%'],
                  scale: [1.2, 0.8, 1.2],
                  rotate: [360, 180, 0]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-[10%] w-[50%] h-[50%] bg-black/30 dark:bg-black/50 rounded-[60%_40%_30%_70%] blur-[90px] will-change-transform"
              />
              {/* Floating White Blob 2 */}
              <motion.div
                animate={{ 
                  y: ['60%', '-20%', '60%'], 
                  x: ['10%', '-20%', '10%'],
                  scale: [0.9, 1.3, 0.9],
                  rotate: [0, -180, -360]
                }}
                transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-[30%] w-[40%] h-[40%] bg-white/30 dark:bg-white/10 rounded-[30%_70%_70%_30%] blur-[70px] will-change-transform"
              />
              {/* Floating Dark Blob 2 */}
              <motion.div
                animate={{ 
                  y: ['-20%', '60%', '-20%'], 
                  x: ['-20%', '10%', '-20%'],
                  scale: [1.3, 1, 1.3],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[30%] w-[55%] h-[55%] bg-black/20 dark:bg-black/40 rounded-[70%_30%_50%_50%] blur-[80px] will-change-transform"
              />
            </div>
          )}

          {/* Frosted Glass Overlay */}
          <div className={`absolute inset-0 backdrop-blur-[60px] ${resolvedBackground.tone === 'light' ? 'bg-white/50 dark:bg-white/20' : 'bg-black/30 dark:bg-[#13151A]/60'}`} />
          
          {/* Subtle static vignette */}
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.4) 0%, transparent 50%)'
            }}
          />
        </div>
      )}

      {isBoardView && isLoadingBg && (
        <div className="fixed right-4 bottom-4 z-[120] pointer-events-none rounded-full border border-white/10 bg-[#1C1F26]/85 backdrop-blur-md px-3 py-2 text-white shadow-2xl flex items-center gap-2">
          <Loader2 size={14} className="animate-spin text-[#8E82E3]" />
          <span className="text-[11px] font-bold tracking-wide">Cargando fondo...</span>
        </div>
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

      <TrelloImportModal
        isOpen={showTrelloImportModal}
        onClose={() => setShowTrelloImportModal(false)}
      />

    </div>

  );
};

export default MainLayout;
