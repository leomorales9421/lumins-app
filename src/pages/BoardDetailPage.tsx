import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board } from '../types/board';
import Button from '../components/ui/Button';
import { DndProvider } from '../components/dnd/DndProvider';
import { SortableList } from '../components/dnd/SortableList';
import { SortableCard } from '../components/dnd/SortableCard';
import CardModal from '../components/CardModal';
import type { CardDetail } from '../components/CardModal';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

export interface List {
  id: string;
  name: string;
  boardId: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  dueDate?: string;
  labels?: (string | { id?: string; name?: string; title?: string; color?: string })[];
  createdAt?: string;
  updatedAt?: string;
}

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<List | null>(null);
  const [cardsInListToDelete, setCardsInListToDelete] = useState<number>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  const [showArchivedCards, setShowArchivedCards] = useState(false);
  const [archivedCards, setArchivedCards] = useState<Card[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);

  const fetchBoardData = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const boardResponse = await apiClient.get<{ data: { board: Board } }>(`/api/boards/${id}`);
      const boardData = boardResponse.data.board;
      setBoard(boardData);
      
      const listsResponse = await apiClient.get<{ data: { lists: List[] } }>(`/api/lists/boards/${id}/lists`);
      setLists(listsResponse.data.lists || []);
      
      const cardsResponse = await apiClient.get<{ data: { cards: Card[] } }>(`/api/cards/boards/${id}/cards`, {
        params: { status: 'open' }
      });
      
      const cardsData = cardsResponse.data.cards || [];
      const cardsWithValidPosition = cardsData.map((card, index) => ({
        ...card,
        position: card.position !== undefined && !isNaN(card.position) ? card.position : index,
      }));
      
      setCards(cardsWithValidPosition);
      
    } catch (err: any) {
      setError(err.message || 'Error al cargar el tablero');
      console.error('Error fetching board data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const listIds = useMemo(() => lists.map(list => list.id), [lists]);

  const handleCreateList = async () => {
    if (!newListTitle.trim() || !id) return;
    
    try {
      const response = await apiClient.post<{ data: { list: List } }>(`/api/lists/boards/${id}/lists`, {
        name: newListTitle,
      });
      
      const newList = response.data.list;
      setLists(prev => [...prev, newList]);
      setNewListTitle('');
      setIsCreatingList(false);
      setError(null);
    } catch (err: any) {
      console.error('Error creating list:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear la lista';
      setError(errorMessage);
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    try {
      await apiClient.patch(`/api/lists/${listId}`, { name: newTitle });
      setLists(prev => prev.map(list => 
        list.id === listId ? { ...list, name: newTitle } : list
      ));
    } catch (err: any) {
      setError(err.message || 'Error al renombrar la lista');
      throw err;
    }
  };

  const handleArchiveList = async (listId: string) => {
    try {
      await apiClient.patch(`/api/lists/${listId}/archive`);
      setLists(prev => prev.filter(list => list.id !== listId));
      setCards(prev => prev.filter(card => card.listId !== listId));
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al archivar la lista';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const openDeleteModal = (list: List) => {
    const cardCount = cards.filter(card => card.listId === list.id).length;
    setListToDelete(list);
    setCardsInListToDelete(cardCount);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setListToDelete(null);
    setCardsInListToDelete(0);
    setDeleteError(null);
  };

  const confirmArchiveList = async () => {
    if (!listToDelete) return;
    
    try {
      await handleArchiveList(listToDelete.id);
      closeDeleteModal();
    } catch (err: any) {
      setDeleteError(err.message || 'Error al archivar la lista');
    }
  };

  const handleCreateCard = async (listId: string, title: string) => {
    try {
      const response = await apiClient.post<{ data: { card: Card } }>(`/api/cards/lists/${listId}/cards`, {
        title,
        priority: 'P2',
        module: 'other',
        riskLevel: 'med',
      });
      
      const newCard = response.data.card;
      setCards(prev => [...prev, newCard]);
    } catch (err: any) {
      setError(err.message || 'Error al crear la tarjeta');
      throw err;
    }
  };

  const handleRenameCard = async (cardId: string, newTitle: string) => {
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { title: newTitle });
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, title: newTitle } : card
      ));
    } catch (err: any) {
      setError(err.message || 'Error al renombrar la tarjeta');
      throw err;
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await apiClient.delete(`/api/cards/${cardId}`);
      setCards(prev => prev.filter(card => card.id !== cardId));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la tarjeta');
      throw err;
    }
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId);
    setShowCardModal(true);
  };

  const handleCardUpdated = (updatedCard: CardDetail) => {
    setCards(prev => prev.map(card => 
      card.id === updatedCard.id 
        ? { 
            ...card, 
            title: updatedCard.title,
            description: updatedCard.description,
            dueDate: updatedCard.dueDate,
          }
        : card
    ));
  };

  const handleCardDeleted = (cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
  };

  const loadArchivedCards = async () => {
    if (!id || !showArchivedCards) return;
    
    setIsLoadingArchived(true);
    try {
      const response = await apiClient.get<{ data: { cards: Card[] } }>(`/api/cards/boards/${id}/cards`, {
        params: { status: 'closed' }
      });
      setArchivedCards(response.data.cards || []);
    } catch (err: any) {
      console.error('Error loading archived cards:', err);
      setError(err.message || 'Error al cargar las tarjetas archivadas');
    } finally {
      setIsLoadingArchived(false);
    }
  };

  const handleRestoreCard = async (cardId: string) => {
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { status: 'open' });
      setArchivedCards(prev => prev.filter(card => card.id !== cardId));
      fetchBoardData();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al restaurar la tarjeta');
    }
  };

  const toggleArchivedCards = () => {
    setShowArchivedCards(!showArchivedCards);
  };

  useEffect(() => {
    if (showArchivedCards) {
      loadArchivedCards();
    } else {
      setArchivedCards([]);
    }
  }, [showArchivedCards, id]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('DragEnd Event:', { active: active.id, over: over?.id });
    
    if (!over || active.id === over.id) {
      console.log('No valid drop target or same element');
      setActiveDragId(null);
      return;
    }

    if (active.id.toString().startsWith('list-') || lists.some(l => l.id === active.id)) {
      const oldIndex = lists.findIndex(list => list.id === active.id);
      const newIndex = lists.findIndex(list => list.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newLists = [...lists];
        const [movedList] = newLists.splice(oldIndex, 1);
        newLists.splice(newIndex, 0, movedList);
        
        const updatedLists = newLists.map((list, index) => ({
          ...list,
          position: index,
        }));
        
        setLists(updatedLists);
        
        try {
          await apiClient.post('/api/lists/reorder', {
            listId: active.id,
            newOrder: newIndex,
          });
        } catch (err) {
          setLists(lists);
          setError('Error al reordenar las listas');
        }
      }
    }
    
    else if (cards.some(c => c.id === active.id)) {
      const sourceListId = cards.find(card => card.id === active.id)?.listId;
      
      let targetListId: string | undefined;
      
      if (lists.some(list => list.id === over.id)) {
        targetListId = over.id as string;
      } 
      else if (cards.some(card => card.id === over.id)) {
        targetListId = cards.find(card => card.id === over.id)?.listId;
      }
      else if (over.id.toString().startsWith('list-')) {
        targetListId = over.id.toString().replace('list-', '');
      }
      
      if (sourceListId && targetListId) {
        if (sourceListId === targetListId) {
          const listCards = cards.filter(card => card.listId === sourceListId)
            .sort((a, b) => a.position - b.position);
          
          const oldIndex = listCards.findIndex(card => card.id === active.id);
          const overCard = cards.find(card => card.id === over.id);
          let newIndex = 0;
          
          if (overCard) {
            newIndex = listCards.findIndex(card => card.id === over.id);
          }
          
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newListCards = [...listCards];
            const [movedCard] = newListCards.splice(oldIndex, 1);
            newListCards.splice(newIndex, 0, movedCard);
            
            const updatedCards = newListCards.map((card, index) => ({
              ...card,
              position: index,
            }));
            
            setCards(prev => prev.map(card => {
              const updatedCard = updatedCards.find(c => c.id === card.id);
              return updatedCard || card;
            }));
            
            try {
              await apiClient.post(`/api/cards/${active.id}/move`, {
                toListId: sourceListId,
                position: newIndex,
              });
            } catch (err) {
              fetchBoardData();
              setError('Error al reordenar la tarjeta');
            }
          }
        } else {
          const targetListCards = cards.filter(card => card.listId === targetListId)
            .sort((a, b) => a.position - b.position);
          
          let targetPosition = 0;
          const overCard = cards.find(card => card.id === over.id);
          
          if (overCard && overCard.listId === targetListId) {
            const overIndex = targetListCards.findIndex(card => card.id === over.id);
            targetPosition = overIndex >= 0 ? overIndex : targetListCards.length;
          } else {
            targetPosition = targetListCards.length;
          }
          
          setCards(prev => prev.map(card => {
            if (card.id === active.id) {
              return { ...card, listId: targetListId!, position: targetPosition };
            }
            return card;
          }));
          
          try {
            await apiClient.post(`/api/cards/${active.id}/move`, {
              toListId: targetListId,
              position: targetPosition,
            });
          } catch (err) {
            fetchBoardData();
            setError('Error al mover la tarjeta');
          }
        }
      }
    }
    
    setActiveDragId(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleRetry = () => {
    fetchBoardData();
  };

  const handleBackToBoards = () => {
    navigate('/app');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <NavBar user={user} logout={logout} onBack={handleBackToBoards} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-[#9db0b9]">Cargando tablero...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-dark">
        <NavBar user={user} logout={logout} onBack={handleBackToBoards} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 text-red-500/30 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Error al cargar el tablero</h3>
            <p className="text-[#9db0b9] mb-6 max-w-md mx-auto">{error}</p>
            <div className="flex justify-center space-x-3">
              <Button
                onClick={handleBackToBoards}
                variant="outline"
              >
                Volver a tableros
              </Button>
              <Button
                onClick={handleRetry}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background-dark">
        <NavBar user={user} logout={logout} onBack={handleBackToBoards} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 text-[#3b4b54] mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Tablero no encontrado</h3>
            <p className="text-[#9db0b9] mb-6 max-w-md mx-auto">
              El tablero que buscas no existe o no tienes permisos para verlo.
            </p>
            <Button
              onClick={handleBackToBoards}
            >
              Volver a tableros
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const cardsByList = lists.reduce((acc, list) => {
    acc[list.id] = cards.filter(card => card.listId === list.id)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {} as Record<string, Card[]>);

  const getVisibilityColor = () => {
    switch (board.visibility) {
      case 'public': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'team': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'private': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getVisibilityText = () => {
    switch (board.visibility) {
      case 'public': return 'Público';
      case 'team': return 'Equipo';
      case 'private': return 'Privado';
      default: return board.visibility;
    }
  };

  return (
    <div className="min-h-screen bg-background-dark">
      <NavBar user={user} logout={logout} onBack={handleBackToBoards} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{board.name}</h1>
              {board.description && (
                <p className="text-[#9db0b9] mt-2">{board.description}</p>
              )}
              <div className="flex items-center mt-4 space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getVisibilityColor()}`}>
                  {getVisibilityText()}
                </span>
                {board.updatedAt && (
                  <span className="text-sm text-[#9db0b9] flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Actualizado: {new Date(board.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => {/* Implement invite */}}
                variant="secondary"
                leftIcon={
                  <span className="material-symbols-outlined text-sm">person_add</span>
                }
              >
                Invitar miembros
              </Button>
              <Button
                onClick={() => {/* Implement settings */}}
                variant="outline"
                leftIcon={
                  <span className="material-symbols-outlined text-sm">settings</span>
                }
              >
                Configuración
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-red-400">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="px-3 py-1 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <DndProvider
          items={listIds}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          activeId={activeDragId}
        >
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {lists.sort((a, b) => a.position - b.position).map((list) => {
              const listCards = cardsByList[list.id] || [];
              const cardIds = listCards.map(card => card.id);
              
              return (
                <SortableList
                  key={list.id}
                  list={list}
                  cardIds={cardIds}
                  onRename={handleRenameList}
                  onDelete={() => openDeleteModal(list)}
                  onCreateCard={handleCreateCard}
                >
                  {listCards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onRename={handleRenameCard}
                      onDelete={handleDeleteCard}
                      onClick={() => handleCardClick(card.id)}
                    />
                  ))}
                </SortableList>
              );
            })}
            
            {isCreatingList ? (
              <div className="flex-shrink-0 w-80 bg-[#1c2327]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
                <div className="mb-4">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Título de la lista..."
                    className="w-full px-4 py-2 border border-[#3b4b54] bg-[#111618] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder:text-[#586872]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateList();
                      if (e.key === 'Escape') {
                        setNewListTitle('');
                        setIsCreatingList(false);
                      }
                    }}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCreateList}
                    disabled={!newListTitle.trim()}
                    size="sm"
                  >
                    Crear lista
                  </Button>
                  <Button
                    onClick={() => {
                      setNewListTitle('');
                      setIsCreatingList(false);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingList(true)}
                className="flex-shrink-0 w-80 bg-[#1c2327]/80 backdrop-blur-xl border border-dashed border-[#3b4b54] hover:border-primary/50 rounded-2xl p-4 text-[#9db0b9] hover:text-white transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg mr-2">add</span>
                Añadir lista
              </button>
            )}
          </div>
        </DndProvider>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="material-symbols-outlined text-lg mr-2">archive</span>
                Tarjetas Archivadas
              </h2>
              <p className="text-[#9db0b9] text-sm mt-1">
                Tarjetas que han sido archivadas (status: 'closed'). Puedes restaurarlas cuando lo necesites.
              </p>
            </div>
            <Button
              onClick={toggleArchivedCards}
              variant="secondary"
              leftIcon={
                <span className="material-symbols-outlined text-sm">
                  {showArchivedCards ? 'visibility_off' : 'visibility'}
                </span>
              }
            >
              {showArchivedCards ? 'Ocultar archivadas' : 'Mostrar archivadas'}
            </Button>
          </div>

          {showArchivedCards && (
            <div className="bg-[#111618] border border-[#3b4b54] rounded-xl p-6">
              {isLoadingArchived ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="ml-3 text-[#9db0b9]">Cargando tarjetas archivadas...</p>
                </div>
              ) : archivedCards.length > 0 ? (
                <div className="space-y-4">
                  {archivedCards.map(card => (
                    <div key={card.id} className="flex items-center justify-between p-4 bg-[#1a2226] border border-[#3b4b54] rounded-lg hover:border-primary/30 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-[#9db0b9] mr-3">description</span>
                          <div>
                            <h4 className="font-medium text-white">{card.title}</h4>
                            {card.description && (
                              <p className="text-sm text-[#9db0b9] mt-1 line-clamp-2">{card.description}</p>
                            )}
                            {card.dueDate && (
                              <p className="text-xs text-[#586872] mt-1">
                                Vencimiento: {new Date(card.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={() => handleRestoreCard(card.id)}
                          size="sm"
                          variant="outline"
                          leftIcon={<span className="material-symbols-outlined text-sm">restore</span>}
                        >
                          Restaurar
                        </Button>
                        <button
                          onClick={() => handleCardClick(card.id)}
                          className="text-[#9db0b9] hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
                          title="Ver detalles"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 text-[#3b4b54] mb-4">
                    <span className="material-symbols-outlined text-4xl">archive</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No hay tarjetas archivadas</h3>
                  <p className="text-[#9db0b9] max-w-md mx-auto">
                    Las tarjetas que archives aparecerán aquí. Puedes restaurarlas en cualquier momento.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showDeleteModal && listToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={closeDeleteModal}
            />
            
            <div className="relative transform overflow-hidden rounded-2xl bg-gradient-to-b from-[#1c2327] to-[#111618] border border-white/10 shadow-2xl transition-all w-full max-w-md">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-400 text-lg">warning</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Eliminar lista</h3>
                    <p className="text-sm text-[#9db0b9] mt-1">Esta acción no se puede deshacer</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-[#9db0b9]">
                  ¿Estás seguro de que deseas eliminar la lista <span className="font-medium text-white">"{listToDelete.name}"</span>?
                </p>
                
                {cardsInListToDelete > 0 ? (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start">
                      <span className="material-symbols-outlined text-yellow-400 text-lg mr-2">error</span>
                      <div>
                        <p className="text-yellow-400 font-medium">Lista no vacía</p>
                        <p className="text-yellow-400/80 text-sm mt-1">
                          Esta lista contiene <span className="font-bold">{cardsInListToDelete} tarjeta(s)</span>.
                          Para eliminarla, primero debes mover todas las tarjetas a otra lista o eliminarlas.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start">
                      <span className="material-symbols-outlined text-blue-400 text-lg mr-2">info</span>
                      <p className="text-blue-400 text-sm">
                        La lista está vacía y puede ser eliminada de forma segura.
                      </p>
                    </div>
                  </div>
                )}
                
                {deleteError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start">
                      <span className="material-symbols-outlined text-red-400 text-lg mr-2">error</span>
                      <p className="text-red-400 text-sm">{deleteError}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-white/5 bg-[#111618]/50 flex justify-end space-x-3">
                <Button
                  onClick={closeDeleteModal}
                  variant="outline"
                  size="sm"
                  className="px-4"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmArchiveList}
                  variant="danger"
                  size="sm"
                  className="px-4"
                  disabled={cardsInListToDelete > 0}
                  leftIcon={<span className="material-symbols-outlined text-sm">archive</span>}
                >
                  {cardsInListToDelete > 0 ? 'Mover tarjetas primero' : 'Archivar lista'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardModal
        cardId={selectedCardId || ''}
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onCardUpdated={handleCardUpdated}
        onCardDeleted={handleCardDeleted}
      />
    </div>
  );
};

const NavBar: React.FC<{ user: any; logout: () => void; onBack: () => void }> = ({ user, logout, onBack }) => (
  <nav className="bg-[#1c2327] border-b border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 text-[#9db0b9] hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <div className="text-xl font-bold text-white">Board Manager</div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-[#9db0b9]">
            Hola, <span className="font-medium text-white">{user?.name || user?.email}</span>
          </div>
          <Button
            onClick={logout}
            variant="danger"
            size="sm"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  </nav>
);

export default BoardDetailPage;
