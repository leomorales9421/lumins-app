import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import type { Board, List, Card as CardType } from '../types/board';
import { useModuleLoading } from '../contexts/NavigationLoaderContext';
import ErrorView from '../components/ui/ErrorView';
import { BrandLogo } from '../components/ui/BrandLogo';
import {
  ChevronLeft,
  ChevronRight,
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
  Check,
  ArchiveRestore,
  X
} from 'lucide-react';

import { toast } from 'sonner';
import { useStructuredLogger } from '../components/NotificationProvider';

import {
  DndContext,
  closestCorners,
  closestCenter,
  pointerWithin,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent, CollisionDetection, DropAnimation } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { SortableList } from '../components/dnd/SortableList';
import { SortableCard, CardView } from '../components/dnd/SortableCard';
import UserAvatar from '../components/ui/UserAvatar';
import CardDetailModal from '../components/CardDetailModal';
import MembersModal from '../components/MembersModal';
import BoardOptionsMenu from '../components/BoardOptionsMenu';
import ConfirmActionModal from '../components/ConfirmActionModal';
import ArchivedItemsModal from '../components/ArchivedItemsModal';
import { motion, AnimatePresence } from 'framer-motion';

import { useBoardPermissions } from '../hooks/useBoardPermissions';
import { useBoardSocket } from '../hooks/useBoardSocket';
import { useBoardTelemetry } from '../hooks/useBoardTelemetry';
import { emitBoardBackgroundChange, normalizeBoardBackground } from '../lib/board-backgrounds';

const getBoardBackgroundCacheKey = (boardId: string) => `lumins_board_background:${boardId}`;

// In-memory cache for instant 0ms board re-entry (Stale-While-Revalidate)
const boardMemoryCache = new Map<string, { board: Board; userRole: string }>();

const BoardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize Socket.io for this board
  useBoardSocket(id);

  const cachedData = id ? boardMemoryCache.get(id) : null;
  const [board, setBoard] = useState<Board | null>(cachedData ? cachedData.board : null);
  const boardRef = useRef<Board | null>(board);
  useEffect(() => { boardRef.current = board; }, [board]);
  const [userRole, setUserRole] = useState<string>(cachedData ? cachedData.userRole : 'viewer');
  const [lists, setLists] = useState<List[]>(() => {
    if (!cachedData?.board?.lists) return [];
    return (cachedData.board.lists || []).map(list => ({
      ...list,
      cards: (list.cards || []).filter(card => card.status === 'open')
    }));
  });
  const [isLoading, setIsLoading] = useState(!cachedData);
  useModuleLoading(isLoading, 'board-detail');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    () => searchParams.get('cardId') || searchParams.get('card') || null
  );
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeList, setActiveList] = useState<List | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalContainer, setOriginalContainer] = useState<string | null>(null);

  // Real-time Board Performance Sentinel (Vigilante)
  useBoardTelemetry({
    board,
    lists,
    isLoading,
    isDragging: !!activeCard || !!activeList
  });

  // New States for Logic
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobileBoardMenuOpen, setIsMobileBoardMenuOpen] = useState(false);
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);
  const [archiveCardCandidate, setArchiveCardCandidate] = useState<{ id: string; title: string } | null>(null);
  const [isArchivingCard, setIsArchivingCard] = useState(false);
  const [archiveCardsCandidate, setArchiveCardsCandidate] = useState<{
    listId: string;
    listName: string;
    count: number;
    onlyCompleted: boolean;
  } | null>(null);
  const [isArchivingCards, setIsArchivingCards] = useState(false);
  const [archiveListCandidate, setArchiveListCandidate] = useState<{ id: string; name: string } | null>(null);
  const [isArchivingList, setIsArchivingList] = useState(false);
  const [deleteListCandidate, setDeleteListCandidate] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingList, setIsDeletingList] = useState(false);

  const { canManageBoard, canEditContent, isReadOnly } = useBoardPermissions(board?.id, userRole);
  const canEdit = canEditContent;
  const isAdmin = canManageBoard;

  const [isListNavOpen, setIsListNavOpen] = useState(false);
  const { logSuccess } = useStructuredLogger();

  const scrollToList = (listId: string) => {
    const element = document.querySelector(`[data-list-id="${listId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setIsListNavOpen(false);
  };
  // Grab to scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only scroll if we're clicking on the main canvas background
    if ((e.target as HTMLElement).id !== 'board-canvas' && !(e.target as HTMLElement).classList.contains('canvas-spacer')) return;

    setIsPanning(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = x - startX; // 1:1 direct tracking for natural grab-to-scroll
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    const target = e.target as HTMLElement;
    // Scroll horizontally if wheeling over canvas background or spacers
    if (target.id === 'board-canvas' || target.classList.contains('canvas-spacer')) {
      if (e.deltaY !== 0) {
        scrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const listsRef = useRef<List[]>(lists);
  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  const fetchBoard = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent && !boardRef.current) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await apiClient.get<{ data: { board: Board, userRole: string } }>(`/api/boards/${id}`);
      setBoard(response.data.board);
      setUserRole(response.data.userRole);

      // Update memory cache
      boardMemoryCache.set(id, { board: response.data.board, userRole: response.data.userRole });

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
    } catch (err: any) {
      if (id) boardMemoryCache.delete(id);
      setBoard(null);
      setLists([]);
      setSelectedCardId(null);
      const errMsg = err?.response?.data?.message || 'No tienes permiso para acceder a este tablero o has sido removido.';
      toast.error('Acceso denegado', { description: errMsg });
      navigate('/app', { replace: true });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, navigate, filterUserId]); // Removed board from dependencies

  useEffect(() => { fetchBoard(); }, [fetchBoard, filterUserId]);

  // Real-time eviction listener if removed while on page
  useEffect(() => {
    const handlePermissionUpdate = (e: any) => {
      const { type, resourceId } = e.detail || {};
      if (
        (type === 'BOARD_REMOVED' && resourceId === id) ||
        (type === 'WORKSPACE_REMOVED' && boardRef.current?.workspaceId === resourceId)
      ) {
        if (id) boardMemoryCache.delete(id);
        setBoard(null);
        setLists([]);
        setSelectedCardId(null);
        toast.error('Acceso denegado', {
          description: type === 'BOARD_REMOVED'
            ? 'Has sido eliminado de este tablero.'
            : 'Has sido eliminado del espacio de trabajo al que pertenece este tablero.',
        });
        navigate('/app', { replace: true });
      }
    };

    window.addEventListener('lumins:permission-updated', handlePermissionUpdate);
    return () => {
      window.removeEventListener('lumins:permission-updated', handlePermissionUpdate);
    };
  }, [id, navigate]);

  // Restore the last known background immediately on re-entry, before the board fetch resolves.
  useEffect(() => {
    if (!id) return;

    try {
      const cachedBackground = sessionStorage.getItem(getBoardBackgroundCacheKey(id));
      if (cachedBackground) {
        emitBoardBackgroundChange(normalizeBoardBackground(cachedBackground));
      }
    } catch {
      // Ignore sessionStorage read failures.
    }
  }, [id]);

  // Sync background with MainLayout whenever it changes.
  // Do not clear in this cleanup, because React will run it before applying
  // the next effect and can briefly overwrite a valid background with null.
  useEffect(() => {
    if (!board) return;

    const normalizedBackground = normalizeBoardBackground(board.background);

    try {
      sessionStorage.setItem(getBoardBackgroundCacheKey(board.id), normalizedBackground || '');
    } catch {
      // Ignore sessionStorage write failures.
    }

    emitBoardBackgroundChange(normalizedBackground);
  }, [board]);

  // Handle real-time updates from WebSockets
  useEffect(() => {
    const handleBoardUpdate = (e: any) => {
      const { boardId: updatedBoardId } = e.detail;
      if (updatedBoardId === id) {
        console.log('BoardDetailPage: Real-time update triggered');
        fetchBoard();
      }
    };

    window.addEventListener('lumins:board-updated', handleBoardUpdate);
    return () => {
      window.removeEventListener('lumins:board-updated', handleBoardUpdate);
    };
  }, [id, fetchBoard]);

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
    const cardId = searchParams.get('cardId') || searchParams.get('card');
    if (cardId) {
      setSelectedCardId(cardId);
    } else {
      setSelectedCardId(null);
    }
  }, [searchParams]);

  const handleOpenCard = (cardId: string) => {
    setSelectedCardId(cardId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('cardId', cardId);
    newParams.delete('card');
    setSearchParams(newParams, { replace: true });
  };

  const handleCloseModal = () => {
    setSelectedCardId(null);
    // Remove both cardId and legacy card from URL when closing modal
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('cardId');
    newParams.delete('card');
    setSearchParams(newParams, { replace: true });
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
    duration: 250,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
      disabled: !canEdit
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
      disabled: !canEdit
    })
  );

  const findContainer = (lists: List[], id: string) => {
    if (lists.find((list) => list.id === id)) return id;
    return lists.find((list) => (list.cards || []).some((card) => card.id === id))?.id;
  };

  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      // 1. If dragging a list (smooth horizontal column reordering by center overlap)
      if (args.active.data.current?.type === 'list') {
        const listContainers = args.droppableContainers.filter(
          (container) =>
            container.data.current?.type === 'list' ||
            lists.some((l) => l.id === container.id)
        );

        // Smooth horizontal-only center distance calculation:
        // Requires dragging column past center threshold (~50%) before displacing adjacent list,
        // preventing premature or jittery swaps.
        const activeRect = args.active.rect.current.translated;
        if (activeRect) {
          const activeCenterX = activeRect.left + activeRect.width / 2;
          let closestContainer: any = null;
          let minDistance = Infinity;

          for (const container of listContainers) {
            const rect = args.droppableRects.get(container.id);
            if (rect) {
              const containerCenterX = rect.left + rect.width / 2;
              const distance = Math.abs(activeCenterX - containerCenterX);
              if (distance < minDistance) {
                minDistance = distance;
                closestContainer = container;
              }
            }
          }

          if (closestContainer) {
            return [{ id: closestContainer.id }];
          }
        }

        return closestCenter({ ...args, droppableContainers: listContainers });
      }

      // 2. If dragging a card (multi-container / vertical reordering)
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }

      return closestCorners(args);
    },
    [lists]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    const container = findContainer(lists, activeId);
    setOriginalContainer(container || null);

    // Haptic feedback for mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    if (active.data.current?.type === 'card') {
      setActiveCard(active.data.current.card);
      setActiveList(null);
    } else if (active.data.current?.type === 'list') {
      setActiveList(active.data.current.list);
      setActiveCard(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Do nothing for list dragging in drag-over
    if (active.data.current?.type === 'list') return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentLists = listsRef.current;
    const activeContainer = findContainer(currentLists, activeId);
    const overContainer = findContainer(currentLists, overId);

    // If both are in the same container or either not found, exit early WITHOUT triggering setLists
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

      if (activeIndex === -1) return prev;

      let newIndex: number;
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
    setActiveList(null);

    if (!over) {
      setOriginalContainer(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type;

    if (activeType === 'list') {
      const targetListId = lists.some((l) => l.id === overId)
        ? overId
        : findContainer(lists, overId);

      if (targetListId && activeId !== targetListId) {
        const oldIndex = lists.findIndex((l) => l.id === activeId);
        const newIndex = lists.findIndex((l) => l.id === targetListId);

        if (oldIndex !== -1 && newIndex !== -1) {
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
      }
      setOriginalContainer(null);
      return;
    }

    const currentLists = listsRef.current;
    const overContainer = findContainer(currentLists, overId);

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
        logSuccess('Tarjeta movida', 'El movimiento entre listas se ha guardado');
      }
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
      const res = await apiClient.post<{ data: { card: any } }>(`/api/cards/lists/${listId}/cards`, { title });
      if (res.data?.card) {
        setLists(prev => prev.map(l => {
          if (l.id !== listId) return l;
          return { ...l, cards: [...(l.cards || []), res.data.card] };
        }));
      }
      fetchBoard();
    } catch (err) {
      console.error('Error adding card:', err);
      throw err;
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

  const requestDeleteList = (listId: string, listName?: string) => {
    const name = listName || listsRef.current.find(l => l.id === listId)?.name || 'esta lista';
    setDeleteListCandidate({ id: listId, name });
  };

  const handleConfirmDeleteList = async () => {
    if (!deleteListCandidate) return;
    setIsDeletingList(true);
    try {
      await apiClient.delete(`/api/lists/${deleteListCandidate.id}`);
      fetchBoard();
      toast.success('Lista eliminada exitosamente');
      setDeleteListCandidate(null);
    } catch (err: any) {
      console.error('Error deleting list:', err);
      toast.error('Error al eliminar lista', { description: err.response?.data?.message || 'No se pudo eliminar la lista' });
    } finally {
      setIsDeletingList(false);
    }
  };

  const requestArchiveList = (listId: string, listName?: string) => {
    const name = listName || listsRef.current.find(l => l.id === listId)?.name || 'esta lista';
    setArchiveListCandidate({ id: listId, name });
  };

  const handleConfirmArchiveList = async () => {
    if (!archiveListCandidate) return;
    setIsArchivingList(true);
    try {
      await apiClient.patch(`/api/lists/${archiveListCandidate.id}/archive`);
      fetchBoard();
      toast.success('Lista archivada exitosamente', {
        description: `La lista "${archiveListCandidate.name}" se puede restaurar desde "Elementos Archivados".`
      });
      setArchiveListCandidate(null);
    } catch (err: any) {
      console.error('Error archiving list:', err);
      toast.error('Error al archivar lista', { description: err.response?.data?.message || 'No se pudo archivar la lista' });
    } finally {
      setIsArchivingList(false);
    }
  };

  const requestArchiveCardFromBoard = (cardId: string) => {
    const cardTitle = listsRef.current
      .flatMap((list) => list.cards || [])
      .find((card) => card.id === cardId)?.title || 'esta tarjeta';

    setArchiveCardCandidate({ id: cardId, title: cardTitle });
  };

  const handleArchiveCardFromBoard = async () => {
    if (!archiveCardCandidate) return;

    setIsArchivingCard(true);
    try {
      await apiClient.patch(`/api/cards/${archiveCardCandidate.id}`, { status: 'closed' });
      fetchBoard();
      toast.success('Tarjeta archivada');
      setArchiveCardCandidate(null);
    } catch (err) {
      console.error('Error archiving card:', err);
      toast.error('Error', { description: 'No se pudo archivar la tarjeta' });
    } finally {
      setIsArchivingCard(false);
    }
  };

  const requestArchiveAllCardsFromList = (
    listId: string,
    listName: string,
    count: number,
    onlyCompleted: boolean = false
  ) => {
    if (count <= 0) return;
    setArchiveCardsCandidate({ listId, listName, count, onlyCompleted });
  };

  const handleConfirmArchiveCards = async () => {
    if (!archiveCardsCandidate) return;

    setIsArchivingCards(true);
    try {
      const { listId, count, onlyCompleted } = archiveCardsCandidate;
      await apiClient.post(`/api/lists/${listId}/archive-cards`, { onlyCompleted });
      await fetchBoard();
      toast.success(
        onlyCompleted
          ? `${count} tarjeta(s) completada(s) archivada(s)`
          : `${count} tarjeta(s) archivada(s) exitosamente`,
        {
          description: 'Puedes consultarlas o restaurarlas en cualquier momento desde Elementos Archivados.'
        }
      );
      setArchiveCardsCandidate(null);
    } catch (err: any) {
      console.error('Error archiving cards:', err);
      toast.error('Error al archivar tarjetas', {
        description: err.response?.data?.message || 'No se pudieron archivar las tarjetas'
      });
    } finally {
      setIsArchivingCards(false);
    }
  };

  const modalInitialData = useMemo(() => {
    if (!selectedCardId || !board) return undefined;
    return {
      title: (board.lists || []).flatMap(l => l.cards || []).find(c => c.id === selectedCardId)?.title || 'Cargando...',
      listName: (board.lists || []).find(l => (l.cards || []).some(c => c.id === selectedCardId))?.name || 'Desconocida'
    };
  }, [selectedCardId, board]);

  const modalBoardMembers = useMemo(() => {
    return board?.members?.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      initials: (m.user.name || 'U').charAt(0).toUpperCase()
    }));
  }, [board?.members]);

  if (isLoading) {
    return null;
  }

  if (!board) {
    return (
      <ErrorView
        code="404"
        title="No pudimos cargar este tablero"
        description="Es posible que el tablero no exista, haya sido eliminado o no tengas permisos para acceder."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col h-full font-sans"
    >

      {/* Floating Compact Board Bar */}
      <header className="mx-3 sm:mx-5 mt-2 mb-1 h-11 bg-[#14171F]/65 backdrop-blur-xl border border-white/15 rounded-xl px-2.5 sm:px-3.5 flex items-center justify-between flex-shrink-0 z-20 text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
        {/* Left Side: Sidebar Toggle, Back, Title & Visibility */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial mr-2 sm:mr-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/15 active:scale-95 rounded-lg text-white/85 hover:text-white transition-all flex-shrink-0 cursor-pointer"
            title="Menú de Lumins"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={15} />
          </button>

          <Link
            to="/app"
            className="flex items-center flex-shrink-0 hover:opacity-90 transition-opacity"
            title="Ir al inicio de Lumins"
          >
            <BrandLogo size="xs" variant="light-text" showWordmark={false} className="sm:hidden" />
            <BrandLogo size="xs" variant="light-text" className="hidden sm:inline-flex" />
          </Link>

          <span className="h-3.5 w-px bg-white/15 flex-shrink-0" />

          <Link
            to={`/w/${board.workspaceId}/dashboard`}
            className="hidden md:flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-semibold text-white/65 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            title="Volver a tableros"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            <span>Tableros</span>
          </Link>

          <span className="hidden md:block h-3.5 w-px bg-white/15 flex-shrink-0" />

          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
            <div
              style={{
                backgroundColor: 'var(--lumins-accent)',
                color: 'var(--lumins-accent-on)',
              }}
              className="w-6 h-6 rounded-md flex items-center justify-center shadow-sm flex-shrink-0"
            >
              <span className="font-black text-[11px]">
                {Array.from(board.name.replace(/^[\p{Emoji}\p{Extended_Pictographic}\s]+/u, '') || board.name)[0]?.toUpperCase() || 'L'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate tracking-tight">
                {board.name}
              </h1>

              {/* Visibility Selector */}
              <div className="relative flex-shrink-0">
                {isAdmin ? (
                  <button
                    onClick={() => setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)}
                    className="p-1 sm:p-1.5 rounded-[4px] bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2"
                    title={board.visibility === 'PRIVATE' ? 'Click para cambiar visibilidad (Privado)' : 'Click para cambiar visibilidad (Espacio de trabajo)'}
                  >
                    {board.visibility === 'PRIVATE' ? <Lock size={13} className="sm:w-3.5 sm:h-3.5" /> : <Building2 size={13} className="sm:w-3.5 sm:h-3.5" />}
                  </button>
                ) : (
                  <div
                    className="p-1 sm:p-1.5 rounded-[4px] bg-white/5 border border-white/10 text-white/40 flex items-center gap-2 cursor-default"
                    title={board.visibility === 'PRIVATE' ? 'Este tablero es Privado' : 'Este tablero es visible para el Espacio de Trabajo'}
                  >
                    {board.visibility === 'PRIVATE' ? <Lock size={13} className="sm:w-3.5 sm:h-3.5" /> : <Building2 size={13} className="sm:w-3.5 sm:h-3.5" />}
                  </div>
                )}

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
                            onClick={() => { handleUpdateVisibility('PRIVATE'); setIsVisibilityDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between p-2 rounded-[4px] text-xs font-bold transition-all ${board.visibility === 'PRIVATE' ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                          >
                            <div className="flex items-center gap-2">
                              <Lock size={14} />
                              <span>Privado</span>
                            </div>
                            {board.visibility === 'PRIVATE' && <Check size={14} />}
                          </button>
                          <button
                            onClick={() => { handleUpdateVisibility('WORKSPACE'); setIsVisibilityDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between p-2 rounded-[4px] text-xs font-bold transition-all ${board.visibility === 'WORKSPACE' ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
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

              {(isSaving || isRefreshing) && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 animate-in fade-in zoom-in duration-300 flex-shrink-0">
                  <div className={`w-1.5 h-1.5 rounded animate-pulse ${isRefreshing ? 'bg-[var(--lumins-accent)]' : 'bg-emerald-400'}`} />
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-tighter">
                    {isRefreshing ? 'Actualizando' : 'Salvando'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Right Actions (md:hidden) */}
        <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
          {/* Quick Filter */}
          <div className="relative">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded border text-sm font-bold transition-all active:scale-95 shadow-sm ${filterUserId || isFiltersOpen
                ? 'bg-white/20 border-white/40 text-white ring-2 ring-white/10'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/15'
                }`}
              title="Filtrar tarjetas"
            >
              <Filter size={15} strokeWidth={2.5} className={filterUserId ? 'text-[var(--lumins-accent)]' : ''} />
            </button>

            <AnimatePresence>
              {isFiltersOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFiltersOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-auto sm:mt-3 w-64 bg-[#1C1F26]/95 backdrop-blur-2xl rounded shadow-2xl border border-white/10 py-3 z-50 overflow-hidden"
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
                          className={`w-full px-2 py-2 flex items-center gap-3 hover:bg-white/5 rounded transition-all text-sm ${filterUserId === member.userId ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] font-bold' : 'text-white/70 hover:text-white'}`}
                        >
                          <div className={`p-0.5 rounded ${filterUserId === member.userId ? 'ring-2 ring-[var(--lumins-accent)]' : ''}`}>
                            <UserAvatar name={member.user.name} avatarUrl={member.user.avatarUrl} size="sm" />
                          </div>
                          <span className="truncate">{member.user.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Members Button (tap to open Members modal) */}
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 active:scale-95 shadow-sm relative"
            title="Miembros del tablero"
          >
            {board.members && board.members.length > 0 ? (
              <div className="w-6 h-6 rounded overflow-hidden">
                <UserAvatar
                  name={board.members[0].user.name}
                  avatarUrl={board.members[0].user.avatarUrl}
                  size="xs"
                />
              </div>
            ) : (
              <Users size={15} strokeWidth={2.5} />
            )}
            {(board.members?.length || 0) > 1 && (
              <span
                style={{
                  backgroundColor: 'var(--lumins-accent)',
                  color: 'var(--lumins-accent-on)',
                }}
                className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 text-[9px] font-black rounded-full flex items-center justify-center border border-zinc-900 shadow"
              >
                {board.members?.length}
              </span>
            )}
          </button>

          {/* More Options Button (...) */}
          <button
            onClick={() => setIsMobileBoardMenuOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 active:scale-95 shadow-sm"
            title="Más opciones del tablero"
          >
            <MoreHorizontal size={17} strokeWidth={2.5} />
          </button>
        </div>

        {/* Desktop Right Actions (hidden md:flex) */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          {/* Members Avatars */}
          <div
            onClick={() => setIsMembersModalOpen(true)}
            className="flex items-center -space-x-2 hover:space-x-0.5 transition-all cursor-pointer px-1 py-0.5 hover:bg-white/10 rounded-lg"
            title="Miembros del tablero"
          >
            {board.members?.slice(0, 3).map((member) => (
              <div
                key={member.userId}
                className="w-6 h-6 rounded-full border border-black/40 bg-zinc-800 flex items-center justify-center overflow-hidden shadow-sm"
              >
                <UserAvatar
                  name={member.user.name}
                  avatarUrl={member.user.avatarUrl}
                  size="xs"
                />
              </div>
            ))}
            {(board.members?.length || 0) > 3 && (
              <div className="w-6 h-6 rounded-full border border-black/40 bg-[#2D3139] flex items-center justify-center text-[9px] font-black text-white/90">
                +{(board.members?.length || 0) - 3}
              </div>
            )}
          </div>

          <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 text-[9.5px] font-bold uppercase tracking-wider text-white/75">
            {userRole === 'admin' ? 'Admin' : userRole === 'editor' ? 'Miembro' : 'Invitado'}
          </span>

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          {/* Compact Icon Toolbar */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsArchivedModalOpen(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-all active:scale-95 cursor-pointer"
              title="Elementos archivados"
            >
              <ArchiveRestore size={15} />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${filterUserId || isFiltersOpen
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                title={filterUserId ? 'Filtrado activo' : 'Filtrar por miembro'}
              >
                <Filter size={15} className={filterUserId ? 'text-[var(--lumins-accent)]' : ''} />
              </button>

              <AnimatePresence>
                {isFiltersOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsFiltersOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-[#1C1F26]/95 backdrop-blur-2xl rounded shadow-2xl border border-zinc-200 dark:border-white/10 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-4 pb-2 mb-2 border-b border-zinc-200/70 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-[0.2em]">Filtrar por</span>
                        {filterUserId && (
                          <button onClick={() => setFilterUserId(null)} className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-tighter hover:underline">Limpiar</button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto px-2 space-y-1">
                        <button
                          onClick={() => { setFilterUserId(null); setIsFiltersOpen(false); }}
                          className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-colors text-sm text-zinc-700 dark:text-white/70"
                        >
                          <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold">All</div>
                          Todos los miembros
                        </button>
                        {board.members?.map(member => (
                          <button
                            key={member.userId}
                            onClick={() => { setFilterUserId(member.userId); setIsFiltersOpen(false); }}
                            className={`w-full px-2 py-2 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-all text-sm ${filterUserId === member.userId ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] font-bold' : 'text-zinc-700 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white'}`}
                          >
                            <div className={`p-0.5 rounded ${filterUserId === member.userId ? 'ring-2 ring-[var(--lumins-accent)]' : ''}`}>
                              <UserAvatar name={member.user.name} avatarUrl={member.user.avatarUrl} size="sm" />
                            </div>
                            <span className="truncate">{member.user.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setIsMembersModalOpen(true)}
              style={{
                backgroundColor: 'var(--lumins-accent)',
                color: 'var(--lumins-accent-on)',
              }}
              className="flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-bold transition-all hover:brightness-95 active:scale-95 shadow-sm cursor-pointer"
              title="Compartir y miembros"
            >
              <Users size={13} strokeWidth={2.5} />
              <span className="hidden lg:inline">Compartir</span>
            </button>

            {isAdmin && (
              <BoardOptionsMenu
                board={board}
                onUpdate={fetchBoard}
                workspaceRole={userRole}
                onUpdateBoard={(updatedData) => setBoard(prev => prev ? { ...prev, ...updatedData } : null)}
              />
            )}

            {/* List Navigator for quick jump */}
            <div className="relative group">
              <button
                onClick={() => setIsListNavOpen(!isListNavOpen)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${isListNavOpen
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                title="Navegar por listas"
              >
                <Menu size={15} />
              </button>

              <AnimatePresence>
                {isListNavOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsListNavOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-[#1C1F26]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-zinc-200 dark:border-white/10 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-4 pb-2 mb-2 border-b border-zinc-200/70 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-[0.2em]">Saltar a lista</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto px-2 space-y-1 custom-scrollbar">
                        {lists.map(list => (
                          <button
                            key={list.id}
                            onClick={() => scrollToList(list.id)}
                            className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all text-sm text-zinc-700 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white group"
                          >
                            <span className="truncate font-bold">{list.name}</span>
                            <span className="text-[10px] bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 dark:text-white/40 group-hover:text-zinc-700 dark:group-hover:text-white/60 transition-colors">
                              {list.cards?.length || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Native Mobile Board Options Sheet (md:hidden) */}
      <AnimatePresence>
        {isMobileBoardMenuOpen && (
          <motion.div
            key="mobile-board-sheet-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed inset-0 z-[100] flex items-end justify-center"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileBoardMenuOpen(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.22)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-zinc-200/80 dark:border-white/10 z-10 max-h-[85dvh] flex flex-col overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            >
              {/* Pull handle */}
              <div
                className="w-full flex items-center justify-center pt-3 pb-1 cursor-pointer shrink-0"
                onClick={() => setIsMobileBoardMenuOpen(false)}
              >
                <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-white/20" />
              </div>

              {/* Sheet Header */}
              <div className="px-5 py-3 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={{
                      backgroundColor: 'var(--lumins-accent)',
                      color: 'var(--lumins-accent-on)',
                    }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 shadow"
                  >
                    {board.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{board.name}</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-white/50 flex items-center gap-1.5">
                      {board.visibility === 'PRIVATE' ? <Lock size={11} /> : <Building2 size={11} />}
                      <span>{board.visibility === 'PRIVATE' ? 'Tablero Privado' : 'Espacio de Trabajo'}</span>
                      <span>•</span>
                      <span>{userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Miembro' : 'Invitado'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileBoardMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-white/60 active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sheet Body */}
              <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {/* List Navigator */}
                <div>
                  <span className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-wider block mb-2 px-1">
                    Saltar a lista ({lists.length})
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-1 bg-zinc-100/80 dark:bg-white/5 rounded-xl border border-zinc-200/70 dark:border-white/5">
                    {lists.map(list => (
                      <button
                        key={list.id}
                        onClick={() => {
                          scrollToList(list.id);
                          setIsMobileBoardMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-left hover:bg-white dark:hover:bg-white/10 active:bg-zinc-200/70 dark:active:bg-white/15 transition-all group"
                      >
                        <span className="text-xs font-semibold text-zinc-700 dark:text-white/80 group-hover:text-zinc-900 dark:group-hover:text-white truncate">
                          {list.name}
                        </span>
                        <span className="text-[10px] font-bold bg-zinc-200/80 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-600 dark:text-white/50">
                          {list.cards?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Board Actions */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-wider block mb-2 px-1">
                    Acciones del tablero
                  </span>

                  <button
                    onClick={() => {
                      setIsMobileBoardMenuOpen(false);
                      setIsArchivedModalOpen(true);
                    }}
                    className="w-full p-3 rounded-xl bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.99] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] flex items-center justify-center">
                        <ArchiveRestore size={16} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-zinc-900 dark:text-white">Elementos archivados</div>
                        <div className="text-[11px] text-zinc-500 dark:text-white/50">Ver o restaurar tarjetas y listas</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400 dark:text-white/30" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileBoardMenuOpen(false);
                      setIsMembersModalOpen(true);
                    }}
                    className="w-full p-3 rounded-xl bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.99] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-zinc-900 dark:text-white">Miembros del tablero</div>
                        <div className="text-[11px] text-zinc-500 dark:text-white/50">{board.members?.length || 0} personas colaborando</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400 dark:text-white/30" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsMobileBoardMenuOpen(false);
                        setTimeout(() => setIsSettingsDrawerOpen(true), 60);
                      }}
                      className="w-full p-3 rounded-xl bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.99] flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Settings size={16} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-zinc-900 dark:text-white">Configuración del tablero</div>
                          <div className="text-[11px] text-zinc-500 dark:text-white/50">Fondo, permisos y administración</div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-zinc-400 dark:text-white/30" />
                    </button>
                  )}
                </div>

                {/* Visibility Toggle if Admin */}
                {isAdmin && (
                  <div className="pt-2 border-t border-zinc-200/80 dark:border-white/5">
                    <span className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-wider block mb-2 px-1">
                      Visibilidad
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          handleUpdateVisibility('PRIVATE');
                          setIsMobileBoardMenuOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${board.visibility === 'PRIVATE'
                          ? 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow'
                          : 'bg-zinc-100/80 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-white/60 hover:bg-zinc-200/70 dark:hover:bg-white/10'
                          }`}
                      >
                        <Lock size={14} />
                        <span>Privado</span>
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateVisibility('WORKSPACE');
                          setIsMobileBoardMenuOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${board.visibility === 'WORKSPACE'
                          ? 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)] shadow'
                          : 'bg-zinc-100/80 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-white/60 hover:bg-zinc-200/70 dark:hover:bg-white/10'
                          }`}
                      >
                        <Building2 size={14} />
                        <span>Espacio de Trabajo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Board Settings Bottom Sheet (rendered outside hidden md:flex) */}
      {isAdmin && (
        <BoardOptionsMenu
          board={board}
          onUpdate={fetchBoard}
          workspaceRole={userRole}
          onUpdateBoard={(updatedData) => setBoard(prev => prev ? { ...prev, ...updatedData } : null)}
          mobileOnly
          externalOpen={isSettingsDrawerOpen}
          onExternalClose={() => setIsSettingsDrawerOpen(false)}
        />
      )}

      {board.archived && (
        <div className="mx-3 sm:mx-5 mt-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 dark:text-amber-100">
          <div className="flex items-center gap-2 font-semibold">
            <ArchiveRestore size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Este tablero está archivado. No aparece en tableros activos, estadísticas, calendario ni recordatorios.
            </span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await apiClient.patch(`/api/boards/${board.id}/unarchive`);
                  toast.success('Tablero restaurado');
                  setBoard((prev) => (prev ? { ...prev, archived: false, archivedAt: null } : null));
                } catch {
                  toast.error('No se pudo restaurar el tablero');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Restaurar tablero
            </button>
          )}
        </div>
      )}

      {/* Canvas Area (Lists) */}
      <main
        id="board-canvas"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar px-3 sm:px-5 pt-2.5 pb-5 transition-all duration-300 bg-transparent ${isPanning ? 'cursor-grabbing select-none' : 'cursor-default'}`}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-3 h-full pb-4">
            <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => (
                <SortableList
                  key={list.id}
                  list={list}
                  onCardClick={handleOpenCard}
                  onAddCard={handleAddCard}
                  onUpdateList={handleUpdateList}
                  onArchiveList={requestArchiveList}
                  onDeleteList={requestDeleteList}
                  onArchiveCard={requestArchiveCardFromBoard}
                  onArchiveAllCards={requestArchiveAllCardsFromList}
                  canEdit={canEditContent}
                />
              ))}
            </SortableContext>

            {canEdit && (
              isAddingList ? (
                <form onSubmit={handleAddList} className="w-[82vw] sm:w-[272px] flex-shrink-0 bg-[#F1F2F4]/95 dark:bg-[#16181D]/92 backdrop-blur-md rounded-xl border border-black/5 dark:border-white/10 p-2.5 h-fit shadow-lg">
                  <input
                    autoFocus
                    placeholder="Nombre de la lista..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="w-full bg-white dark:bg-[#13151A] border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-medium mb-2 focus:border-[var(--lumins-accent)] focus:ring-2 focus:ring-[var(--lumins-accent)]/15 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex items-center gap-1.5">
                    <button type="submit" className="flex-1 bg-[var(--lumins-accent)] hover:brightness-95 text-[var(--lumins-accent-on)] text-xs font-bold py-1.5 rounded-lg transition-all shadow-xs cursor-pointer">
                      Añadir lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
                      className="px-2.5 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="w-[82vw] sm:w-[272px] h-10 flex items-center justify-start px-3.5 gap-2 rounded-xl bg-black/25 hover:bg-black/35 border border-white/15 text-white/90 hover:text-white transition-all font-bold text-xs flex-shrink-0 shadow-md backdrop-blur-md cursor-pointer"
                >
                  <Plus size={18} strokeWidth={3} />
                  Añadir otra lista
                </button>
              )
            )}

            {/* Extra spacer for scroll */}
            <div className="w-8 flex-shrink-0 canvas-spacer" />
          </div>

          <DragOverlay dropAnimation={dropAnimationConfig}>
            {activeCard ? (
              <div className="w-[260px] rotate-[2deg] scale-105 shadow-2xl z-[1000] pointer-events-none opacity-95 select-none will-change-transform">
                <CardView card={activeCard} isDragging={false} />
              </div>
            ) : activeList ? (
              <div className="w-[85vw] sm:w-[85vw] md:w-[300px] opacity-90 rotate-[1deg] scale-105 pointer-events-none shadow-2xl z-[1000] select-none will-change-transform bg-white/90 dark:bg-[#1C1F26]/90 backdrop-blur-md rounded-2xl md:rounded-lg border border-white/30 dark:border-white/10 p-3">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100 text-[14px] mb-2 px-1">
                  <span className="truncate">{activeList.name}</span>
                  <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-white/50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold border border-zinc-200 dark:border-white/5">
                    {activeList.cards?.length || 0}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-hidden opacity-70 pointer-events-none">
                  {(activeList.cards || []).slice(0, 3).map((card) => (
                    <CardView key={card.id} card={card} />
                  ))}
                  {(activeList.cards || []).length > 3 && (
                    <p className="text-[11px] text-center text-zinc-400 py-1 font-medium">
                      +{(activeList.cards || []).length - 3} tarjetas más...
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <CardDetailModal
        key={selectedCardId || 'empty'}
        isOpen={!!selectedCardId}
        onClose={handleCloseModal}
        cardId={selectedCardId}
        boardId={id}
        onUpdate={() => fetchBoard(true)}
        userRole={userRole}
        boardLabels={board?.labels}
        boardMembers={modalBoardMembers}
        initialData={modalInitialData}
      />

      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        boardId={board.id}
        boardName={board.name}
        workspaceId={board.workspaceId}
        onUpdate={fetchBoard}
      />

      <ConfirmActionModal
        isOpen={!!archiveCardCandidate}
        title="Archivar tarjeta"
        description={`La tarjeta \"${archiveCardCandidate?.title || ''}\" pasará a archivadas. Puedes restaurarla más tarde.`}
        confirmLabel="Sí, archivar"
        cancelLabel="Cancelar"
        isLoading={isArchivingCard}
        onClose={() => {
          if (!isArchivingCard) setArchiveCardCandidate(null);
        }}
        onConfirm={handleArchiveCardFromBoard}
      />

      <ConfirmActionModal
        isOpen={!!archiveCardsCandidate}
        title={archiveCardsCandidate?.onlyCompleted ? 'Archivar tarjetas completadas' : 'Archivar todas las tarjetas'}
        description={
          archiveCardsCandidate?.onlyCompleted
            ? `Se archivarán ${archiveCardsCandidate.count} tarjeta(s) completada(s) de la lista "${archiveCardsCandidate.listName}". Podrás consultarlas o restaurarlas en cualquier momento desde "Elementos Archivados".`
            : `Se archivarán las ${archiveCardsCandidate?.count} tarjeta(s) de la lista "${archiveCardsCandidate?.listName}". Podrás consultarlas o restaurarlas en cualquier momento desde "Elementos Archivados".`
        }
        confirmLabel={
          archiveCardsCandidate?.onlyCompleted
            ? `Archivar completadas (${archiveCardsCandidate.count})`
            : `Archivar todas (${archiveCardsCandidate?.count})`
        }
        cancelLabel="Cancelar"
        isLoading={isArchivingCards}
        onClose={() => {
          if (!isArchivingCards) setArchiveCardsCandidate(null);
        }}
        onConfirm={handleConfirmArchiveCards}
      />

      {/* Confirm Archivar Lista */}
      <ConfirmActionModal
        isOpen={!!archiveListCandidate}
        title="Archivar lista"
        description={`La lista "${archiveListCandidate?.name}" y todas sus tarjetas pasarán a archivadas. Podrás restaurarla en cualquier momento desde "Elementos Archivados".`}
        confirmLabel="Sí, archivar lista"
        cancelLabel="Cancelar"
        variant="warning"
        isLoading={isArchivingList}
        onClose={() => {
          if (!isArchivingList) setArchiveListCandidate(null);
        }}
        onConfirm={handleConfirmArchiveList}
      />

      {/* Confirm Eliminar Lista */}
      <ConfirmActionModal
        isOpen={!!deleteListCandidate}
        title="Eliminar lista"
        description={`¿Estás seguro de que deseas eliminar permanentemente la lista "${deleteListCandidate?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar lista"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeletingList}
        onClose={() => {
          if (!isDeletingList) setDeleteListCandidate(null);
        }}
        onConfirm={handleConfirmDeleteList}
      />

      {isArchivedModalOpen && board && (
        <ArchivedItemsModal
          boardId={board.id}
          onClose={() => setIsArchivedModalOpen(false)}
          onRestore={() => fetchBoard()}
        />
      )}
    </motion.div>
  );
};

export default BoardDetailPage;
