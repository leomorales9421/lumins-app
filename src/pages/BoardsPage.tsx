import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board } from '../types/board';
import Button from '../components/ui/Button';
import BoardCard from '../components/BoardCard';
import MembersModal from '../components/MembersModal';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter, ChevronDown, Layout, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { Skeleton } from '../components/ui/Skeleton';
const BoardsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: string, name: string, members?: { role: string }[] }[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem('lumins_boards_per_page');
    if (saved) return Number(saved);
    if (user?.preferences?.boardsPerPage) return Number(user.preferences.boardsPerPage);
    return 10;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaginating, setIsPaginating] = useState(false);

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const lowerQuery = searchQuery.toLowerCase();
    return boards.filter(b => b.name.toLowerCase().includes(lowerQuery));
  }, [boards, searchQuery]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredBoards.length / itemsPerPage));
  const currentBoards = useMemo(
    () => {
      if (itemsPerPage === -1) return filteredBoards;
      return filteredBoards.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    },
    [filteredBoards, page, itemsPerPage]
  );

  const loadData = useCallback(async () => {
    if (workspaces.length === 0) setIsLoadingWorkspaces(true);
    if (boards.length === 0) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const boardsUrl = workspaceId ? `/api/boards?workspaceId=${workspaceId}` : '/api/boards';
      const [wsRes, boardsRes] = await Promise.all([
        apiClient.get<{ data: { workspaces: { id: string, name: string, members?: { role: string }[] }[] } }>('/api/workspaces'),
        apiClient.get<{ data: { boards: Board[] } }>(boardsUrl)
      ]);
      setWorkspaces(wsRes.data.workspaces || []);
      setBoards(boardsRes.data.boards || []);
    } catch (err) {
      console.error('Failed to load boards/workspaces data', err);
    } finally {
      setIsLoadingWorkspaces(false);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => { 
    loadData();
  }, [loadData]);

  // Reset to page 1 when boards list changes
  useEffect(() => {
    setPage(1);
  }, [filteredBoards.length]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setIsPaginating(true);
    setPage(newPage);
    setTimeout(() => setIsPaginating(false), 400);
  }, [totalPages]);

  // Listen for board creation to refresh
  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener('board-created', handleRefresh);
    window.addEventListener('lumins:board-updated', handleRefresh);
    window.addEventListener('workspace-changed', handleRefresh);
    return () => {
      window.removeEventListener('board-created', handleRefresh);
      window.removeEventListener('lumins:board-updated', handleRefresh);
      window.removeEventListener('workspace-changed', handleRefresh);
    };
  }, [loadData]);

  useEffect(() => {
    if (!isLoadingWorkspaces && !workspaceId && workspaces.length > 0) {
      const lastId = localStorage.getItem('lastActiveWorkspaceId');
      const targetId = workspaces.find(w => w.id === lastId)?.id || workspaces[0].id;
      navigate(`/w/${targetId}/dashboard`, { replace: true });
    }
  }, [isLoadingWorkspaces, workspaceId, workspaces, navigate]);

  return (
    <div className="flex-1 flex flex-col font-sans">
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto w-full">
          
          {(isLoadingWorkspaces || (workspaceId && isLoading)) ? (
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
                    {isRefreshing && (
                       <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-[#6C5DD3]/5 border border-[#6C5DD3]/10 text-[#6C5DD3] animate-in fade-in zoom-in duration-300 w-fit">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Actualizando</span>
                       </div>
                    )}
                 </div>

                 <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-1 shadow-soft">
                       <div className="relative flex items-center border-r border-zinc-200 dark:border-white/10 mr-1 pr-1">
                         <Search size={14} className="absolute left-2.5 text-zinc-400" />
                         <input 
                           type="text"
                           placeholder="Buscar tablero..."
                           value={searchQuery}
                           onChange={(e) => {
                             setSearchQuery(e.target.value);
                             setPage(1);
                           }}
                           className="pl-8 pr-3 py-2 bg-transparent text-[12px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none w-[130px] sm:w-[160px] transition-all focus:w-[160px] sm:focus:w-[200px]"
                         />
                       </div>
                       <div className="relative flex items-center">
                         <select 
                           value={itemsPerPage}
                           onChange={async (e) => {
                             const val = Number(e.target.value);
                             setItemsPerPage(val);
                             localStorage.setItem('lumins_boards_per_page', val.toString());
                             setPage(1);
                             
                             if (user) {
                               try {
                                 const updatedPreferences = { ...(user.preferences || {}), boardsPerPage: val };
                                 await apiClient.patch('/api/auth/me', { preferences: updatedPreferences });
                               } catch (err) {
                                 console.error('Failed to save preference to DB', err);
                               }
                             }
                           }}
                           className="appearance-none bg-zinc-100 dark:bg-white/5 rounded pl-3 pr-8 py-2 text-[12px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none focus:ring-0 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                         >
                           <option value={10} className="bg-white dark:bg-[#1C1F26] text-zinc-700 dark:text-zinc-300">10 tableros</option>
                           <option value={20} className="bg-white dark:bg-[#1C1F26] text-zinc-700 dark:text-zinc-300">20 tableros</option>
                           <option value={50} className="bg-white dark:bg-[#1C1F26] text-zinc-700 dark:text-zinc-300">50 tableros</option>
                           <option value={-1} className="bg-white dark:bg-[#1C1F26] text-zinc-700 dark:text-zinc-300">Todos</option>
                         </select>
                         <ChevronDown size={14} className="absolute right-2 pointer-events-none text-zinc-500" />
                       </div>
                       <button className="px-3 sm:px-4 py-2 text-[12px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#6C5DD3] dark:hover:text-[#6C5DD3] transition-colors flex items-center gap-2 border-l border-zinc-200 dark:border-white/10 ml-1">
                         <Filter size={14} />
                         <span className="hidden xs:inline">Filtros</span>
                       </button>
                       {(workspaces.find(w => w.id === workspaceId)?.members?.[0]?.role === 'OWNER' || workspaces.find(w => w.id === workspaceId)?.members?.[0]?.role === 'ADMIN') && (
                        <button 
                          onClick={() => setShowInviteModal(true)}
                          className="px-3 sm:px-4 py-2 text-[12px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#6C5DD3] dark:hover:text-[#6C5DD3] transition-colors flex items-center gap-2"
                        >
                          <Users size={14} />
                          <span>Miembros</span>
                        </button>
                       )}
                       <button 
                         onClick={() => window.dispatchEvent(new CustomEvent('open-trello-import'))}
                         className="px-3 sm:px-4 py-2 text-[12px] font-bold text-[#0079BF] hover:bg-[#0079BF]/5 dark:hover:bg-[#0079BF]/10 transition-all flex items-center gap-2 border-l border-zinc-200 dark:border-white/10 group"
                       >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                           <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z"/>
                         </svg>
                         <span>Importar Trello</span>
                       </button>

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
                      <div className="flex gap-4">
                         <Button 
                          onClick={() => window.dispatchEvent(new CustomEvent('open-create-board'))}
                          variant="outlined"
                          className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-[#6C5DD3] hover:text-[#6C5DD3] dark:hover:border-[#6C5DD3] dark:hover:text-[#6C5DD3]"
                         >
                           Crear tablero
                         </Button>
                         <Button 
                          onClick={() => window.dispatchEvent(new CustomEvent('open-trello-import'))}
                          variant="outlined"
                          className="border-[#0079BF]/30 text-[#0079BF] hover:bg-[#0079BF] hover:text-white dark:hover:bg-[#0079BF] dark:hover:text-white transition-all flex items-center gap-2"
                         >
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                             <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z"/>
                           </svg>
                           Importar de Trello
                         </Button>
                      </div>

                 </div>
               ) : (
                 <>
                   {/* Pagination — Top */}
                   {totalPages > 1 && (
                     <div className="flex justify-center mb-6">
                       <PaginationControls
                         page={page}
                         totalPages={totalPages}
                         onPageChange={goToPage}
                       />
                     </div>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-4 min-h-[300px]">
                     <AnimatePresence mode="popLayout">
                       {isPaginating ? (
                         <div className="col-span-full flex items-center justify-center py-20">
                           <Loader2 size={32} className="animate-spin text-[#6C5DD3]" />
                         </div>
                       ) : (
                         currentBoards.map((board, index) => (
                           <motion.div
                             key={board.id}
                             initial={{ opacity: 0, y: 16 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ duration: 0.35, delay: index * 0.04 }}
                           >
                             <BoardCard board={board} />
                           </motion.div>
                         ))
                       )}
                     </AnimatePresence>
                   </div>


                 </>
               )}
            </>
          )}
        </div>
      </main>

      {workspaces.length > 0 && (
        <MembersModal 
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          workspaceId={workspaceId || workspaces[0].id}
          workspaceName={workspaces.find(w => w.id === workspaceId)?.name || workspaces[0].name}
        />
      )}
    </div>
  );
};

function PaginationControls({ page, totalPages, onPageChange }: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const range: number[] = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }, [page, totalPages]);

  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-[#1C1F26] p-1.5 rounded border border-zinc-200 dark:border-white/10 shadow-soft text-[13px] font-bold">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={14} />
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="w-8 h-8 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 rounded transition-colors">1</button>
            {pages[0] > 2 && <span className="px-1 text-zinc-400">...</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded transition-colors ${
              p === page
                ? 'bg-[#6C5DD3] text-white shadow-sm'
                : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-zinc-400">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="w-8 h-8 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 rounded transition-colors">{totalPages}</button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Siguiente
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default BoardsPage;
