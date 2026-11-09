import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Layout,
  Filter,
  Users,
  CheckCircle2,
  Search,
  Palette,
  X,
  UserCheck,
  Tag,
  Flag,
  CalendarRange,
  RotateCcw,
  Plus,
  Inbox,
  AlertCircle,
  Lock,
  Clock,
  Check,
  Printer,
  Download,
  Bookmark,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInCalendarDays,
  startOfDay,
  isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import CardDetailModal from '../components/CardDetailModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { useNotificationHelpers } from '../components/NotificationProvider';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  type CalendarBoardInfo,
  type CalendarCardEvent,
  type CalendarColorBy,
  type CalendarViewMode,
  type CalendarWorkspaceMember,
  PRIORITY_COLORS,
  getEventDateRange,
  isCardCompleted,
  isEventOverdue,
  resolveBoardAccentColor,
  toSafeCalendarISO,
} from '../lib/calendar-utils';
import LuminsCalendarMonthView from '../components/calendar/LuminsCalendarMonthView';
import LuminsCalendarWeekView from '../components/calendar/LuminsCalendarWeekView';
import LuminsCalendarAgendaView from '../components/calendar/LuminsCalendarAgendaView';
import LuminsCalendarTeamView from '../components/calendar/LuminsCalendarTeamView';
import LuminsCalendarTimelineView from '../components/calendar/LuminsCalendarTimelineView';
import QuickCreatePopover from '../components/calendar/QuickCreatePopover';
import CalendarQuickActionsMenu from '../components/calendar/CalendarQuickActionsMenu';
import CalendarUnscheduledDrawer from '../components/calendar/CalendarUnscheduledDrawer';
import { CalendarIcalModal } from '../components/calendar/CalendarIcalModal';
import { type CalendarSavedView } from '../components/calendar/CalendarSavedViewsDropdown';
import { CalendarExportModal } from '../components/calendar/CalendarExportModal';
import { CalendarOptionsMenu } from '../components/calendar/CalendarOptionsMenu';

const STORAGE_PREFIX = 'lumins:calendar:prefs:';
const VALID_VIEWS: CalendarViewMode[] = ['month', 'week', 'agenda', 'team', 'timeline'];

interface StoredCalendarPrefs {
  view?: CalendarViewMode;
  colorBy?: CalendarColorBy;
  hideWeekends?: boolean;
}

interface CalendarCacheData {
  events: CalendarCardEvent[];
  unscheduledEvents: CalendarCardEvent[];
  boards: CalendarBoardInfo[];
  members: CalendarWorkspaceMember[];
}

const calendarEventsCache = new Map<string, CalendarCacheData>();

const WorkspaceCalendarPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showError } = useNotificationHelpers();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load saved preferences per workspace
  const storedPrefs = useMemo<StoredCalendarPrefs>(() => {
    if (!workspaceId) return {};
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${workspaceId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [workspaceId]);

  // Default view: Agenda on mobile (<768px), Month on desktop unless saved/URL
  const initialView = useMemo<CalendarViewMode>(() => {
    const urlView = searchParams.get('view') as CalendarViewMode | null;
    if (urlView && VALID_VIEWS.includes(urlView)) return urlView;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'agenda';
    if (storedPrefs.view && VALID_VIEWS.includes(storedPrefs.view)) {
      return storedPrefs.view;
    }
    return 'month';
  }, []);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [activeView, setActiveView] = useState<CalendarViewMode>(initialView);
  const [colorBy, setColorBy] = useState<CalendarColorBy>(
    (searchParams.get('colorBy') as CalendarColorBy) || storedPrefs.colorBy || 'board'
  );
  const [hideWeekends, setHideWeekends] = useState<boolean>(
    searchParams.get('weekends') === '0' ? true : Boolean(storedPrefs.hideWeekends)
  );

  // Check if we have cached data for this workspace to eliminate flickering on navigation
  const initialCache = workspaceId ? calendarEventsCache.get(workspaceId) : undefined;

  // Data state (instant hydration from memory cache)
  const [events, setEvents] = useState<CalendarCardEvent[]>(() => initialCache?.events || []);
  const [unscheduledEvents, setUnscheduledEvents] = useState<CalendarCardEvent[]>(
    () => initialCache?.unscheduledEvents || []
  );
  const [boardsList, setBoardsList] = useState<CalendarBoardInfo[]>(() => initialCache?.boards || []);
  const [workspaceMembers, setWorkspaceMembers] = useState<CalendarWorkspaceMember[]>(
    () => initialCache?.members || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialCache);
  const eventsRef = useRef<CalendarCardEvent[]>(initialCache?.events || []);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);
  const [selectedCard, setSelectedCard] = useState<{ cardId: string; boardId: string } | null>(null);

  // Filters state (initialized from URL params if present)
  const [boardFilter, setBoardFilter] = useState<string>(searchParams.get('board') || 'all');
  const [hiddenBoardIds, setHiddenBoardIds] = useState<string[]>([]);
  const [memberFilter, setMemberFilter] = useState<string>(searchParams.get('member') || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get('priority') || 'all');
  const [labelFilter, setLabelFilter] = useState<string>(searchParams.get('label') || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [onlyMyTasks, setOnlyMyTasks] = useState<boolean>(searchParams.get('mine') === '1');

  // UI toggles & Phase 2/3 modals
  const [showDesktopFilters, setShowDesktopFilters] = useState<boolean>(true);
  const [showMobileFilterSheet, setShowMobileFilterSheet] = useState<boolean>(false);
  const [showLegendPopover, setShowLegendPopover] = useState<boolean>(false);
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState<boolean>(false);
  const [quickCreateDates, setQuickCreateDates] = useState<{
    startDate: Date;
    dueDate?: Date;
  } | null>(null);
  const [quickMenuState, setQuickMenuState] = useState<{
    event: CalendarCardEvent;
    pos: { x: number; y: number };
  } | null>(null);
  const [cardToArchive, setCardToArchive] = useState<CalendarCardEvent | null>(null);
  const [isArchivingCard, setIsArchivingCard] = useState<boolean>(false);
  const [showIcalModal, setShowIcalModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Apply a Saved View (Requirement 4.2)
  const handleApplySavedView = useCallback((view: CalendarSavedView) => {
    setActiveView(view.view);
    setColorBy(view.colorBy);
    setHideWeekends(view.hideWeekends);
    setBoardFilter(view.filters.board);
    setMemberFilter(view.filters.member);
    setStatusFilter(view.filters.status);
    setPriorityFilter(view.filters.priority);
    setLabelFilter(view.filters.label);
    setOnlyMyTasks(view.filters.mine);
  }, []);

  // Persist user preferences in localStorage
  useEffect(() => {
    if (!workspaceId) return;
    try {
      const prefs: StoredCalendarPrefs = {
        view: activeView,
        colorBy,
        hideWeekends,
      };
      localStorage.setItem(`${STORAGE_PREFIX}${workspaceId}`, JSON.stringify(prefs));
    } catch {
      // ignore storage errors
    }
  }, [workspaceId, activeView, colorBy, hideWeekends]);

  // Sync active filters & view to URL query params (Requirement 1.18)
  useEffect(() => {
    const next = new URLSearchParams();
    next.set('view', activeView);
    if (colorBy !== 'board') next.set('colorBy', colorBy);
    if (hideWeekends) next.set('weekends', '0');
    if (boardFilter !== 'all') next.set('board', boardFilter);
    if (memberFilter !== 'all') next.set('member', memberFilter);
    if (statusFilter !== 'all') next.set('status', statusFilter);
    if (priorityFilter !== 'all') next.set('priority', priorityFilter);
    if (labelFilter !== 'all') next.set('label', labelFilter);
    if (onlyMyTasks) next.set('mine', '1');
    if (searchQuery.trim()) next.set('q', searchQuery.trim());
    setSearchParams(next, { replace: true });
  }, [
    activeView,
    colorBy,
    hideWeekends,
    boardFilter,
    memberFilter,
    statusFilter,
    priorityFilter,
    labelFilter,
    onlyMyTasks,
    searchQuery,
    setSearchParams,
  ]);

  // Google Calendar OAuth Return Feedback
  useEffect(() => {
    const statusParam = searchParams.get('googleCalendar');
    if (statusParam === 'connected') {
      toast.success('¡Google Calendar vinculado exitosamente!', {
        description: 'Sincronización inicial en curso en segundo plano para tus tareas.',
      });
      searchParams.delete('googleCalendar');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Guardar siempre el último workspace activo para navegación limpia
  useEffect(() => {
    if (workspaceId) {
      localStorage.setItem('lastActiveWorkspaceId', workspaceId);
    }
  }, [workspaceId]);

  const fetchEvents = useCallback(
    async (silent = false) => {
      if (!workspaceId) return;
      const hasCachedData = calendarEventsCache.has(workspaceId) || eventsRef.current.length > 0;
      if (!silent && !hasCachedData) {
        setIsLoading(true);
      }
      try {
        const response = await apiClient.get<{
          data: {
            events: CalendarCardEvent[];
            unscheduledEvents?: CalendarCardEvent[];
            boards?: CalendarBoardInfo[];
            members?: CalendarWorkspaceMember[];
          };
        }>(`/api/workspaces/${workspaceId}/calendar-events`);

        const raw = response as any;
        const payloadData = raw?.data || raw;
        const newEvents = payloadData?.events || [];
        const newUnscheduled = payloadData?.unscheduledEvents || [];
        const newBoards = payloadData?.boards || [];
        const newMembers = payloadData?.members || [];

        setEvents(newEvents);
        eventsRef.current = newEvents;
        setUnscheduledEvents(newUnscheduled);
        if (newBoards.length > 0) {
          const currentKey = boardsList.map(b => b.id).sort().join(',');
          const newKey = newBoards.map((b: any) => b.id).sort().join(',');
          if (currentKey !== newKey) {
            setBoardsList(newBoards);
          }
        }
        if (newMembers.length > 0) setWorkspaceMembers(newMembers);

        calendarEventsCache.set(workspaceId, {
          events: newEvents,
          unscheduledEvents: newUnscheduled,
          boards: newBoards,
          members: newMembers,
        });
      } catch (err) {
        console.error('Failed to fetch calendar events', err);
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId, boardsList]
  );

  useEffect(() => {
    // Si ya tenemos datos en caché, sincronizamos silenciosamente en segundo plano sin mostrar skeleton
    const hasData = calendarEventsCache.has(workspaceId || '') || eventsRef.current.length > 0;
    fetchEvents(hasData);
  }, [workspaceId]);

  // Real-Time Socket.IO subscriptions for workspace & visible boards
  const boardsListKey = useMemo(() => boardsList.map(b => b.id).sort().join(','), [boardsList]);

  useEffect(() => {
    if (!socket || !workspaceId) return;

    const joinAllRooms = () => {
      socket.emit('join_workspace', workspaceId);
      boardsList.forEach(bId => socket.emit('join_board', bId.id));
    };

    joinAllRooms();

    socket.on('connect', joinAllRooms);

    const handleRealtimeChange = () => {
      fetchEvents(true);
    };

    socket.on('card:updated', handleRealtimeChange);
    socket.on('card:created', handleRealtimeChange);
    socket.on('card:moved', handleRealtimeChange);
    socket.on('card:deleted', handleRealtimeChange);
    socket.on('board:updated', handleRealtimeChange);
    socket.on('calendar:refresh', handleRealtimeChange);

    return () => {
      socket.emit('leave_workspace', workspaceId);
      boardsList.forEach(bId => socket.emit('leave_board', bId.id));
      socket.off('connect', joinAllRooms);
      socket.off('card:updated', handleRealtimeChange);
      socket.off('card:created', handleRealtimeChange);
      socket.off('card:moved', handleRealtimeChange);
      socket.off('card:deleted', handleRealtimeChange);
      socket.off('board:updated', handleRealtimeChange);
      socket.off('calendar:refresh', handleRealtimeChange);
    };
  }, [socket, workspaceId, boardsListKey, fetchEvents]);

  // Local window event listeners for instantaneous in-app reactivity
  useEffect(() => {
    const handleLocalRefresh = () => {
      fetchEvents(true);
    };

    window.addEventListener('lumins:card-updated', handleLocalRefresh);
    window.addEventListener('lumins:card-created', handleLocalRefresh);

    return () => {
      window.removeEventListener('lumins:card-updated', handleLocalRefresh);
      window.removeEventListener('lumins:card-created', handleLocalRefresh);
    };
  }, [fetchEvents]);

  // Derive unique boards, members, and labels for filter selectors
  const uniqueBoards = useMemo<CalendarBoardInfo[]>(() => {
    if (boardsList.length > 0) return boardsList;
    const map = new Map<string, CalendarBoardInfo>();
    events.forEach(ev => {
      const p = ev.extendedProps;
      if (p?.boardId && p?.boardName && !map.has(p.boardId)) {
        map.set(p.boardId, {
          id: p.boardId,
          name: p.boardName,
          background: p.boardBackground,
          accentColor:
            p.boardAccentColor || resolveBoardAccentColor(p.boardId, p.boardBackground),
          canEdit: p.canEdit !== false,
        });
      }
    });
    return Array.from(map.values());
  }, [boardsList, events]);

  const uniqueMembers = useMemo<CalendarWorkspaceMember[]>(() => {
    const map = new Map<string, CalendarWorkspaceMember>();
    for (const wm of workspaceMembers) {
      map.set(wm.id, wm);
    }
    events.forEach(ev => {
      ev.extendedProps?.assignees?.forEach(m => {
        if (m?.id && !map.has(m.id)) {
          map.set(m.id, {
            id: m.id,
            name: m.name,
            email: m.email || '',
            avatarUrl: m.avatarUrl || null,
            role: 'MEMBER',
          });
        }
      });
    });
    return Array.from(map.values());
  }, [workspaceMembers, events]);

  const uniqueLabels = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    events.forEach(ev => {
      ev.extendedProps?.labels?.forEach(l => {
        if (l?.id && !map.has(l.id)) {
          map.set(l.id, {
            id: l.id,
            name: l.name || 'Sin nombre',
            color: l.color || '#6C5DD3',
          });
        }
      });
    });
    return Array.from(map.values());
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const today = startOfDay(new Date());

    return events.filter(ev => {
      const props = ev.extendedProps;
      if (!props) return false;

      if (hiddenBoardIds.includes(props.boardId)) return false;
      if (boardFilter !== 'all' && props.boardId !== boardFilter) return false;

      if (onlyMyTasks && user?.id) {
        const assignedToMe = props.assignees?.some(a => a.id === user.id);
        if (!assignedToMe) return false;
      }

      if (memberFilter !== 'all') {
        if (memberFilter === 'unassigned') {
          if (props.assignees && props.assignees.length > 0) return false;
        } else if (!props.assignees?.some(a => a.id === memberFilter)) {
          return false;
        }
      }

      if (priorityFilter !== 'all' && (props.priority || 'P2') !== priorityFilter) {
        return false;
      }

      if (labelFilter !== 'all' && !props.labels?.some(l => l.id === labelFilter)) {
        return false;
      }

      const done = isCardCompleted(ev);
      const overdue = isEventOverdue(ev, today);
      const { end } = getEventDateRange(ev);
      const daysUntilDue = differenceInCalendarDays(end, today);
      const isDueSoon = !done && daysUntilDue >= 0 && daysUntilDue <= 2;

      if (statusFilter === 'pending' && done) return false;
      if (statusFilter === 'done' && !done) return false;
      if (statusFilter === 'overdue' && !overdue) return false;
      if (statusFilter === 'due_soon' && !isDueSoon) return false;
      if (statusFilter === 'blocked' && !props.blocked) return false;

      if (q) {
        const inTitle = ev.title.toLowerCase().includes(q);
        const inBoard = props.boardName?.toLowerCase().includes(q);
        const inList = props.listName?.toLowerCase().includes(q);
        if (!inTitle && !inBoard && !inList) return false;
      }

      return true;
    });
  }, [
    events,
    hiddenBoardIds,
    boardFilter,
    onlyMyTasks,
    user?.id,
    memberFilter,
    priorityFilter,
    labelFilter,
    statusFilter,
    searchQuery,
  ]);

  // Period Metrics (Requirement 3.5)
  const metrics = useMemo(() => {
    const today = startOfDay(new Date());
    let total = 0;
    let completed = 0;
    let overdue = 0;
    let dueSoon = 0;
    let blocked = 0;

    for (const ev of events) {
      if (hiddenBoardIds.includes(ev.extendedProps.boardId)) continue;
      if (boardFilter !== 'all' && ev.extendedProps.boardId !== boardFilter) continue;
      total += 1;
      const done = isCardCompleted(ev);
      if (done) {
        completed += 1;
      } else {
        if (isEventOverdue(ev, today)) overdue += 1;
        const { end } = getEventDateRange(ev);
        const diff = differenceInCalendarDays(end, today);
        if (diff >= 0 && diff <= 2) dueSoon += 1;
      }
      if (ev.extendedProps.blocked) blocked += 1;
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct, overdue, dueSoon, blocked };
  }, [events, hiddenBoardIds, boardFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (boardFilter !== 'all') count++;
    if (hiddenBoardIds.length > 0) count++;
    if (memberFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (labelFilter !== 'all') count++;
    if (onlyMyTasks) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [
    boardFilter,
    hiddenBoardIds.length,
    memberFilter,
    statusFilter,
    priorityFilter,
    labelFilter,
    onlyMyTasks,
    searchQuery,
  ]);

  const clearAllFilters = () => {
    setBoardFilter('all');
    setHiddenBoardIds([]);
    setMemberFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setLabelFilter('all');
    setOnlyMyTasks(false);
    setSearchQuery('');
  };

  const handleSetStatusFilter = useCallback(
    (newStatus: string) => {
      setStatusFilter(newStatus);
      if (newStatus === 'overdue') {
        const today = startOfDay(new Date());
        const overdueEventsList = events.filter(ev => isEventOverdue(ev, today));
        if (overdueEventsList.length > 0) {
          const targetDate = getEventDateRange(overdueEventsList[0]).end;
          if (!isSameMonth(targetDate, currentDate)) {
            setCurrentDate(targetDate);
            toast.info(
              `Navegando a ${format(targetDate, 'MMMM yyyy', { locale: es })} donde está la tarea vencida.`,
              { icon: '📅' }
            );
          }
        }
      } else if (newStatus === 'due_soon') {
        const today = startOfDay(new Date());
        const dueSoonEvents = events.filter(ev => {
          if (isCardCompleted(ev)) return false;
          const { end } = getEventDateRange(ev);
          const diff = differenceInCalendarDays(end, today);
          return diff >= 0 && diff <= 2;
        });
        if (dueSoonEvents.length > 0) {
          const targetDate = getEventDateRange(dueSoonEvents[0]).end;
          if (!isSameMonth(targetDate, currentDate)) {
            setCurrentDate(targetDate);
          }
        }
      }
    },
    [events, currentDate]
  );

  // Period navigation
  const handlePrev = useCallback(() => {
    setCurrentDate(prev =>
      activeView === 'week' || activeView === 'team' ? subWeeks(prev, 1) : subMonths(prev, 1)
    );
  }, [activeView]);

  const handleNext = useCallback(() => {
    setCurrentDate(prev =>
      activeView === 'week' || activeView === 'team' ? addWeeks(prev, 1) : addMonths(prev, 1)
    );
  }, [activeView]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Period formatted title
  const periodTitle = useMemo(() => {
    if (activeView === 'week' || activeView === 'team') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`;
    }
    return format(currentDate, 'MMMM yyyy', { locale: es });
  }, [currentDate, activeView]);

  // Keyboard shortcuts (Requirement 1.23)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCard || quickCreateDates || cardToArchive) return;
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 't':
        case 'T':
          e.preventDefault();
          handleToday();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setActiveView('month');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setActiveView('week');
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          setActiveView('agenda');
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          setActiveView('team');
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          setActiveView('timeline');
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (window.innerWidth < 768) {
            setShowMobileFilterSheet(prev => !prev);
          } else {
            setShowDesktopFilters(prev => !prev);
          }
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, quickCreateDates, cardToArchive, handleToday, handlePrev, handleNext]);

  // Helper to update dates with Undo toast (Requirement 2.7)
  const applyCardDatesUpdate = useCallback(
    async (
      event: CalendarCardEvent,
      nextStartISO: string | null,
      nextDueISO: string | null,
      toastMessage: string
    ) => {
      if (event.extendedProps.canEdit === false) {
        showError('Solo lectura', 'No tienes permisos para editar tarjetas en este tablero.');
        return;
      }

      const prevStartISO = event.extendedProps.startDate;
      const prevDueISO = event.extendedProps.dueDate;
      const previousEvents = events;
      const previousUnscheduled = unscheduledEvents;

      if (!nextStartISO && !nextDueISO) {
        // Moving from scheduled -> unscheduled
        const movedCard: CalendarCardEvent = {
          ...event,
          start: null,
          end: null,
          extendedProps: {
            ...event.extendedProps,
            startDate: null,
            dueDate: null,
          },
        };
        setEvents(prev => prev.filter(item => item.id !== event.id));
        setUnscheduledEvents(prev => [movedCard, ...prev.filter(i => i.id !== event.id)]);
      } else {
        const updatedCard: CalendarCardEvent = {
          ...event,
          start: nextStartISO || nextDueISO,
          end: nextDueISO || nextStartISO,
          extendedProps: {
            ...event.extendedProps,
            startDate: nextStartISO,
            dueDate: nextDueISO,
          },
        };
        setEvents(prev => {
          const exists = prev.some(i => i.id === event.id);
          return exists
            ? prev.map(i => (i.id === event.id ? updatedCard : i))
            : [...prev, updatedCard];
        });
        setUnscheduledEvents(prev => prev.filter(i => i.id !== event.id));
      }

      try {
        await apiClient.patch(`/api/cards/${event.id}/dates`, {
          startDate: nextStartISO,
          dueDate: nextDueISO,
        });

        toast.success(toastMessage, {
          action: {
            label: 'Deshacer',
            onClick: async () => {
              setEvents(previousEvents);
              setUnscheduledEvents(previousUnscheduled);
              try {
                await apiClient.patch(`/api/cards/${event.id}/dates`, {
                  startDate: prevStartISO,
                  dueDate: prevDueISO,
                });
                toast.success('Cambio de fecha deshecho');
              } catch {
                fetchEvents(true);
              }
            },
          },
        });
      } catch {
        setEvents(previousEvents);
        setUnscheduledEvents(previousUnscheduled);
        showError('Error', 'No se pudo actualizar la fecha de la tarjeta');
      }
    },
    [events, unscheduledEvents, showError, fetchEvents]
  );

  // Optimistic Reschedule (Requirement 0.7 & 2.7)
  const handleRescheduleEvent = useCallback(
    async (event: CalendarCardEvent, targetDay: Date) => {
      const { durationDays, isMultiDay } = getEventDateRange(event);
      const hadStartDate = Boolean(event.extendedProps.startDate);

      let nextStartISO: string | null = null;
      let nextDueISO: string | null = null;

      if (isMultiDay || hadStartDate) {
        const nextStart = targetDay;
        const nextEnd = addDays(targetDay, Math.max(0, durationDays - 1));
        nextStartISO = toSafeCalendarISO(nextStart);
        nextDueISO = toSafeCalendarISO(nextEnd);
      } else {
        nextStartISO = null;
        nextDueISO = toSafeCalendarISO(targetDay);
      }

      await applyCardDatesUpdate(
        event,
        nextStartISO,
        nextDueISO,
        `Reprogramada al ${format(targetDay, "d 'de' MMM", { locale: es })}`
      );
    },
    [applyCardDatesUpdate]
  );

  // Resize Event Dates (Requirement 2.3)
  const handleResizeEventDates = useCallback(
    async (event: CalendarCardEvent, newStartDate: Date, newDueDate: Date) => {
      const nextStartISO = toSafeCalendarISO(newStartDate);
      const nextDueISO = toSafeCalendarISO(newDueDate);
      await applyCardDatesUpdate(
        event,
        nextStartISO,
        nextDueISO,
        `Duración ajustada (${format(newStartDate, 'd MMM', { locale: es })} – ${format(
          newDueDate,
          'd MMM',
          { locale: es }
        )})`
      );
    },
    [applyCardDatesUpdate]
  );

  // Schedule an unscheduled card by drag-drop or quick picker (Requirement 2.4)
  const handleDropUnscheduledCard = useCallback(
    async (cardId: string, targetDate: Date, targetMemberId?: string | null) => {
      const card = unscheduledEvents.find(c => c.id === cardId);
      if (!card) return;
      const dueISO = toSafeCalendarISO(targetDate);
      const isTeamViewDrop = targetMemberId !== undefined;

      // Calculate target assignees if dropped in Team View
      let nextAssignees = card.extendedProps.assignees || [];
      if (isTeamViewDrop) {
        if (targetMemberId) {
          const targetMember = 
            uniqueMembers.find(m => m.id === targetMemberId) ||
            workspaceMembers.find(m => m.id === targetMemberId) ||
            events.flatMap(e => e.extendedProps?.assignees || []).find(a => a?.id === targetMemberId);

          nextAssignees = [
            {
              id: targetMemberId,
              name: targetMember?.name || 'Miembro',
              email: targetMember?.email || '',
              avatarUrl: targetMember?.avatarUrl || null,
            },
          ];
        } else {
          // Explicitly dropped into "Sin asignar"
          nextAssignees = [];
        }
      }

      // Optimistic update
      const previousEvents = events;
      const previousUnscheduled = unscheduledEvents;

      const scheduledCard: CalendarCardEvent = {
        ...card,
        start: dueISO,
        end: dueISO,
        extendedProps: {
          ...card.extendedProps,
          startDate: null,
          dueDate: dueISO,
          assignees: nextAssignees,
        },
      };

      setEvents(prev => [...prev.filter(i => i.id !== cardId), scheduledCard]);
      setUnscheduledEvents(prev => prev.filter(i => i.id !== cardId));

      try {
        // 1. Update dates
        await apiClient.patch(`/api/cards/${card.id}/dates`, {
          startDate: null,
          dueDate: dueISO,
        });

        // 2. If dropped in Team View, update assignees to match target row
        if (isTeamViewDrop) {
          const currentAssigneeIds = (card.extendedProps.assignees || []).map(a => a.id);
          // Remove previous assignees that are not targetMemberId
          for (const prevId of currentAssigneeIds) {
            if (prevId !== targetMemberId) {
              await apiClient.delete(`/api/cards/${card.id}/assignees/${prevId}`).catch(() => {});
            }
          }
          // Assign target member if not already assigned
          if (targetMemberId && !currentAssigneeIds.includes(targetMemberId)) {
            await apiClient.post(`/api/cards/${card.id}/assignees`, { userId: targetMemberId }).catch(() => {});
          }
        }

        // Sincronización silenciosa con el servidor para consolidar el estado sin recargar la página
        fetchEvents(true);

        const memberName = targetMemberId
          ? (uniqueMembers.find(m => m.id === targetMemberId)?.name || 'Miembro')
          : null;
        const msg = memberName
          ? `Programada para el ${format(targetDate, "d 'de' MMM", { locale: es })} (${memberName})`
          : `Programada para el ${format(targetDate, "d 'de' MMM", { locale: es })}`;

        toast.success(msg, {
          action: {
            label: 'Deshacer',
            onClick: async () => {
              setEvents(previousEvents);
              setUnscheduledEvents(previousUnscheduled);
              try {
                // Restore dates
                await apiClient.patch(`/api/cards/${card.id}/dates`, {
                  startDate: null,
                  dueDate: null,
                });
                // Restore assignees if changed
                if (isTeamViewDrop) {
                  if (targetMemberId) {
                    await apiClient.delete(`/api/cards/${card.id}/assignees/${targetMemberId}`).catch(() => {});
                  }
                  for (const prevA of card.extendedProps.assignees || []) {
                    await apiClient.post(`/api/cards/${card.id}/assignees`, { userId: prevA.id }).catch(() => {});
                  }
                }
                toast.success('Programación deshecha');
              } catch {
                fetchEvents(true);
              }
            },
          },
        });
      } catch {
        setEvents(previousEvents);
        setUnscheduledEvents(previousUnscheduled);
        showError('Error', 'No se pudo programar la tarjeta');
      }
    },
    [unscheduledEvents, events, uniqueMembers, showError, fetchEvents]
  );

  // Team View 2D Drag: Reassign + Reschedule (Requirement 3.1)
  const handleReassignAndReschedule = useCallback(
    async (
      event: CalendarCardEvent,
      fromMemberId: string | null,
      toMemberId: string | null,
      targetDate: Date
    ) => {
      if (event.extendedProps.canEdit === false) {
        showError('Solo lectura', 'No tienes permisos para editar tarjetas en este tablero.');
        return;
      }

      // 1. Reschedule if date changed
      const { start } = getEventDateRange(event);
      if (format(start, 'yyyy-MM-dd') !== format(targetDate, 'yyyy-MM-dd')) {
        await handleRescheduleEvent(event, targetDate);
      }

      // 2. Reassign if member row changed
      if (fromMemberId !== toMemberId) {
        const previousEvents = events;
        const targetMember = toMemberId ? uniqueMembers.find(m => m.id === toMemberId) : null;

        setEvents(prev =>
          prev.map(item => {
            if (item.id !== event.id) return item;
            let nextAssignees = [...(item.extendedProps.assignees || [])];
            if (fromMemberId) {
              nextAssignees = nextAssignees.filter(a => a.id !== fromMemberId);
            }
            if (targetMember && !nextAssignees.some(a => a.id === targetMember.id)) {
              nextAssignees.push({
                id: targetMember.id,
                name: targetMember.name,
                email: targetMember.email,
                avatarUrl: targetMember.avatarUrl,
              });
            }
            return {
              ...item,
              extendedProps: {
                ...item.extendedProps,
                assignees: nextAssignees,
              },
            };
          })
        );

        try {
          if (fromMemberId) {
            await apiClient.delete(`/api/cards/${event.id}/assignees/${fromMemberId}`);
          }
          if (toMemberId) {
            await apiClient.post(`/api/cards/${event.id}/assignees`, { userId: toMemberId });
          }
          toast.success(
            targetMember ? `Asignada a ${targetMember.name}` : 'Movida a Sin asignar'
          );
        } catch {
          setEvents(previousEvents);
          showError('Error', 'No se pudo reasignar el miembro');
        }
      }
    },
    [events, uniqueMembers, handleRescheduleEvent, showError]
  );

  // Optimistic Done Toggle with Undo (Requirement 2.6 & 2.7)
  const handleToggleDone = useCallback(
    async (event: CalendarCardEvent, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (event.extendedProps.canEdit === false) {
        showError('Solo lectura', 'No tienes permisos para editar tarjetas en este tablero.');
        return;
      }

      const currentDone = isCardCompleted(event);
      const nextDone = !currentDone;
      const previousEvents = events;

      setEvents(prev =>
        prev.map(item => {
          if (item.id !== event.id) return item;
          return {
            ...item,
            extendedProps: {
              ...item.extendedProps,
              isDone: nextDone,
              isDueDateDone: nextDone,
            },
          };
        })
      );

      try {
        await apiClient.patch(`/api/cards/${event.id}`, {
          isDone: nextDone,
          isDueDateDone: nextDone,
        });
        toast.success(nextDone ? 'Tarea marcada como lista' : 'Tarea reabierta', {
          action: {
            label: 'Deshacer',
            onClick: async () => {
              setEvents(previousEvents);
              try {
                await apiClient.patch(`/api/cards/${event.id}`, {
                  isDone: currentDone,
                  isDueDateDone: currentDone,
                });
              } catch {
                fetchEvents(true);
              }
            },
          },
        });
      } catch {
        setEvents(previousEvents);
        showError('Error', 'No se pudo actualizar el estado de la tarea');
      }
    },
    [events, showError, fetchEvents]
  );

  // Change Priority from Quick Menu (Requirement 2.5)
  const handleChangePriority = useCallback(
    async (event: CalendarCardEvent, priority: 'P0' | 'P1' | 'P2' | 'P3') => {
      const prevPriority = event.extendedProps.priority || 'P2';
      if (prevPriority === priority) return;

      const updateList = (list: CalendarCardEvent[]) =>
        list.map(item =>
          item.id === event.id
            ? { ...item, extendedProps: { ...item.extendedProps, priority } }
            : item
        );

      setEvents(updateList);
      setUnscheduledEvents(updateList);

      try {
        await apiClient.patch(`/api/cards/${event.id}`, { priority });
        toast.success(`Prioridad cambiada a ${priority}`);
      } catch {
        fetchEvents(true);
        showError('Error', 'No se pudo cambiar la prioridad');
      }
    },
    [fetchEvents, showError]
  );

  // Toggle Assignee from Quick Menu (Requirement 2.5)
  const handleToggleAssignee = useCallback(
    async (event: CalendarCardEvent, member: CalendarWorkspaceMember) => {
      const currentlyAssigned = event.extendedProps.assignees?.some(a => a.id === member.id);

      const updateList = (list: CalendarCardEvent[]) =>
        list.map(item => {
          if (item.id !== event.id) return item;
          const nextAssignees = currentlyAssigned
            ? (item.extendedProps.assignees || []).filter(a => a.id !== member.id)
            : [
                ...(item.extendedProps.assignees || []),
                {
                  id: member.id,
                  name: member.name,
                  email: member.email,
                  avatarUrl: member.avatarUrl,
                },
              ];
          return {
            ...item,
            extendedProps: {
              ...item.extendedProps,
              assignees: nextAssignees,
            },
          };
        });

      setEvents(updateList);
      setUnscheduledEvents(updateList);
      setQuickMenuState(prev =>
        prev && prev.event.id === event.id
          ? { ...prev, event: updateList([prev.event])[0] }
          : prev
      );

      try {
        if (currentlyAssigned) {
          await apiClient.delete(`/api/cards/${event.id}/assignees/${member.id}`);
        } else {
          await apiClient.post(`/api/cards/${event.id}/assignees`, { userId: member.id });
        }
      } catch {
        fetchEvents(true);
        showError('Error', 'No se pudo actualizar la asignación');
      }
    },
    [fetchEvents, showError]
  );

  // Archive Card using global ConfirmActionModal (Requirement 2.5)
  const handleConfirmArchiveCard = useCallback(async () => {
    if (!cardToArchive) return;
    setIsArchivingCard(true);
    try {
      await apiClient.patch(`/api/cards/${cardToArchive.id}`, { status: 'closed' });
      setEvents(prev => prev.filter(i => i.id !== cardToArchive.id));
      setUnscheduledEvents(prev => prev.filter(i => i.id !== cardToArchive.id));
      toast.success(`Tarjeta "${cardToArchive.title}" archivada`);
      setCardToArchive(null);
    } catch {
      showError('Error', 'No se pudo archivar la tarjeta');
    } finally {
      setIsArchivingCard(false);
    }
  }, [cardToArchive, showError]);

  const handleSelectEvent = useCallback((ev: CalendarCardEvent) => {
    setSelectedCard({
      cardId: ev.id,
      boardId: ev.extendedProps.boardId,
    });
  }, []);

  const toggleBoardVisibility = (bId: string) => {
    setHiddenBoardIds(prev =>
      prev.includes(bId) ? prev.filter(id => id !== bId) : [...prev, bId]
    );
  };

  if (!workspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-10 h-full">
        <WorkspaceEmptyState
          onCreateClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#F4F6F9] dark:bg-[#13151A] px-2.5 sm:px-5 py-2.5 font-sans select-none">
      {/* 1. CLEAN MODERN HEADER (Linear & Native App UX) */}
      <header className="flex flex-col gap-2 pb-2 shrink-0">
        {/* Tier 1: Main Control Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Month Navigation & Title */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[#6C5DD3]/10 dark:bg-[#6C5DD3]/20 text-[#6C5DD3] dark:text-[#A599F9] items-center justify-center shrink-0">
              <CalendarIcon size={16} />
            </div>

            <h1 className="text-sm sm:text-lg lg:text-xl font-black capitalize text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0">
              {periodTitle}
            </h1>

            {/* ‹ Hoy › Navigation Capsule */}
            <div className="flex items-center bg-white dark:bg-[#1C1F26] rounded-lg border border-zinc-200/80 dark:border-white/10 p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                title="Periodo anterior (←)"
                className="p-1 sm:p-1.5 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleToday}
                title="Ir a hoy (T)"
                className="px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-extrabold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNext}
                title="Periodo siguiente (→)"
                className="p-1 sm:p-1.5 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* + Nueva Tarea Button (Desktop) */}
            <button
              type="button"
              onClick={() => setQuickCreateDates({ startDate: currentDate, dueDate: currentDate })}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-extrabold shadow-xs shadow-[#6C5DD3]/25 transition-all shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Nueva tarea</span>
            </button>
          </div>

          {/* Right: Desktop Controls (md+) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
            {/* Quick Search */}
            <div className="relative w-32 lg:w-44">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar... (/)"
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-[#6C5DD3] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* View Switcher Capsule (Mes · Semana · Agenda · Equipo · Timeline) */}
            <div className="flex items-center bg-white dark:bg-[#1C1F26] p-0.5 rounded-lg border border-zinc-200/80 dark:border-white/10 shadow-2xs">
              {(
                [
                  { id: 'month', label: 'Mes' },
                  { id: 'week', label: 'Semana' },
                  { id: 'agenda', label: 'Agenda' },
                  { id: 'team', label: 'Equipo' },
                  { id: 'timeline', label: 'Timeline' },
                ] as { id: CalendarViewMode; label: string }[]
              ).map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveView(v.id)}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-md transition-all shrink-0 ${
                    activeView === v.id
                      ? 'bg-zinc-900 dark:bg-[#6C5DD3] text-white shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 mx-0.5" />

            {/* Backlog "Sin fecha" Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowUnscheduledDrawer(prev => !prev)}
              title="Ver tarjetas sin fecha asignada"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                showUnscheduledDrawer
                  ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
              }`}
            >
              <Inbox size={13} />
              <span>Sin fecha</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  showUnscheduledDrawer
                    ? 'bg-white/20 text-white'
                    : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {unscheduledEvents.length}
              </span>
            </button>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowDesktopFilters(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeFiltersCount > 0
                  ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/40 text-[#6C5DD3] dark:text-[#A599F9]'
                  : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
              }`}
            >
              <Filter size={13} />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#6C5DD3] text-white text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Botón Unificado "Opciones" (Integraciones, Vistas y Configuración) */}
            <CalendarOptionsMenu
              workspaceId={workspaceId || ''}
              currentView={activeView}
              colorBy={colorBy}
              onChangeColorBy={setColorBy}
              hideWeekends={hideWeekends}
              onToggleWeekends={() => setHideWeekends(prev => !prev)}
              currentFilters={{
                board: boardFilter,
                member: memberFilter,
                status: statusFilter,
                priority: priorityFilter,
                label: labelFilter,
                mine: onlyMyTasks,
              }}
              onApplyView={handleApplySavedView}
              onOpenIcalModal={() => setShowIcalModal(true)}
              onOpenExportModal={() => setShowExportModal(true)}
              onOpenLegendPopover={() => setShowLegendPopover(true)}
              onSyncCompleted={() => fetchEvents(true)}
            />
          </div>

          {/* Right: Native Mobile & Small Tablet Controls (< md) */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            {/* Quick + Nueva tarea icon button */}
            <button
              type="button"
              onClick={() => setQuickCreateDates({ startDate: currentDate, dueDate: currentDate })}
              className="w-7 h-7 rounded-lg bg-[#6C5DD3] text-white flex items-center justify-center shadow-xs shadow-[#6C5DD3]/25 active:scale-95 transition-all"
              title="Nueva tarea"
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>

            {/* Backlog Sin fecha icon */}
            <button
              type="button"
              onClick={() => setShowUnscheduledDrawer(prev => !prev)}
              className="relative w-7 h-7 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center active:scale-95 transition-all"
              title="Sin fecha"
            >
              <Inbox size={13} />
              {unscheduledEvents.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#6C5DD3] text-white text-[8px] font-black flex items-center justify-center">
                  {unscheduledEvents.length}
                </span>
              )}
            </button>

            {/* Mobile Filters bottom sheet button */}
            <button
              type="button"
              onClick={() => setShowMobileFilterSheet(true)}
              className={`relative w-7 h-7 rounded-lg border flex items-center justify-center active:scale-95 transition-all ${
                activeFiltersCount > 0
                  ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/40 text-[#6C5DD3]'
                  : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
              }`}
              title="Filtros"
            >
              <Filter size={13} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#6C5DD3] text-white text-[8px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Mobile "Opciones" Button */}
            <CalendarOptionsMenu
              workspaceId={workspaceId || ''}
              currentView={activeView}
              colorBy={colorBy}
              onChangeColorBy={setColorBy}
              hideWeekends={hideWeekends}
              onToggleWeekends={() => setHideWeekends(prev => !prev)}
              currentFilters={{
                board: boardFilter,
                member: memberFilter,
                status: statusFilter,
                priority: priorityFilter,
                label: labelFilter,
                mine: onlyMyTasks,
              }}
              onApplyView={handleApplySavedView}
              onOpenIcalModal={() => setShowIcalModal(true)}
              onOpenExportModal={() => setShowExportModal(true)}
              onOpenLegendPopover={() => setShowLegendPopover(true)}
              onSyncCompleted={() => fetchEvents(true)}
            />
          </div>
        </div>

        {/* Tier 2 (Mobile/Tablet only): Native View Switcher Pill Bar */}
        <div className="flex md:hidden items-center bg-white dark:bg-[#1C1F26] p-0.5 rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-2xs overflow-x-auto no-scrollbar shrink-0">
          {(
            [
              { id: 'month', label: 'Mes' },
              { id: 'week', label: 'Semana' },
              { id: 'agenda', label: 'Agenda' },
              { id: 'team', label: 'Equipo' },
              { id: 'timeline', label: 'Timeline' },
            ] as { id: CalendarViewMode; label: string }[]
          ).map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id)}
              className={`flex-1 py-1 px-1.5 text-[11px] font-black rounded-lg transition-all text-center min-w-[52px] ${
                activeView === v.id
                  ? 'bg-[#6C5DD3] text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-white/5'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      {/* Floating Legend & "Mis Calendarios" Dialog */}
      <AnimatePresence>
        {showLegendPopover && (
          <>
            <div
              className="fixed inset-0 bg-black/20 dark:bg-black/50 z-[140]"
              onClick={() => setShowLegendPopover(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="fixed top-16 right-4 sm:right-10 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-4 z-[150] space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Palette size={15} className="text-[#6C5DD3]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Leyenda & Calendarios
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLegendPopover(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Interactive Multi-Board Toggle Checkboxes */}
              <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1">
                  Tableros ({uniqueBoards.length})
                </span>
                {uniqueBoards.map(b => {
                  const isVisible = !hiddenBoardIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBoardVisibility(b.id)}
                      className="w-full px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all"
                          style={{
                            backgroundColor: isVisible ? b.accentColor : 'transparent',
                            borderColor: b.accentColor,
                          }}
                        >
                          {isVisible && <Check size={10} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className={`truncate ${!isVisible ? 'opacity-45 line-through' : ''}`}>
                          {b.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {colorBy === 'priority' && (
                <div className="pt-2 border-t border-zinc-100 dark:border-white/10 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                    Colores de Prioridad
                  </span>
                  {Object.entries(PRIORITY_COLORS).map(([key, info]) => (
                    <div key={key} className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: info.hex }} />
                      <span>{info.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. COMPACT FILTER CHIPS + INTERACTIVE METRICS BAR (Requirement 1.6 & 3.5) */}
      <AnimatePresence initial={false}>
        {showDesktopFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="hidden md:flex items-center justify-between gap-2 pb-2 overflow-x-auto no-scrollbar shrink-0"
          >
            {/* Left: Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {/* Mis tareas 1-click chip */}
              <button
                type="button"
                onClick={() => setOnlyMyTasks(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                  onlyMyTasks
                    ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-xs'
                    : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-[#6C5DD3]/50'
                }`}
              >
                <UserCheck size={12} />
                <span>Mis tareas</span>
              </button>

              {/* Tablero Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                <Layout size={12} className="text-[#6C5DD3]" />
                <select
                  value={boardFilter}
                  onChange={e => setBoardFilter(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer max-w-[140px] truncate"
                >
                  <option value="all" className="dark:bg-[#1C1F26]">Todos los tableros</option>
                  {uniqueBoards.map(b => (
                    <option key={b.id} value={b.id} className="dark:bg-[#1C1F26]">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asignado Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                <Users size={12} className="text-[#6C5DD3]" />
                <select
                  value={memberFilter}
                  onChange={e => setMemberFilter(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="all" className="dark:bg-[#1C1F26]">Cualquier miembro</option>
                  <option value="unassigned" className="dark:bg-[#1C1F26]">Sin asignar</option>
                  {uniqueMembers.map(m => (
                    <option key={m.id} value={m.id} className="dark:bg-[#1C1F26]">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prioridad Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                <Flag size={12} className="text-[#6C5DD3]" />
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#1C1F26]">Prioridad</option>
                  <option value="P0" className="dark:bg-[#1C1F26]">P0 · Crítica</option>
                  <option value="P1" className="dark:bg-[#1C1F26]">P1 · Alta</option>
                  <option value="P2" className="dark:bg-[#1C1F26]">P2 · Media</option>
                  <option value="P3" className="dark:bg-[#1C1F26]">P3 · Baja</option>
                </select>
              </div>

              {/* Etiqueta Chip */}
              {uniqueLabels.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                  <Tag size={12} className="text-[#6C5DD3]" />
                  <select
                    value={labelFilter}
                    onChange={e => setLabelFilter(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer max-w-[120px] truncate"
                  >
                    <option value="all" className="dark:bg-[#1C1F26]">Etiqueta</option>
                    {uniqueLabels.map(l => (
                      <option key={l.id} value={l.id} className="dark:bg-[#1C1F26]">
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                >
                  <RotateCcw size={12} />
                  <span>Limpiar ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            {/* Right: Interactive Period Metrics Bar (Requirement 3.5) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSetStatusFilter(statusFilter === 'done' ? 'all' : 'done')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                  statusFilter === 'done'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/40'
                }`}
                title="Filtrar completadas"
              >
                <CheckCircle2 size={11} />
                <span>
                  {metrics.completed}/{metrics.total} ({metrics.pct}%)
                </span>
              </button>

              {metrics.dueSoon > 0 && (
                <button
                  type="button"
                  onClick={() => handleSetStatusFilter(statusFilter === 'due_soon' ? 'all' : 'due_soon')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                    statusFilter === 'due_soon'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/40'
                  }`}
                  title="Filtrar tareas que vencen en 48h"
                >
                  <Clock size={11} />
                  <span>{metrics.dueSoon} pronto</span>
                </button>
              )}

              {metrics.overdue > 0 && (
                <button
                  type="button"
                  onClick={() => handleSetStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                    statusFilter === 'overdue'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  }`}
                  title="Filtrar tareas vencidas"
                >
                  <AlertCircle size={11} />
                  <span>{metrics.overdue} vencidas</span>
                </button>
              )}

              {metrics.blocked > 0 && (
                <button
                  type="button"
                  onClick={() => handleSetStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                    statusFilter === 'blocked'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  }`}
                  title="Filtrar tareas bloqueadas"
                >
                  <Lock size={11} />
                  <span>{metrics.blocked} bloq.</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BANNER INFORMATIVO CUANDO EL FILTRO DE VENCIDAS ESTÁ ACTIVO */}
      {statusFilter === 'overdue' && (
        <div className="mx-3 sm:mx-6 mb-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/30">
              <AlertCircle size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Filtro de Vencidas Activo
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'tarea' : 'tareas'}
                </span>
              </div>
              <p className="text-xs text-rose-900/90 dark:text-rose-200/90 truncate mt-0.5">
                {filteredEvents.length === 1 ? (
                  <>
                    <strong className="font-semibold text-rose-950 dark:text-white">
                      {filteredEvents[0].title}
                    </strong>{' '}
                    · Venció el{' '}
                    {format(getEventDateRange(filteredEvents[0]).end, "d 'de' MMMM yyyy", { locale: es })}
                    {!isSameMonth(getEventDateRange(filteredEvents[0]).end, currentDate) && (
                      <span className="ml-1 text-rose-600 dark:text-rose-400 font-bold">
                        (en {format(getEventDateRange(filteredEvents[0]).end, 'MMMM yyyy', { locale: es })})
                      </span>
                    )}
                  </>
                ) : filteredEvents.length > 1 ? (
                  `${filteredEvents.length} tareas tienen fecha límite anterior a hoy.`
                ) : (
                  'No hay tareas vencidas que coincidan con los filtros seleccionados.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
            {filteredEvents.length === 1 && (
              <button
                type="button"
                onClick={() => handleSelectEvent(filteredEvents[0])}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Abrir tarjeta
              </button>
            )}
            {filteredEvents.length > 0 && !isSameMonth(getEventDateRange(filteredEvents[0]).end, currentDate) && (
              <button
                type="button"
                onClick={() => setCurrentDate(getEventDateRange(filteredEvents[0]).end)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1F26] border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-white/5 transition-all"
              >
                Ir a {format(getEventDateRange(filteredEvents[0]).end, 'MMMM', { locale: es })}
              </button>
            )}
            {activeView !== 'agenda' && (
              <button
                type="button"
                onClick={() => setActiveView('agenda')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
              >
                Ver en Agenda
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              Quitar filtro
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN CALENDAR WORKSPACE + UNSCHEDULED BACKLOG DRAWER */}
      <div id="lumins-calendar-export-target" className="flex-1 min-h-0 flex gap-2.5 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#181B22] rounded-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden animate-pulse">
            <div className="grid grid-cols-7 border-b border-zinc-200/70 dark:border-white/10 py-2.5 px-4 bg-zinc-50 dark:bg-[#15181F]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-3 w-10 bg-zinc-200 dark:bg-white/10 rounded mx-auto" />
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-5">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="p-2 border-r border-b border-zinc-100 dark:border-white/[0.04] space-y-2"
                >
                  <div className="h-5 w-5 rounded-full bg-zinc-200/80 dark:bg-white/10" />
                  {i % 3 === 0 && (
                    <div className="h-4 w-4/5 rounded bg-zinc-200/70 dark:bg-white/5" />
                  )}
                  {i % 5 === 0 && (
                    <div className="h-4 w-3/5 rounded bg-zinc-200/50 dark:bg-white/5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : activeView === 'month' ? (
          <LuminsCalendarMonthView
            currentDate={currentDate}
            events={filteredEvents}
            colorBy={colorBy}
            hideWeekends={hideWeekends}
            onSelectEvent={handleSelectEvent}
            onRescheduleEvent={handleRescheduleEvent}
            onToggleDone={handleToggleDone}
            onOpenQuickCreate={(start, due) =>
              setQuickCreateDates({ startDate: start, dueDate: due })
            }
            onResizeEventDates={handleResizeEventDates}
            onDropUnscheduledCard={(cardId, day) => handleDropUnscheduledCard(cardId, day)}
            onOpenQuickMenu={(ev, pos) => setQuickMenuState({ event: ev, pos })}
          />
        ) : activeView === 'week' ? (
          <LuminsCalendarWeekView
            currentDate={currentDate}
            events={filteredEvents}
            colorBy={colorBy}
            hideWeekends={hideWeekends}
            onSelectEvent={handleSelectEvent}
            onRescheduleEvent={handleRescheduleEvent}
            onToggleDone={handleToggleDone}
            onOpenQuickCreate={(start, due) =>
              setQuickCreateDates({ startDate: start, dueDate: due })
            }
            onDropUnscheduledCard={(cardId, day) => handleDropUnscheduledCard(cardId, day)}
            onOpenQuickMenu={(ev, pos) => setQuickMenuState({ event: ev, pos })}
          />
        ) : activeView === 'team' ? (
          <LuminsCalendarTeamView
            currentDate={currentDate}
            events={filteredEvents}
            members={uniqueMembers}
            colorBy={colorBy}
            hideWeekends={hideWeekends}
            onSelectEvent={handleSelectEvent}
            onReassignAndReschedule={handleReassignAndReschedule}
            onDropUnscheduledCard={handleDropUnscheduledCard}
            onOpenQuickCreate={day => setQuickCreateDates({ startDate: day, dueDate: day })}
            onOpenQuickMenu={(ev, pos) => setQuickMenuState({ event: ev, pos })}
          />
        ) : activeView === 'timeline' ? (
          <LuminsCalendarTimelineView
            currentDate={currentDate}
            events={filteredEvents}
            boards={uniqueBoards}
            members={uniqueMembers}
            colorBy={colorBy}
            onSelectEvent={handleSelectEvent}
            onResizeEventDates={handleResizeEventDates}
            onOpenQuickMenu={(ev, pos) => setQuickMenuState({ event: ev, pos })}
          />
        ) : (
          <LuminsCalendarAgendaView
            currentDate={currentDate}
            onChangeDate={setCurrentDate}
            events={filteredEvents}
            colorBy={colorBy}
            onSelectEvent={handleSelectEvent}
            onToggleDone={handleToggleDone}
          />
        )}

        {/* Backlog "Sin fecha" Drawer (Requirement 2.4) */}
        <CalendarUnscheduledDrawer
          isOpen={showUnscheduledDrawer}
          onClose={() => setShowUnscheduledDrawer(false)}
          unscheduledEvents={unscheduledEvents}
          boards={uniqueBoards}
          colorBy={colorBy}
          onScheduleCard={(ev, day) => handleDropUnscheduledCard(ev.id, day)}
          onSelectEvent={handleSelectEvent}
          onOpenQuickMenu={(ev, pos) => setQuickMenuState({ event: ev, pos })}
        />
      </div>

      {/* 4. QUICK CREATE POPOVER (Requirement 2.1 & 2.2) */}
      {quickCreateDates && (
        <QuickCreatePopover
          workspaceId={workspaceId}
          initialStartDate={quickCreateDates.startDate}
          initialDueDate={quickCreateDates.dueDate}
          boards={uniqueBoards}
          members={uniqueMembers}
          onClose={() => setQuickCreateDates(null)}
          onCreated={newEvent => {
            setEvents(prev => [...prev, newEvent]);
            fetchEvents(true);
          }}
        />
      )}

      {/* 5. QUICK CONTEXT MENU (Requirement 2.5) */}
      {quickMenuState && (
        <CalendarQuickActionsMenu
          event={quickMenuState.event}
          position={quickMenuState.pos}
          members={uniqueMembers}
          onClose={() => setQuickMenuState(null)}
          onOpenDetail={handleSelectEvent}
          onOpenBoard={bId => navigate(`/b/${bId}`)}
          onToggleDone={ev => handleToggleDone(ev)}
          onChangePriority={handleChangePriority}
          onToggleAssignee={handleToggleAssignee}
          onQuickMoveDate={(ev, day) => handleRescheduleEvent(ev, day)}
          onRemoveDate={ev =>
            applyCardDatesUpdate(ev, null, null, 'Fecha eliminada (enviada a Sin fecha)')
          }
          onRequestArchive={ev => setCardToArchive(ev)}
        />
      )}

      {/* 6. GLOBAL CONFIRM MODAL FOR ARCHIVING CARD (Requirement 2.5) */}
      <ConfirmActionModal
        isOpen={Boolean(cardToArchive)}
        title="Archivar tarjeta"
        description={
          cardToArchive
            ? `¿Estás seguro de archivar la tarjeta "${cardToArchive.title}"? Podrás restaurarla en cualquier momento desde los Elementos Archivados de su tablero.`
            : ''
        }
        confirmLabel="Archivar tarjeta"
        cancelLabel="Cancelar"
        variant="warning"
        isLoading={isArchivingCard}
        onConfirm={handleConfirmArchiveCard}
        onClose={() => setCardToArchive(null)}
      />

      {/* 7. MOBILE FILTERS BOTTOM SHEET (< md) */}
      <AnimatePresence>
        {showMobileFilterSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[130] md:hidden"
              onClick={() => setShowMobileFilterSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[140] md:hidden bg-white dark:bg-[#1C1F26] rounded-t-2xl border-t border-zinc-200 dark:border-white/10 shadow-2xl max-h-[85dvh] flex flex-col"
            >
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  Filtros y visualización
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterSheet(false)}
                  className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Buscar por texto
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Título, tablero o lista..."
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setOnlyMyTasks(prev => !prev)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold border flex items-center justify-between ${
                    onlyMyTasks
                      ? 'bg-[#6C5DD3]/10 border-[#6C5DD3] text-[#6C5DD3] dark:text-[#A599F9]'
                      : 'bg-zinc-50 dark:bg-[#13151A] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck size={16} />
                    Solo mis tareas asignadas
                  </span>
                  <span className="text-xs font-extrabold">{onlyMyTasks ? 'Activo' : 'No'}</span>
                </button>

                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Tablero
                  </label>
                  <select
                    value={boardFilter}
                    onChange={e => setBoardFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="all">Todos los tableros</option>
                    {uniqueBoards.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => handleSetStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="all">Cualquier estado</option>
                    <option value="pending">Pendientes</option>
                    <option value="done">Completadas</option>
                    <option value="overdue">Solo vencidas</option>
                    <option value="due_soon">Por vencer pronto</option>
                    <option value="blocked">Solo bloqueadas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Prioridad
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="all">Cualquier prioridad</option>
                    <option value="P0">P0 · Crítica</option>
                    <option value="P1">P1 · Alta</option>
                    <option value="P2">P2 · Media</option>
                    <option value="P3">P3 · Baja</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Colorear tarjetas por
                  </label>
                  <select
                    value={colorBy}
                    onChange={e => setColorBy(e.target.value as CalendarColorBy)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="board">Tablero</option>
                    <option value="priority">Prioridad</option>
                    <option value="label">Etiqueta</option>
                    <option value="status">Estado</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-white/5 flex items-center gap-3 pb-6">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-white/5 text-xs font-extrabold text-zinc-600 dark:text-zinc-300"
                >
                  Restablecer
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterSheet(false)}
                  className="flex-1 py-3 rounded-xl bg-[#6C5DD3] text-xs font-extrabold text-white shadow-lg shadow-[#6C5DD3]/25"
                >
                  Ver {filteredEvents.length} tareas
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 8. CARD DETAIL MODAL */}
      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal
            cardId={selectedCard.cardId}
            boardId={selectedCard.boardId}
            isOpen={!!selectedCard}
            onClose={() => {
              setSelectedCard(null);
              fetchEvents(true);
            }}
            onUpdate={() => fetchEvents(true)}
          />
        )}
      </AnimatePresence>

      {/* 9. ICAL SUBSCRIPTION MODAL (Requirement 4.3) */}
      <CalendarIcalModal
        isOpen={showIcalModal}
        onClose={() => setShowIcalModal(false)}
        workspaceId={workspaceId || ''}
        workspaceName={boardsList[0]?.name ? `Workspace` : undefined}
      />

      {/* 10. CLEAN PRESENTATION EXPORT MODAL (Requirement 4.5) */}
      <CalendarExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        workspaceName={((user as any)?.workspaces as Array<{ id: string; name: string }> | undefined)?.find(w => w.id === workspaceId)?.name || 'Lumins'}
        currentDateText={periodTitle}
        totalEvents={filteredEvents.length}
        completedCount={metrics.completed}
        events={filteredEvents}
        exportTargetId="lumins-calendar-export-target"
      />
    </div>
  );
};

export default WorkspaceCalendarPage;
