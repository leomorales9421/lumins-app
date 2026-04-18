import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board, List, Card as CardType } from '../types/board';
import Button from '../components/ui/Button';
import NavBar from '../components/layout/NavBar';
import { 
  DndContext, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
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
  
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const fetchBoard = useCallback(async () => {
    if (!id) return;
    try {
      const response = await apiClient.get<{ data: { board: Board } }>(`/api/boards/${id}`);
      setBoard(response.data.board);
      setLists(response.data.board.lists || []);
    } catch (err) {
      navigate('/app');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
       setLists((items) => {
         const oldIndex = items.findIndex(l => l.id === active.id);
         const newIndex = items.findIndex(l => l.id === over.id);
         return arrayMove(items, oldIndex, newIndex);
       });
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
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">{board.name}</h1>
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
        onClose={() => setSelectedCardId(null)}
        cardId={selectedCardId}
        boardId={id}
        onUpdate={fetchBoard}
        initialData={selectedCardId ? {
          title: board.lists.flatMap(l => l.cards || []).find(c => c.id === selectedCardId)?.title || 'Cargando...',
          listName: board.lists.find(l => (l.cards || []).some(c => c.id === selectedCardId))?.name || 'Desconocida'
        } : undefined}
      />
    </div>
  );
};

export default BoardDetailPage;
