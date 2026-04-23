import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import apiClient from '../lib/api-client';
import type { Board } from '../types/board';
import Button from '../components/ui/Button';
import BoardCard from '../components/BoardCard';
import InviteMembersModal from '../components/InviteMembersModal';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter, ChevronDown, Layout } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const BoardsPage: React.FC = () => {
  const { user } = useAuth();
  const { isGodMode } = usePermission();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: string, name: string, members?: { role: string }[] }[]>([]);

  const fetchWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    try {
      const response = await apiClient.get<{ data: { workspaces: { id: string, name: string }[] } }>('/api/workspaces');
      setWorkspaces(response.data.workspaces || []);
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    // Removed setBoards([]) to prevent flickering and excessive skeletons
    // This allows showing stale data while loading new data.
    try {
      const url = workspaceId ? `/api/boards?workspaceId=${workspaceId}` : '/api/boards';
      const response = await apiClient.get<{ data: { boards: Board[] } }>(url);
      setBoards(response.data.boards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { 
    fetchBoards(); 
    fetchWorkspaces();
  }, [fetchBoards, fetchWorkspaces]);

  // Listen for board creation to refresh
  useEffect(() => {
    const handleRefresh = () => fetchBoards();
    window.addEventListener('board-created', handleRefresh);
    window.addEventListener('lumins:board-updated', handleRefresh);
    return () => {
      window.removeEventListener('board-created', handleRefresh);
      window.removeEventListener('lumins:board-updated', handleRefresh);
    };
  }, [fetchBoards]);

  useEffect(() => {
    if (!isLoading && !workspaceId && workspaces.length > 0) {
      const lastId = localStorage.getItem('lastActiveWorkspaceId');
      const targetId = workspaces.find(w => w.id === lastId)?.id || workspaces[0].id;
      navigate(`/w/${targetId}/dashboard`, { replace: true });
    }
  }, [isLoading, workspaceId, workspaces, navigate]);

  return (
    <div className="flex-1 flex flex-col font-sans">
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto w-full">
          
          {(isLoading || isLoadingWorkspaces) ? (
            <div className="flex-1">
               {/* Header Skeleton */}
               <div className="flex flex-col gap-1 mb-8">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-9 w-64" />
               </div>
               
               {/* Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-5 h-48 shadow-soft flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                         <Skeleton className="w-10 h-10 rounded" />
                         <Skeleton className="w-6 h-6 rounded" />
                      </div>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="mt-auto flex gap-2">
                         <Skeleton className="h-4 w-12" />
                         <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          ) : workspaces.length === 0 ? (
            <WorkspaceEmptyState onCreateClick={() => {
              // Trigger global workspace creation
              window.dispatchEvent(new CustomEvent('open-create-workspace'));
            }} />
          ) : (
            <>
              {/* Header: ClickUp Style */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[#6C5DD3] mb-1">
                       <Layout size={18} strokeWidth={2.5} />
                       <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Panel de Control</span>
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Tus Proyectos</h1>
                 </div>

                 <div className="flex items-center gap-3">
                    <div className="hidden sm:flex bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-1 shadow-soft">
                       <button className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded text-[12px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                         <Filter size={14} />
                         Todos
                         <ChevronDown size={14} />
                       </button>
                       {(isGodMode || workspaces.find(w => w.id === workspaceId)?.members?.[0]?.role === 'OWNER' || workspaces.find(w => w.id === workspaceId)?.members?.[0]?.role === 'ADMIN') && (
                        <button 
                          onClick={() => setShowInviteModal(true)}
                          className="px-4 py-2 text-[12px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#6C5DD3] dark:hover:text-[#6C5DD3] transition-colors flex items-center gap-2"
                        >
                          <Users size={14} />
                          Miembros
                        </button>
                       )}
                    </div>
                 </div>
              </div>

               {/* Board Grid */}
               {boards.length === 0 ? (
                 <div className="bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-20 text-center flex flex-col items-center shadow-soft">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
                       <Layout size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No hay proyectos activos</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6">Comienza creando tu primer tablero para organizar el trabajo.</p>
                    <Button 
                     onClick={() => window.dispatchEvent(new CustomEvent('open-create-board'))}
                     variant="outlined"
                     className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-[#6C5DD3] hover:text-[#6C5DD3] dark:hover:border-[#6C5DD3] dark:hover:text-[#6C5DD3]"
                    >
                      Crear tablero
                    </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
                  <AnimatePresence mode="popLayout">
                    {boards.map((board, index) => (
                      <motion.div
                        key={board.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.04 }}
                      >
                        <BoardCard board={board} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

               {/* Pagination */}
               {boards.length > 8 && (
                 <div className="flex justify-center mt-10">
                   <div className="flex items-center gap-1.5 bg-white dark:bg-[#1C1F26] p-1.5 rounded border border-zinc-200 dark:border-white/10 shadow-soft text-[13px] font-bold">
                      <button className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30">Prev</button>
                      <div className="flex items-center gap-1">
                         <button className="w-8 h-8 bg-[#6C5DD3] text-white rounded shadow-sm">1</button>
                         <button className="w-8 h-8 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 rounded transition-colors">2</button>
                      </div>
                      <button className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Next</button>
                   </div>
                 </div>
               )}
            </>
          )}
        </div>
      </main>

      {workspaces.length > 0 && (
        <InviteMembersModal 
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          workspaceId={workspaceId || workspaces[0].id}
          workspaceName={workspaces.find(w => w.id === workspaceId)?.name || workspaces[0].name}
        />
      )}
    </div>
  );
};

export default BoardsPage;
