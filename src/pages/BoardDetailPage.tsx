import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board, List, Card as CardType } from '../types/board';
import { Skeleton } from '../components/ui/Skeleton';

import NavBar from '../components/layout/NavBar';
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

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
      const filteredLists = (response.data.board.lists || []).map(list => ({
        ...list,
        cards: (list.cards || []).filter(card => card.status === 'open')
      }));
      setLists(filteredLists);
    } catch (err) {
      navigate('/app');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    const container = findContainer(activeId);
    setOriginalContainer(container || null);
    
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card);
    }
  };

  const findContainer = (id: string) => {
    const currentLists = listsRef.current;
    if (currentLists.find((list) => list.id === id)) return id;
    return currentLists.find((list) => (list.cards || []).some((card) => card.id === id))?.id;
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
    
    // CASE: REORDERING LISTS
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

    // CASE: REORDERING CARDS
    const currentLists = listsRef.current;
    const overContainer = findContainer(overId);

    if (!overContainer) {
      setOriginalContainer(null);
      return;
    }

    // Even if activeContainer === overContainer (due to handleDragOver), 
    // we might need to sort within the target list
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

    // SYNC WITH BACKEND
    try {
      setIsSaving(true);
      const targetList = finalLists.find(l => l.id === overContainer);
      const cardsInTarget = targetList?.cards || [];
      
      if (originalContainer === overContainer) {
        // INTRA-LIST: Use bulk reorder to ensure all positions are unique and correct
        await apiClient.post(`/api/cards/lists/${overContainer}/reorder`, {
          cards: cardsInTarget.map((c, index) => ({ id: c.id, position: (index + 1) * 1000 }))
        });
      } else {
        // INTER-LIST: Use single move (backend handles WIP limits and audit logs)
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
      <div className="h-screen flex flex-col cu-board-bg font-sans overflow-hidden">
        {/* Header Skeleton */}
        <div className="px-8 py-4 flex items-center justify-between border-b border-[#E8E9EC] bg-white/50">
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
             <div key={i} className="min-w-[300px] h-full flex flex-col gap-3">
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
    <div className="h-screen flex flex-col cu-board-bg font-sans">
      <NavBar user={user} logout={logout} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Simplified Top Header Area */}
        <header className="cu-board-header px-8 py-4 flex items-center justify-between flex-shrink-0 relative z-10">
           <div className="flex items-center gap-6">
             <button
               onClick={() => navigate('/app')}
               className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#7A5AF8] transition-colors text-sm font-medium"
             >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
               Tableros
             </button>
             <span className="text-[#D1D5DB]">/</span>
             <div className="flex items-center gap-3">
               <div className="w-6 h-6 rounded-md bg-[#7A5AF8] flex-shrink-0" />
               <div className="flex items-center gap-2">
                 <h1 className="text-[15px] font-bold text-[#1A1A2E]">{board.name}</h1>
                 {isSaving && (
                   <span className="text-[10px] font-semibold text-[#7A5AF8] bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full animate-pulse">
                     Guardando...
                   </span>
                 )}
               </div>
             </div>
           </div>

           <div className="flex items-center gap-2">
              <button className="h-8 px-4 rounded-lg text-[#6B7280] text-[13px] font-semibold border border-[#E8E9EC] bg-white hover:border-[#7A5AF8] hover:text-[#7A5AF8] transition-all">Miembros</button>
              <button className="h-8 px-4 rounded-lg text-white text-[13px] font-semibold bg-[#7A5AF8] hover:bg-[#6949d6] transition-all shadow-sm">Configuración</button>
           </div>
        </header>

        {/* DND Canvas expanded */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart} 
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full items-start p-6 min-w-max">
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
                <form onSubmit={handleAddList} className="min-w-[300px] bg-white rounded-lg border border-[#E8E9EC] p-3 h-fit shadow-soft">
                  <input
                    autoFocus
                    placeholder="Nombre de la lista..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full cu-input px-2.5 py-2 text-[13px] font-medium mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <button type="submit" className="bg-[#7A5AF8] hover:bg-[#6949d6] text-white text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors">Añadir lista</button>
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
                      className="text-[#6B7280] hover:text-[#1A1A2E] text-[12px] font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="cu-add-list-btn min-w-[300px] h-[72px] flex items-center justify-center gap-2 text-[#9CA3AF] hover:text-[#7A5AF8] font-semibold text-[13px] flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Añadir lista
                </button>
              )}

              {/* Spacer to prevent sticking to the right edge */}
              <div className="w-24 flex-shrink-0" />
            </div>

            <DragOverlay>
              {activeCard ? (
                <div className="w-[300px] rotate-2 shadow-2xl">
                  <SortableCard card={activeCard} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>

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
    </div>
  );
};

export default BoardDetailPage;
