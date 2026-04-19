import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board, List, Card as CardType } from '../types/board';
import Button from '../components/ui/Button';
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
          sourceListId: originalContainer, 
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
      <div className="min-h-screen bg-[#F3E8FF] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-[#7A5AF8]/20 border-t-[#7A5AF8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="h-screen flex flex-col bg-[#F3E8FF] font-sans">
      <NavBar user={user} logout={logout} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Simplified Top Header Area */}
        <header className="bg-white border-b border-zinc-100 px-12 py-10 flex items-center justify-between flex-shrink-0 shadow-soft relative z-10">
           <div className="flex items-center gap-10">
             <button onClick={() => navigate('/app')} className="w-12 h-12 bg-[#F3E8FF] rounded-xl text-[#7A5AF8] flex items-center justify-center transition-all hover:bg-[#e9d5ff]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             </button>
             <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">{board.name}</h1>
                    {isSaving && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A5AF8]/10 border border-[#7A5AF8]/20 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7A5AF8]" />
                        <span className="text-[10px] font-bold text-[#7A5AF8] uppercase tracking-wider">Sincronizando...</span>
                      </div>
                    )}
                 </div>

                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#7A5AF8] animate-pulse" />
                   <span className="text-[10px] font-black text-[#7A5AF8] uppercase tracking-[0.4em]">Unidad Estratégica Activa</span>
                </div>
             </div>
           </div>

           <div className="flex items-center gap-4">
              <Button variant="outlined" size="sm" className="h-11 px-6 border-zinc-100 text-zinc-400">Miembros</Button>
              <Button variant="primary" size="sm" className="h-11 px-8 bg-[#7A5AF8]">Configuración</Button>
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
            <div className="flex gap-5 h-full items-start p-12 min-w-max">
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
                <form onSubmit={handleAddList} className="min-w-[340px] bg-white rounded-2xl p-4 shadow-soft border border-[#7A5AF8]/10 h-fit">
                  <input
                    autoFocus
                    placeholder="Nombre de la lista..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full bg-[#F3E8FF] rounded-xl p-3 text-sm font-bold text-zinc-900 outline-none placeholder:text-[#806F9B]/50 mb-3"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" className="bg-[#7A5AF8]">Añadir lista</Button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingList(false)}
                      className="text-zinc-400 hover:text-zinc-600 p-2 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingList(true)}
                  className="min-w-[340px] h-[100px] bg-white/40 hover:bg-white border-2 border-dashed border-[#7A5AF8]/20 rounded-2xl flex items-center justify-center gap-4 text-[#7A5AF8]/40 font-black uppercase tracking-widest text-xs transition-all hover:border-[#7A5AF8] hover:text-[#7A5AF8] group flex-shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Nueva Lista
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
