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
  Menu
} from 'lucide-react';

import { useNotificationHelpers, useStructuredLogger } from '../components/NotificationProvider';
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
import CardDetailModal from '../components/CardDetailModal';
import ManageBoardMembersModal from '../components/ManageBoardMembersModal';
import BoardSettingsSlideOver from '../components/BoardSettingsSlideOver';

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [board, setBoard] = useState<Board | null>(null);
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

  const { showError, showSuccess } = useNotificationHelpers();
  const { logSuccess } = useStructuredLogger();
  
  const listsRef = useRef<List[]>(lists);
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  const fetchBoard = useCallback(async () => {
    if (!id) return;
    try {
      const response = await apiClient.get<{ data: { board: Board } }>(`/api/boards/${id}`);
      setBoard(response.data.board);
      
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const findContainer = (id: string) => {
    const currentLists = listsRef.current;
    if (currentLists.find((list) => list.id === id)) return id;
    return currentLists.find((list) => (list.cards || []).some((card) => card.id === id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    const container = findContainer(activeId);
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

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setLists((prev) => {
      const activeList = prev.find((l) => l.id === activeContainer);
      const overList = prev.find((l) => l.id === overContainer);

      if (!activeList || !overList) return prev;

      const activeItems = activeList.cards || [];
      const overItems = overList.cards || [];
      
      const activeIndex = activeItems.findIndex((item) => item.id === activeId);
      const overIndex = overItems.findIndex((item) => item.id === overId);

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
          showError('Error', 'No se pudo guardar el nuevo orden de las listas');
          fetchBoard();
        } finally {
          setIsSaving(false);
        }
      }
      setOriginalContainer(null);
      return;
    }

    const currentLists = listsRef.current;
    const overContainer = findContainer(overId);

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
      showError('Error', 'No se pudo guardar el movimiento de la tarjeta');
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
      <div className="flex flex-col h-full bg-[#F4F6F9] font-sans overflow-hidden">
        {/* Header Skeleton */}
        <div className="h-[60px] px-8 flex items-center justify-between border-b border-zinc-200 bg-white">
           <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-48" />
           </div>
           <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
           </div>
        </div>

        {/* Canvas Skeleton */}
        <div className="flex-1 p-6 flex gap-4 overflow-hidden">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="min-w-[280px] max-w-[280px] h-full flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                   <Skeleton className="h-5 w-32" />
                   <Skeleton className="h-5 w-5 rounded-md" />
                </div>
                <div className="space-y-3">
                   {[1, 2, 3].map(j => (
                     <div key={j} className="bg-white rounded-lg border border-[#E8E9EC] p-3 space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between">
                           <Skeleton className="h-3 w-20" />
                           <div className="flex gap-1">
                              <Skeleton className="h-4 w-4 rounded-full" />
                              <Skeleton className="h-4 w-4 rounded-full" />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="flex flex-col h-full font-sans">
      
      {/* Board Header (Sub-navigation) - Dark Glass Mode */}
      <header className="h-16 bg-black/20 backdrop-blur-md border-b border-white/10 px-6 flex items-center justify-between flex-shrink-0 z-20 text-white drop-shadow-md">
        {/* Left Side: Hamburger, Breadcrumbs and Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="p-2 mr-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all border border-white/10"
          >
            <Menu size={20} />
          </button>

          <Link 
            to={`/w/${board.workspaceId}/dashboard`} 
            className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            Tableros
          </Link>
          <span className="text-white/30 text-lg">/</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#7A5AF8] flex items-center justify-center text-white shadow-sm border border-white/10">
              <span className="font-bold text-xs">{board.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white drop-shadow-sm">{board.name}</h1>
                {isSaving && (
                  <span className="text-[10px] font-semibold text-white bg-white/10 border border-white/10 px-2 py-0.5 rounded-full animate-pulse">
                    Guardando...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Members Avatars */}
          <div className="flex items-center -space-x-2 mr-1">
            {board.members?.slice(0, 3).map((member) => (
              <div 
                key={member.userId} 
                className="w-7 h-7 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shadow-sm"
                title={member.user.name}
              >
                {member.user.avatarUrl ? (
                  <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{member.user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}
            {(board.members?.length || 0) > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                +{(board.members?.length || 0) - 3}
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-all shadow-sm ${
                filterUserId || isFiltersOpen 
                  ? 'bg-white/30 border-white/40 text-white' 
                  : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
              }`}
            >
              <Filter size={16} />
              {filterUserId ? 'Filtrado' : 'Filtros'}
            </button>

            {isFiltersOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Filtrar por miembro</div>
                <div className="max-h-60 overflow-y-auto">
                  <button 
                    onClick={() => { setFilterUserId(null); setIsFiltersOpen(false); }}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-sm text-zinc-700"
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px]">All</div>
                    Todos los miembros
                  </button>
                  {board.members?.map(member => (
                    <button 
                      key={member.userId}
                      onClick={() => { setFilterUserId(member.userId); setIsFiltersOpen(false); }}
                      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-sm ${filterUserId === member.userId ? 'text-[#7A5AF8] font-semibold bg-violet-50/50' : 'text-zinc-700'}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#7A5AF8]/10 text-[#7A5AF8] flex items-center justify-center text-[10px] font-bold">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      {member.user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsMembersModalOpen(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg bg-black/40 text-white hover:bg-black/60 border border-white/10 text-sm font-medium transition-all shadow-sm"
          >
            <Users size={16} />
            Miembros
          </button>

          <button 
            onClick={() => setIsSettingsDrawerOpen(true)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg bg-black/40 text-white hover:bg-black/60 text-sm font-bold transition-all border border-white/10"
          >
            <Settings size={16} />
            Configuración
          </button>
        </div>
      </header>

      {/* Canvas Area (Lists) */}
      <main className="flex-1 h-[calc(100vh-130px)] overflow-x-auto overflow-y-hidden custom-scrollbar p-8 transition-all duration-500 bg-transparent">
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
            
            {isAddingList ? (
              <form onSubmit={handleAddList} className="min-w-[280px] max-w-[280px] bg-white rounded-xl border border-zinc-200 p-4 h-fit shadow-lg ring-1 ring-black/5">
                <input
                  autoFocus
                  placeholder="Nombre de la lista..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium mb-3 focus:bg-white focus:border-[#7A5AF8] focus:ring-4 focus:ring-[#7A5AF8]/10 outline-none transition-all"
                />
                <div className="flex items-center gap-2">
                  <button type="submit" className="flex-1 bg-[#7A5AF8] hover:bg-[#6949d6] text-white text-sm font-bold py-2 rounded-lg transition-colors shadow-md shadow-violet-200">
                    Añadir lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="px-3 py-2 text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="min-w-[280px] max-w-[280px] h-[60px] flex items-center justify-center gap-2 rounded-xl bg-white/50 border-2 border-dashed border-zinc-300 text-zinc-500 hover:text-[#7A5AF8] hover:border-[#7A5AF8] hover:bg-white transition-all font-bold text-sm group flex-shrink-0"
              >
                <div className="p-1 rounded-md bg-zinc-100 group-hover:bg-violet-100 transition-colors">
                  <Plus size={18} strokeWidth={3} />
                </div>
                Añadir otra lista
              </button>
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
    </div>
  );
};

export default BoardDetailPage;
