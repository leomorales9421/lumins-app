import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board, List, Card as CardType } from '../types/board';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  ChevronLeft, 
  Filter, 
  Users, 
  Settings, 
  Plus, 
  Search,
  MoreHorizontal,
  Menu,
  Lock,
  Globe,
  Building2,
  Trash2,
  Check
} from 'lucide-react';

import { toast } from 'sonner';
import { useStructuredLogger } from '../components/NotificationProvider';

import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { 
  SortableContext, 
  horizontalListSortingStrategy, 
  arrayMove 
} from '@dnd-kit/sortable';
import { SortableList } from '../components/dnd/SortableList';
import { SortableCard } from '../components/dnd/SortableCard';
import UserAvatar from '../components/ui/UserAvatar';
import CardDetailModal from '../components/CardDetailModal';
import ManageBoardMembersModal from '../components/ManageBoardMembersModal';
import BoardSettingsSlideOver from '../components/BoardSettingsSlideOver';
import { motion, AnimatePresence } from 'framer-motion';

import { usePermission } from '../contexts/PermissionContext';

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGodMode } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalContainer, setOriginalContainer] = useState<string | null>(null);
  
  // New States for Logic
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);

  const canEdit = isGodMode || userRole === 'admin' || userRole === 'editor';
  const isAdmin = isGodMode || userRole === 'admin';

  const { logSuccess } = useStructuredLogger();

  
  const listsRef = useRef<List[]>(lists);
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  const fetchBoard = useCallback(async () => {
    if (!id) return;
    try {
      const response = await apiClient.get<{ data: { board: Board, userRole: string } }>(`/api/boards/${id}`);
      setBoard(response.data.board);
      setUserRole(response.data.userRole);
      
      // Filter out archived (closed) cards
      let filteredLists = (response.data.board.lists || []).map(list => ({
        ...list,
        cards: (list.cards || []).filter(card => card.status === 'open')
      }));

      // Apply client-side filters if active
      if (filterUserId) {
        filteredLists = filteredLists.map(list => ({
          ...list,
          cards: list.cards?.filter(card => 
            card.assignees?.some(a => a.user.id === filterUserId)
          ) || []
        }));
      }

      setLists(filteredLists);
    } catch (err) {
      navigate('/app');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, filterUserId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard, filterUserId]);

  // Sync background with MainLayout whenever it changes
  useEffect(() => {
    if (board?.background) {
      window.dispatchEvent(new CustomEvent('set-board-background', { 
        detail: { background: board.background } 
      }));
    }
  }, [board?.background]);

  const handleUpdateVisibility = async (newVisibility: 'PRIVATE' | 'WORKSPACE') => {
    if (!id || !board) return;
    
    // Optimistic update
    const previousVisibility = board.visibility;
    setBoard({ ...board, visibility: newVisibility });
    setIsVisibilityDropdownOpen(false);

    try {
      await apiClient.patch(`/api/boards/${id}/visibility`, { visibility: newVisibility });
      logSuccess('Visibilidad actualizada', `El tablero ahora es ${newVisibility.toLowerCase()}`);
    } catch (err) {
      setBoard({ ...board, visibility: previousVisibility });
      toast.error('Error', { description: 'No se pudo actualizar la visibilidad' });
    }
  };

  // Handle opening card from URL on initial load
  useEffect(() => {
    const cardId = searchParams.get('cardId');
    if (cardId) {
      setSelectedCardId(cardId);
    }
  }, [searchParams]);

  const handleCloseModal = () => {
    setSelectedCardId(null);
    // Remove cardId from URL when closing modal
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('cardId');
    setSearchParams(newParams, { replace: true });
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const sensors = useSensors(useSensor(PointerSensor, { 
    activationConstraint: { distance: 5 },
    disabled: !canEdit
  }));

  const findContainer = (lists: List[], id: string) => {
    if (lists.find((list) => list.id === id)) return id;
    return lists.find((list) => (list.cards || []).some((card) => card.id === id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    const container = findContainer(lists, activeId);
    setOriginalContainer(container || null);
    
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setLists((prev) => {
      const activeContainer = findContainer(prev, activeId);
      const overContainer = findContainer(prev, overId);

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return prev;
      }

      const activeList = prev.find((l) => l.id === activeContainer);
      const overList = prev.find((l) => l.id === overContainer);

      if (!activeList || !overList) return prev;

      const activeItems = activeList.cards || [];
      const overItems = overList.cards || [];
      
      const activeIndex = activeItems.findIndex((item) => item.id === activeId);
      const overIndex = overItems.findIndex((item) => item.id === overId);

      if (activeIndex === -1) return prev;

      let newIndex;
      if (prev.some(l => l.id === overId)) {
        newIndex = overItems.length;
      } else {
        const isBelowLastItem = over && overIndex === overItems.length - 1;
        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
      }

      return prev.map((list) => {
        if (list.id === activeContainer) {
          return {
            ...list,
            cards: (list.cards || []).filter((item) => item.id !== activeId),
          };
        } else if (list.id === overContainer) {
          const newCards = [...(list.cards || [])];
          newCards.splice(newIndex, 0, activeItems[activeIndex]);
          return {
            ...list,
            cards: newCards,
          };
        }
        return list;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      setOriginalContainer(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type;
    
    if (activeType === 'list') {
      if (activeId !== overId) {
        const oldIndex = lists.findIndex((l) => l.id === activeId);
        const newIndex = lists.findIndex((l) => l.id === overId);
        const newListsOrder = arrayMove(lists, oldIndex, newIndex);
        
        setLists(newListsOrder);

        try {
          setIsSaving(true);
          await apiClient.post(`/api/lists/boards/${id}/lists/reorder`, {
            lists: newListsOrder.map((l, index) => ({ id: l.id, position: (index + 1) * 1000 }))
          });
        } catch (err) {
          toast.error('Error', { description: 'No se pudo guardar el nuevo orden de las listas' });

          fetchBoard();
        } finally {
          setIsSaving(false);
        }
      }
      setOriginalContainer(null);
      return;
    }

    const currentLists = listsRef.current;
    const overContainer = findContainer(lists, overId);

    if (!overContainer) {
      setOriginalContainer(null);
      return;
    }

    const activeList = currentLists.find((l) => l.id === overContainer);
    if (!activeList) {
      setOriginalContainer(null);
      return;
    }

    const activeIndex = (activeList.cards || []).findIndex((c) => c.id === activeId);
    const overIndex = (activeList.cards || []).findIndex((c) => c.id === overId);

    let finalLists = currentLists;
    if (activeId !== overId) {
      finalLists = currentLists.map((list) => {
        if (list.id === overContainer) {
          return { ...list, cards: arrayMove(list.cards || [], activeIndex, overIndex) };
        }
        return list;
      });
      setLists(finalLists);
    }

    try {
      setIsSaving(true);
      const targetList = finalLists.find(l => l.id === overContainer);
      const cardsInTarget = targetList?.cards || [];
      
      if (originalContainer === overContainer) {
        await apiClient.post(`/api/cards/lists/${overContainer}/reorder`, {
          cards: cardsInTarget.map((c, index) => ({ id: c.id, position: (index + 1) * 1000 }))
        });
      } else {
        const newIndexInList = cardsInTarget.findIndex(c => c.id === activeId);
        await apiClient.post(`/api/cards/${activeId}/move`, {
          destinationBoardId: id,
          destinationListId: overContainer,
          newPosition: (Math.max(0, newIndexInList) + 1) * 1000
        });
      }
      logSuccess('Card moved', 'Sync complete');
    } catch (err) {
      toast.error('Error', { description: 'No se pudo guardar el movimiento de la tarjeta' });

      fetchBoard();
    } finally {
      setIsSaving(false);
      setOriginalContainer(null);
    }
  };

  const handleAddCard = async (listId: string, title: string) => {
    try {
      await apiClient.post(`/api/cards/lists/${listId}/cards`, { title });
      fetchBoard();
    } catch (err) {
      console.error('Error adding card:', err);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !id) return;
    try {
      await apiClient.post(`/api/lists/boards/${id}/lists`, { 
        name: newListTitle.trim(),
        position: (lists.length + 1) * 1000
      });
      setNewListTitle('');
      setIsAddingList(false);
      fetchBoard();
    } catch (err) {
      console.error('Error adding list:', err);
    }
  };

  const handleUpdateList = async (listId: string, name: string) => {
    try {
      await apiClient.patch(`/api/lists/${listId}`, { name });
      fetchBoard();
    } catch (err) {
      console.error('Error updating list:', err);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await apiClient.delete(`/api/lists/${listId}`);
      fetchBoard();
    } catch (err) {
      console.error('Error deleting list:', err);
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full bg-[#F4F6F9] dark:bg-[#09090B] font-sans overflow-hidden"
      >
        {/* Header Skeleton - Matches 72px height */}
        <div className="h-[72px] px-8 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#13151A] z-30">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded opacity-50" />
                </div>
              </div>
              <div className="hidden md:block h-8 w-px bg-zinc-100 dark:bg-white/5" />
              <div className="hidden lg:flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <Skeleton className="h-8 w-8 rounded border-2 border-white dark:border-[#13151A]" />
                <Skeleton className="h-8 w-8 rounded border-2 border-white dark:border-[#13151A]" />
                <Skeleton className="h-8 w-8 rounded border-2 border-white dark:border-[#13151A]" />
              </div>
              <div className="h-8 w-px bg-zinc-100 dark:bg-white/5" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-24 rounded" />
                <Skeleton className="h-10 w-32 rounded" />
              </div>
           </div>
        </div>

        {/* Canvas Skeleton */}
        <div className="flex-1 p-8 flex gap-6 overflow-hidden">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="min-w-[320px] max-w-[320px] h-full flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                   <Skeleton className="h-6 w-32 rounded" />
                   <div className="flex gap-1">
                     <Skeleton className="h-6 w-6 rounded" />
                     <Skeleton className="h-6 w-6 rounded" />
                   </div>
                </div>
                
                <div className="space-y-3">
                   {[1, 2, 3].map(j => (
                     <div key={j} className="bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/5 p-4 space-y-4 shadow-sm">
                        <Skeleton className="h-4 w-[90%] rounded" />
                        <div className="flex justify-between items-center pt-2">
                           <Skeleton className="h-3 w-16 rounded" />
                           <div className="flex gap-1">
                              <Skeleton className="h-5 w-5 rounded" />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
                
                <Skeleton className="h-[52px] w-full rounded opacity-40" />
             </div>
           ))}
        </div>
      </motion.div>
    );
  }

  if (!board) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col h-full font-sans"
    >
      
      {/* Board Header (Sub-navigation) - Premium Glass Mode */}
      <header className="h-[72px] bg-black/20 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 z-20 text-white shadow-2xl">
        {/* Left Side: Sidebar Toggle, Breadcrumbs and Title */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="p-2.5 bg-white/5 hover:bg-white/15 active:scale-95 rounded text-white/90 transition-all border border-white/10 shadow-sm group"
            title="Toggle Sidebar"
          >
            <Menu size={20} className="group-hover:text-white transition-colors" />
          </button>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link 
              to={`/w/${board.workspaceId}/dashboard`} 
              className="hidden md:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-all hover:translate-x-[-2px]"
            >
              <ChevronLeft size={14} strokeWidth={3} />
              Tableros
            </Link>
            
            <span className="hidden md:block text-white/10 font-thin text-2xl">|</span>
            
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-[#6C5DD3] to-[#8E82E3] flex items-center justify-center text-white shadow-lg border border-white/20 flex-shrink-0">
                <span className="font-black text-sm">{board.name.charAt(0).toUpperCase()}</span>
              </div>
              
                <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <h1 className="text-lg sm:text-xl font-black text-white truncate drop-shadow-md tracking-tight">
                    {board.name}
                  </h1>

                  {/* Visibility Selector */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)}
                      className="p-1.5 rounded-[4px] bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2"
                      title={board.visibility === 'PRIVATE' ? 'Privado' : 'Espacio de trabajo'}
                    >
                      {board.visibility === 'PRIVATE' ? <Lock size={14} /> : <Building2 size={14} />}
                    </button>

                    <AnimatePresence>
                      {isVisibilityDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsVisibilityDropdownOpen(false)}
                          />
                          <motion.div 
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            className="absolute left-0 mt-2 w-56 bg-[#1C1F26] border border-white/10 rounded-[4px] shadow-2xl z-50 overflow-hidden"
                          >
                            <div className="p-2 border-b border-white/5">
                              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2">Visibilidad</span>
                            </div>
                            <div className="p-1">
                              <button 
                                onClick={() => handleUpdateVisibility('PRIVATE')}
                                className={`w-full flex items-center justify-between p-2 rounded-[4px] text-xs font-bold transition-all ${board.visibility === 'PRIVATE' ? 'bg-[#6C5DD3] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Lock size={14} />
                                  <span>Privado</span>
                                </div>
                                {board.visibility === 'PRIVATE' && <Check size={14} />}
                              </button>
                              <button 
                                onClick={() => handleUpdateVisibility('WORKSPACE')}
                                className={`w-full flex items-center justify-between p-2 rounded-[4px] text-xs font-bold transition-all ${board.visibility === 'WORKSPACE' ? 'bg-[#6C5DD3] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 size={14} />
                                  <span>Espacio de Trabajo</span>
                                </div>
                                {board.visibility === 'WORKSPACE' && <Check size={14} />}
                              </button>
                            </div>
                            <div className="p-3 bg-white/5 border-t border-white/5">
                              <p className="text-[10px] text-white/40 leading-relaxed italic">
                                {board.visibility === 'PRIVATE' 
                                  ? 'Solo los miembros del tablero pueden verlo y editarlo.' 
                                  : 'Todos los miembros del espacio de trabajo pueden ver este tablero.'}
                              </p>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {isSaving && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      <div className="w-1.5 h-1.5 rounded bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">
                        Salvando
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Members & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Members Group */}
          <div
            onClick={() => setIsMembersModalOpen(true)}
            className="hidden sm:flex items-center -space-x-3 hover:space-x-1 transition-all cursor-pointer p-1.5 hover:bg-white/5 rounded border border-transparent hover:border-white/10"
          >
            {board.members?.slice(0, 4).map((member) => (
              <div
                key={member.userId}
                className="w-8 h-8 rounded border-2 border-zinc-900/50 bg-zinc-800 flex items-center justify-center overflow-hidden shadow-xl ring-1 ring-white/10"
              >
                <UserAvatar
                  name={member.user.name}
                  avatarUrl={member.user.avatarUrl}
                  size="sm"
                />
              </div>
            ))}
            {(board.members?.length || 0) > 4 && (
              <div className="w-8 h-8 rounded border-2 border-zinc-900/50 bg-[#2D3139] flex items-center justify-center text-[10px] font-black text-white/80 shadow-xl ring-1 ring-white/10">
                +{(board.members?.length || 0) - 4}
              </div>
            )}
          </div>

          {/* My role badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/70">
            {userRole === 'admin' ? '👑' : userRole === 'editor' ? '✏️' : '👁️'}
            <span>{userRole === 'admin' ? 'Admin' : userRole === 'editor' ? 'Editor' : 'Viewer'}</span>
          </div>

          <div className="w-px h-8 bg-white/10 hidden sm:block mx-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`flex items-center gap-2 h-10 px-3 sm:px-4 rounded border text-sm font-bold transition-all active:scale-95 shadow-lg ${
                  filterUserId || isFiltersOpen 
                    ? 'bg-white/20 border-white/40 text-white ring-4 ring-white/5' 
                    : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/15 hover:border-white/20'
                }`}
              >
                <Filter size={16} strokeWidth={2.5} className={filterUserId ? 'text-indigo-400' : ''} />
                <span className="hidden lg:inline">{filterUserId ? 'Filtrado' : 'Filtros'}</span>
              </button>

              <AnimatePresence>
                {isFiltersOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-[#1C1F26]/95 backdrop-blur-2xl rounded shadow-2xl border border-white/10 py-3 z-50 overflow-hidden"
                  >
                    <div className="px-4 pb-2 mb-2 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Filtrar por</span>
                      {filterUserId && (
                        <button onClick={() => setFilterUserId(null)} className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter hover:underline">Limpiar</button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto px-2 space-y-1">
                      <button 
                        onClick={() => { setFilterUserId(null); setIsFiltersOpen(false); }}
                        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 rounded transition-colors text-sm text-white/70"
                      >
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold">All</div>
                        Todos los miembros
                      </button>
                      {board.members?.map(member => (
                        <button 
                          key={member.userId}
                          onClick={() => { setFilterUserId(member.userId); setIsFiltersOpen(false); }}
                          className={`w-full px-2 py-2 flex items-center gap-3 hover:bg-white/5 rounded transition-all text-sm ${filterUserId === member.userId ? 'bg-[#6C5DD3]/20 text-[#8E82E3] font-bold' : 'text-white/70 hover:text-white'}`}
                        >
                          <div className={`p-0.5 rounded ${filterUserId === member.userId ? 'ring-2 ring-indigo-500' : ''}`}>
                            <UserAvatar name={member.user.name} avatarUrl={member.user.avatarUrl} size="sm" />
                          </div>
                          <span className="truncate">{member.user.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsMembersModalOpen(true)}
              className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/15 hover:border-white/20 text-sm font-bold transition-all active:scale-95 shadow-lg lg:flex hidden"
            >
              <Users size={16} strokeWidth={2.5} />
              <span>Miembros</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => setIsSettingsDrawerOpen(true)}
                className="flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:px-4 rounded bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/15 hover:border-white/20 text-sm font-bold transition-all active:scale-95 shadow-lg"
                title="Configuración"
              >
                <Settings size={18} strokeWidth={2.5} />
                <span className="hidden lg:inline">Configuración</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Canvas Area (Lists) */}
      <main className="flex-1 h-[calc(100vh-144px)] overflow-x-auto overflow-y-hidden custom-scrollbar p-8 transition-all duration-500 bg-transparent snap-x snap-mandatory scrollbar-hide">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart} 
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-4 h-full pb-4">
            <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => (
                <SortableList 
                  key={list.id} 
                  list={list} 
                  onCardClick={setSelectedCardId}
                  onAddCard={handleAddCard}
                  onUpdateList={handleUpdateList}
                  onDeleteList={handleDeleteList}
                />
              ))}
            </SortableContext>
            
            {canEdit && (
              isAddingList ? (
                <form onSubmit={handleAddList} className="min-w-[280px] max-w-[280px] bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-4 h-fit shadow-lg ring-1 ring-black/5">
                  <input
                    autoFocus
                    placeholder="Nombre de la lista..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm font-medium mb-3 focus:bg-white dark:focus:bg-[#13151A] focus:border-[#6C5DD3] focus:ring-4 focus:ring-[#6C5DD3]/10 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                  />
                   <div className="flex items-center gap-2">
                    <button type="submit" className="flex-1 bg-[#6C5DD3] hover:bg-[#312e81] text-white text-sm font-bold py-2 rounded transition-colors shadow-md shadow-[#6C5DD3]/20">
                      Añadir lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
                      className="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
               ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="min-w-[280px] max-w-[280px] h-[60px] flex items-center justify-center gap-2 rounded bg-white/40 dark:bg-white/5 border-2 border-dashed border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-[#6C5DD3] dark:hover:text-[#8E82E3] hover:border-[#6C5DD3] dark:hover:border-[#6C5DD3]/50 hover:bg-white dark:hover:bg-white/10 transition-all font-bold text-sm group flex-shrink-0"
                >
                  <div className="p-1 rounded bg-zinc-100 dark:bg-white/10 group-hover:bg-indigo-100 dark:group-hover:bg-[#6C5DD3]/20 transition-colors">
                    <Plus size={18} strokeWidth={3} />
                  </div>
                  Añadir otra lista
                </button>
              )
            )}

            {/* Extra spacer for scroll */}
            <div className="w-8 flex-shrink-0" />
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-[280px] rotate-2 shadow-2xl">
                <SortableCard card={activeCard} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <CardDetailModal
        isOpen={!!selectedCardId}
        onClose={handleCloseModal}
        cardId={selectedCardId}
        boardId={id}
        onUpdate={fetchBoard}
        initialData={selectedCardId ? {
          title: (board.lists || []).flatMap(l => l.cards || []).find(c => c.id === selectedCardId)?.title || 'Cargando...',
          listName: (board.lists || []).find(l => (l.cards || []).some(c => c.id === selectedCardId))?.name || 'Desconocida'
        } : undefined}
      />

      <ManageBoardMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        boardId={board.id}
        workspaceId={board.workspaceId}
        currentMembers={board.members || []}
        onUpdate={fetchBoard}
      />

      <BoardSettingsSlideOver
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        board={board}
        onUpdate={fetchBoard}
        onUpdateBoard={(updatedData) => setBoard(prev => prev ? { ...prev, ...updatedData } : null)}
      />
    </motion.div>
  );
};

export default BoardDetailPage;
