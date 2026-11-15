import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board } from '../types/board';
import Button from '../components/ui/Button';
import BoardCard, { getStarredBoardIds } from '../components/BoardCard';
import MembersModal from '../components/MembersModal';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter, ChevronDown, Loader2, ChevronLeft, ChevronRight, Search, Check, Star, Archive, RotateCcw, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { LuminsBoardIcon } from '../components/icons/LuminsIcons';
import Badge from '../components/ui/Badge';
import { useModuleLoading } from '../contexts/NavigationLoaderContext';

const BoardsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [workspaces, setWorkspaces] = useState<{ id: string, name: string, members?: { role: string }[] }[]>([]);
  const isRedirectingToWorkspace = !workspaceId && !isLoadingWorkspaces && workspaces.length > 0;
  useModuleLoading(isLoadingWorkspaces || Boolean(workspaceId && isLoading) || isRedirectingToWorkspace, 'boards-page');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem('lumins_boards_per_page');
    if (saved) return Number(saved);
    if (user?.preferences?.boardsPerPage) return Number(user.preferences.boardsPerPage);
    return 10;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaginating, setIsPaginating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'WORKSPACE' | 'PRIVATE'>('ALL');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'cards'>('recent');
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [archivedBoards, setArchivedBoards] = useState<Board[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [restoringBoardId, setRestoringBoardId] = useState<string | null>(null);

  const fetchArchivedBoards = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoadingArchived(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: { boards: Board[] } }>(
        `/api/boards?workspaceId=${workspaceId}&archived=true`
      );
      setArchivedBoards(res.data?.boards || []);
    } catch {
      toast.error('No se pudieron cargar los tableros archivados');
    } finally {
      setIsLoadingArchived(false);
    }
  }, [workspaceId]);

  const handleRestoreArchivedBoard = async (boardIdToRestore: string, boardName: string) => {
    setRestoringBoardId(boardIdToRestore);
    try {
      await apiClient.patch(`/api/boards/${boardIdToRestore}/unarchive`);
      toast.success(`Tablero "${boardName}" restaurado`);
      setArchivedBoards((prev) => prev.filter((b) => b.id !== boardIdToRestore));
      window.dispatchEvent(new CustomEvent('lumins:board-updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo restaurar el tablero');
    } finally {
      setRestoringBoardId(null);
    }
  };

  const activeFiltersCount =
    (visibilityFilter !== 'ALL' ? 1 : 0) + (onlyStarred ? 1 : 0) + (sortBy !== 'recent' ? 1 : 0);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isFilterOpen]);

  const [starredIds, setStarredIds] = useState<string[]>(() => getStarredBoardIds());

  useEffect(() => {
    const syncStarred = () => setStarredIds(getStarredBoardIds());
    window.addEventListener('lumins:starred-updated', syncStarred);
    return () => window.removeEventListener('lumins:starred-updated', syncStarred);
  }, []);

  const filteredBoards = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();
    const result = boards.filter((b) => {
      if (lowerQuery && !b.name.toLowerCase().includes(lowerQuery)) return false;
      if (visibilityFilter !== 'ALL' && b.visibility !== visibilityFilter) return false;
      if (onlyStarred && !b.starred && !starredIds.includes(b.id)) return false;
      return true;
    });

    const isStarred = (b: Board) => Boolean(b.starred) || starredIds.includes(b.id);

    return [...result].sort((a, b) => {
      const starDiff = Number(isStarred(b)) - Number(isStarred(a));
      if (starDiff !== 0) return starDiff;
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'es');
      }
      if (sortBy === 'cards') {
        return (b._count?.cards || 0) - (a._count?.cards || 0);
      }
      return 0;
    });
  }, [boards, searchQuery, visibilityFilter, onlyStarred, sortBy, starredIds]);

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
    <div className="flex-1 flex flex-col font-sans min-w-0 w-full overflow-x-hidden">
      <main className="flex-1 p-3.5 sm:p-6 lg:p-10 min-w-0 w-full">
        <div className="max-w-[1600px] mx-auto w-full min-w-0">
          
          {(isLoadingWorkspaces || (workspaceId && isLoading)) ? null : workspaces.length === 0 ? (
            <WorkspaceEmptyState onCreateClick={() => {
              // Trigger onboarding flow for new users
              window.dispatchEvent(new CustomEvent('open-onboarding'));
            }} />
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-7 w-full min-w-0">
                 <div className="flex flex-col gap-1 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-[#0E8786] dark:text-[#12A9A8] mb-0.5">
                       <LuminsBoardIcon size={16} />
                       <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Panel de Control</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">Tus Proyectos</h1>
                    {isRefreshing && (
                       <Badge variant="dot" tone="teal" pulse className="mt-1 w-fit">
                          Actualizando
                       </Badge>
                    )}
                 </div>

                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto min-w-0">
                    {/* Search bar (small) */}
                    <div className="relative flex items-center h-9 bg-white dark:bg-[#212632] rounded-xl border border-slate-200/90 dark:border-white/10 px-3 shadow-xs focus-within:border-[var(--lumins-accent)] focus-within:ring-2 focus-within:ring-[var(--lumins-accent)]/15 transition-all w-full sm:w-[210px]">
                      <Search size={14} className="text-slate-400 mr-2 shrink-0" />
                      <input 
                        type="text"
                        placeholder="Buscar tablero..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>

                    {/* Action buttons row - small & rounded-xl */}
                    <div className="flex items-center gap-1.5 overflow-x-auto sm:overflow-visible no-scrollbar py-0.5 -mx-1 px-1 min-w-0">
                      <div className="relative flex items-center shrink-0">
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
                          className="appearance-none h-9 bg-white dark:bg-[#212632] border border-slate-200/90 dark:border-white/10 rounded-xl pl-3 pr-8 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer focus:outline-none focus:border-[var(--lumins-accent)] shadow-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                        >
                          <option value={10}>10 tableros</option>
                          <option value={20}>20 tableros</option>
                          <option value={50}>50 tableros</option>
                          <option value={-1}>Todos</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 pointer-events-none text-slate-500" />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsArchivedModalOpen(true);
                          fetchArchivedBoards();
                        }}
                        className="shrink-0 h-9 px-3 text-xs font-semibold rounded-xl border bg-white dark:bg-[#212632] border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-zinc-100 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Ver tableros archivados"
                      >
                        <Archive size={13} />
                        <span>Archivados</span>
                      </button>

                      <div className="relative shrink-0" ref={filterMenuRef}>
                        <button
                          type="button"
                          onClick={() => setIsFilterOpen((v) => !v)}
                          aria-expanded={isFilterOpen}
                          className={`shrink-0 h-9 px-3 text-xs font-semibold rounded-xl border shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isFilterOpen || activeFiltersCount > 0
                              ? 'bg-slate-100 dark:bg-[#2A3040] border-slate-300 dark:border-white/20 text-slate-900 dark:text-zinc-100'
                              : 'bg-white dark:bg-[#212632] border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-zinc-100'
                          }`}
                        >
                          <Filter size={13} />
                          <span>Filtros</span>
                          {activeFiltersCount > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)]">
                              {activeFiltersCount}
                            </span>
                          )}
                        </button>

                        {isFilterOpen && (
                          <div className="fixed sm:absolute right-4 sm:right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#212632] border border-slate-200/90 dark:border-white/[0.12] shadow-xl p-3.5 z-50 space-y-3.5">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1.5">
                                Visibilidad
                              </div>
                              <div className="grid grid-cols-3 gap-1 bg-slate-100/80 dark:bg-[#181B24] p-1 rounded-xl">
                                {[
                                  { id: 'ALL', label: 'Todos' },
                                  { id: 'WORKSPACE', label: 'Público' },
                                  { id: 'PRIVATE', label: 'Privado' },
                                ].map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setVisibilityFilter(opt.id as 'ALL' | 'WORKSPACE' | 'PRIVATE');
                                      setPage(1);
                                    }}
                                    className={`py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                      visibilityFilter === opt.id
                                        ? 'bg-white dark:bg-[#2A3040] text-slate-900 dark:text-zinc-100 shadow-2xs'
                                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setOnlyStarred((v) => !v);
                                setPage(1);
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50/80 dark:bg-[#181B24] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-200">
                                <Star size={13} className={onlyStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-400'} />
                                Solo destacados
                              </span>
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center border ${
                                  onlyStarred
                                    ? 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)]'
                                    : 'border-slate-300 dark:border-white/20'
                                }`}
                              >
                                {onlyStarred && <Check size={11} strokeWidth={3} />}
                              </span>
                            </button>

                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1.5">
                                Ordenar por
                              </div>
                              <div className="space-y-1">
                                {[
                                  { id: 'recent', label: 'Más recientes' },
                                  { id: 'name', label: 'Nombre (A–Z)' },
                                  { id: 'cards', label: 'Más tarjetas' },
                                ].map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setSortBy(opt.id as 'recent' | 'name' | 'cards');
                                      setPage(1);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                      sortBy === opt.id
                                        ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-zinc-100 font-semibold'
                                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {sortBy === opt.id && <Check size={13} className="text-[var(--lumins-accent-fg)]" />}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {activeFiltersCount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVisibilityFilter('ALL');
                                  setOnlyStarred(false);
                                  setSortBy('recent');
                                  setPage(1);
                                }}
                                className="w-full pt-2 border-t border-slate-100 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 text-center cursor-pointer"
                              >
                                Limpiar filtros
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {(workspaces.find(w => w.id === workspaceId)?.members?.[0]?.role === 'OWNER' || workspaces.find(w => w.id === workspaceId)?.members?.[0]?.role === 'ADMIN') && (
                       <button 
                         onClick={() => setShowInviteModal(true)}
                         className="shrink-0 h-9 px-3 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-[#212632] border border-slate-200/90 dark:border-white/10 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                       >
                         <Users size={13} />
                         <span>Miembros</span>
                       </button>
                      )}

                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-trello-import'))}
                        className="shrink-0 h-9 px-3 text-xs font-semibold text-[#0079BF] bg-white dark:bg-[#212632] border border-slate-200/90 dark:border-white/10 rounded-xl shadow-xs hover:bg-[#0079BF]/5 hover:border-[#0079BF]/30 dark:hover:bg-[#0079BF]/10 transition-all flex items-center gap-1.5 group cursor-pointer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                          <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z"/>
                        </svg>
                        <span>Importar Trello</span>
                      </button>
                    </div>
                 </div>
              </div>

                {/* Board Grid */}
                {boards.length === 0 ? (
                  <div className="bg-white dark:bg-[#212632] rounded-2xl border border-slate-200/90 dark:border-white/10 p-16 text-center flex flex-col items-center shadow-xs">
                     <div className="w-14 h-14 bg-[var(--lumins-accent-soft)] border border-[var(--lumins-accent-border)] rounded-2xl flex items-center justify-center mb-4">
                        <LuminsBoardIcon size={26} />
                     </div>
                     <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">No hay proyectos activos</h3>
                     <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-5">Comienza creando tu primer tablero para organizar el trabajo.</p>
                      <div className="flex gap-3">
                         <Button 
                          onClick={() => window.dispatchEvent(new CustomEvent('open-create-board'))}
                          variant="outlined"
                          className="h-9 px-4 text-xs rounded-xl border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:border-[var(--lumins-accent)] hover:text-[var(--lumins-accent-fg)] hover:bg-[var(--lumins-accent-soft)]"
                         >
                           Crear tablero
                         </Button>
                         <Button 
                          onClick={() => window.dispatchEvent(new CustomEvent('open-trello-import'))}
                          variant="outlined"
                          className="h-9 px-4 text-xs rounded-xl border-[#0079BF]/30 text-[#0079BF] hover:bg-[#0079BF] hover:text-white transition-all flex items-center gap-2"
                         >
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4 min-h-[200px]">
                     <AnimatePresence>
                       {isPaginating ? (
                         <motion.div
                           key="boards-paginating"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="col-span-full flex items-center justify-center py-20"
                         >
                           <Loader2 size={28} className="animate-spin text-[var(--lumins-accent)]" />
                         </motion.div>
                       ) : currentBoards.length === 0 ? (
                         <motion.div
                           key="boards-empty-filter"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="col-span-full bg-white dark:bg-[#212632] rounded-2xl border border-slate-200/90 dark:border-white/[0.11] p-12 text-center flex flex-col items-center"
                         >
                           <Filter size={22} className="text-slate-400 dark:text-zinc-500 mb-3" />
                           <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                             No hay tableros con estos filtros
                           </h3>
                           <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-4">
                             Prueba ajustando la búsqueda o limpiando los filtros activos.
                           </p>
                           <button
                             type="button"
                             onClick={() => {
                               setSearchQuery('');
                               setVisibilityFilter('ALL');
                               setOnlyStarred(false);
                               setSortBy('recent');
                               setPage(1);
                             }}
                             className="h-8 px-3.5 rounded-xl bg-slate-100 dark:bg-[#2A3040] text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                           >
                             Limpiar filtros
                           </button>
                         </motion.div>
                       ) : (
                         currentBoards.map((board, index) => (
                           <motion.div
                             key={board.id}
                             layout
                             initial={{ opacity: 0, y: 16 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{
                               layout: { type: 'spring', stiffness: 320, damping: 30 },
                               duration: 0.3,
                               delay: Math.min(index * 0.03, 0.24),
                             }}
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

      {/* Archived Boards Modal / Mobile Bottom Sheet */}
      <AnimatePresence>
        {isArchivedModalOpen && (
          <motion.div
            key="archived-boards-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            onClick={() => setIsArchivedModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-white dark:bg-[#1C1F26] text-slate-900 dark:text-zinc-100 rounded-t-[28px] sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85dvh] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0"
            >
              <div
                className="sm:hidden w-full flex items-center justify-center pt-2.5 pb-1 shrink-0 cursor-pointer"
                onClick={() => setIsArchivedModalOpen(false)}
              >
                <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
              </div>

              <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Archive size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">Tableros archivados</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Solo propietarios o administradores de cada tablero pueden verlos y restaurarlos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArchivedModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar space-y-2.5 min-h-[180px]">
                {isLoadingArchived ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                    <Loader2 size={16} className="animate-spin text-[var(--lumins-accent)]" />
                    <span>Cargando tableros archivados...</span>
                  </div>
                ) : archivedBoards.length === 0 ? (
                  <div className="py-12 text-center space-y-1.5">
                    <Archive size={24} className="mx-auto text-slate-300 dark:text-zinc-600" />
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      No hay tableros archivados
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Los tableros que archives aparecerán aquí para poder acceder o restaurarlos.
                    </p>
                  </div>
                ) : (
                  archivedBoards.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {b.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {b.archivedAt
                            ? `Archivado el ${new Date(b.archivedAt).toLocaleDateString('es-ES')}`
                            : 'Archivado'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsArchivedModalOpen(false);
                            navigate(`/boards/${b.id}`);
                          }}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212632] text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          <span>Abrir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestoreArchivedBoard(b.id, b.name)}
                          disabled={restoringBoardId === b.id}
                          className="h-8 px-2.5 rounded-lg bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] text-[11px] font-bold hover:brightness-95 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {restoringBoardId === b.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RotateCcw size={12} />
                          )}
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="flex items-center gap-1 bg-white dark:bg-[#212632] p-1 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs text-xs font-semibold">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 hover:bg-slate-100/80 dark:hover:text-zinc-100 dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft size={13} />
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="w-7 h-7 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 rounded-lg transition-colors cursor-pointer">1</button>
            {pages[0] > 2 && <span className="px-1 text-slate-400">...</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg transition-all cursor-pointer ${
              p === page
                ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow-xs font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400'
            }`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="w-7 h-7 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 rounded-lg transition-colors cursor-pointer">{totalPages}</button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="h-7 px-2.5 rounded-lg flex items-center gap-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 hover:bg-slate-100/80 dark:hover:text-zinc-100 dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        Siguiente
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

export default BoardsPage;
