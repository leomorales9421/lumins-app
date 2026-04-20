import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Layout,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Hash,
  ExternalLink,
  ChevronDown,
  Search
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import CardDetailModal from '../components/CardDetailModal';
import { useNotificationHelpers } from '../components/NotificationProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  backgroundColor: string;
  extendedProps: {
    boardId: string;
    boardName: string;
    boardBackground?: string;
    listName: string;
    isDueDateDone: boolean;
    labels: any[];
    assignees: any[];
  };
}

const WorkspaceCalendarPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<{cardId: string, boardId: string} | null>(null);
  const [currentDateTitle, setCurrentDateTitle] = useState('');
  const [activeView, setActiveView] = useState('dayGridMonth');
  const calendarRef = React.useRef<FullCalendar>(null);
  const { showSuccess, showError } = useNotificationHelpers();

  // Filters State
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, pending, done

  const fetchEvents = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get<{ data: { events: CalendarEvent[] } }>(
        `/api/workspaces/${workspaceId}/calendar-events`
      );
      setEvents(response.data.events);
    } catch (err) {
      console.error('Failed to fetch calendar events', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Derive unique boards and members for filters
  const uniqueBoards = useMemo(() => {
    const boardsMap = new Map();
    events?.forEach(event => {
      if (event.extendedProps?.boardId && event.extendedProps?.boardName) {
        boardsMap.set(event.extendedProps.boardId, event.extendedProps.boardName);
      }
    });
    return Array.from(boardsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);

  const uniqueMembers = useMemo(() => {
    const membersMap = new Map();
    events?.forEach(event => {
      event.extendedProps?.assignees?.forEach(member => {
        if (member?.id) {
          membersMap.set(member.id, member);
        }
      });
    });
    return Array.from(membersMap.values());
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(event => {
      const boardMatch = boardFilter === 'all' || event.extendedProps?.boardId === boardFilter;
      const memberMatch = memberFilter === 'all' || event.extendedProps?.assignees?.some(m => m.id === memberFilter);
      
      let statusMatch = true;
      if (statusFilter === 'pending') {
        statusMatch = !event.extendedProps?.isDueDateDone && 
                      event.extendedProps?.listName?.toLowerCase() !== 'done' && 
                      event.extendedProps?.listName?.toLowerCase() !== 'hecho';
      } else if (statusFilter === 'done') {
        statusMatch = event.extendedProps?.isDueDateDone || 
                      event.extendedProps?.listName?.toLowerCase() === 'done' || 
                      event.extendedProps?.listName?.toLowerCase() === 'hecho';
      }

      return boardMatch && memberMatch && statusMatch;
    });
  }, [events, boardFilter, memberFilter, statusFilter]);

  const handleEventDrop = async (info: any) => {
    const { event } = info;
    try {
      await apiClient.patch(`/api/cards/${event.id}/dates`, {
        dueDate: event.start ? event.start.toISOString() : null,
        startDate: event.start ? event.start.toISOString() : null
      });
      showSuccess('Tarea reprogramada con éxito');
      fetchEvents();
    } catch (err) {
      showError('No se pudo reprogramar la tarea');
      info.revert();
    }
  };

  const handleEventClick = (info: any) => {
    setSelectedCard({
      cardId: info.event.id,
      boardId: info.event.extendedProps.boardId
    });
  };

  const updateTitle = () => {
    if (calendarRef.current) {
      setCurrentDateTitle(calendarRef.current.getApi().view.title);
    }
  };

  useEffect(() => {
    // Initial title
    setTimeout(updateTitle, 100);
  }, [isLoading]);

  const changeView = (view: string) => {
    setActiveView(view);
    calendarRef.current?.getApi().changeView(view);
    updateTitle();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#13151A] p-4 sm:p-8 font-sans transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER PREMIUM */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#6C5DD3] font-bold text-xs uppercase tracking-widest mb-1">
              <div className="p-1.5 bg-purple-50 dark:bg-[#6C5DD3]/10 rounded-lg">
                <CalendarIcon size={14} />
              </div>
              <span>Vista Corporativa</span>
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">               {currentDateTitle || 'Cargando...'}
              <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-xs font-bold rounded-full uppercase tracking-tighter border border-zinc-200 dark:border-white/10">
                Workspace
              </span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Gestiona el roadmap de todos tus tableros en un solo lugar.</p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-[#1C1F26] p-1.5 rounded-xl shadow-sm border border-zinc-200 dark:border-white/10">
            <div className="flex gap-1 pr-2 border-r border-zinc-100 dark:border-white/5">
              <button 
                onClick={() => { calendarRef.current?.getApi().prev(); updateTitle(); }}
                className="p-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => { calendarRef.current?.getApi().today(); updateTitle(); }}
                className="px-4 py-1.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button 
                onClick={() => { calendarRef.current?.getApi().next(); updateTitle(); }}
                className="p-2 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={() => changeView('dayGridMonth')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                  activeView === 'dayGridMonth' 
                  ? 'bg-zinc-900 dark:bg-[#6C5DD3] text-white shadow-md' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
              >
                Mes
              </button>
              <button 
                onClick={() => changeView('dayGridWeek')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                  activeView === 'dayGridWeek' 
                  ? 'bg-zinc-900 dark:bg-[#6C5DD3] text-white shadow-md' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
              >
                Semana
              </button>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS AVANZADOS */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 px-2 border-r border-zinc-100 dark:border-white/5 mr-2">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Filtros</span>
          </div>

          {/* Filtro por Tablero */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">Tablero</label>
            <div className="relative group">
              <Layout size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-[#6C5DD3] transition-colors" />
              <select 
                value={boardFilter}
                onChange={(e) => setBoardFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-[#6C5DD3]/20 focus:border-[#6C5DD3] transition-all appearance-none min-w-[160px]"
              >
                <option value="all">Todos los tableros</option>
                {uniqueBoards.map(board => (
                  <option key={board.id} value={board.id}>{board.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Filtro por Asignado */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">Asignado</label>
            <div className="relative group">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-[#6C5DD3] transition-colors" />
              <select 
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-[#6C5DD3]/20 focus:border-[#6C5DD3] transition-all appearance-none min-w-[160px]"
              >
                <option value="all">Cualquier miembro</option>
                {uniqueMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Filtro por Estado */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">Estado</label>
            <div className="relative group">
              <CheckCircle2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-[#6C5DD3] transition-colors" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-[#6C5DD3]/20 focus:border-[#6C5DD3] transition-all appearance-none min-w-[160px]"
              >
                <option value="all">Cualquier estado</option>
                <option value="pending">Pendientes (No Done)</option>
                <option value="done">Completadas</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div className="ml-auto">
            <button 
              onClick={() => { setBoardFilter('all'); setMemberFilter('all'); setStatusFilter('all'); }}
              className="px-4 py-2 text-xs font-bold text-[#6C5DD3] hover:bg-[#6C5DD3]/10 rounded-xl transition-colors"
            >
              Restablecer
            </button>
          </div>
        </motion.div>

        {/* CALENDAR CONTAINER */}
        <div className="bg-white dark:bg-[#1C1F26] rounded-[2rem] border border-zinc-200 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden p-6 calendar-container relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 dark:bg-[#1C1F26]/50 backdrop-blur-[2px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C5DD3]"></div>
            </div>
          )}
          
          <style>{`
            .fc {
              --fc-border-color: rgba(241, 245, 249, 0.1);
              --fc-today-bg-color: rgba(248, 250, 252, 0.05);
              --fc-event-bg-color: transparent;
              --fc-event-border-color: transparent;
              --fc-page-bg-color: transparent;
              font-family: inherit;
            }
            .dark .fc {
               --fc-border-color: rgba(255, 255, 255, 0.05);
            }
            .fc .fc-scrollgrid {
              border-radius: 1.5rem;
              overflow: hidden;
              border: 1px solid #E2E8F0;
            }
            .fc .fc-col-header-cell {
              background: #F8FAFC;
            }
            .dark .fc .fc-col-header-cell {
              background: rgba(255, 255, 255, 0.02);
            }
            .fc .fc-col-header-cell-cushion {
              padding: 16px 4px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #64748B;
            }
            .dark .fc .fc-col-header-cell-cushion {
              color: #94A3B8;
            }
            .fc .fc-daygrid-day-number {
              font-size: 13px;
              font-weight: 700;
              color: #334155;
              padding: 12px;
              transition: color 0.2s;
            }
            .dark .fc .fc-daygrid-day-number {
              color: #E2E8F0;
            }
            .fc .fc-day-today .fc-daygrid-day-number {
              color: #4F46E5;
              background: #EEF2FF;
              border-radius: 0 0 0 12px;
            }
            .fc .fc-day-today {
              background-color: #F8FAFC !important;
            }
            .fc .fc-daygrid-day-top {
              flex-direction: row;
            }
            .fc .fc-daygrid-event-harness {
              margin: 2px 8px !important;
            }
            .fc .fc-event {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
            }
            .fc .fc-daygrid-more-link {
              font-size: 11px;
              font-weight: 800;
              color: #6366F1;
              padding: 4px 8px;
              background: #F5F3FF;
              border-radius: 6px;
              margin-left: 8px;
            }
          `}</style>
          
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={filteredEvents}
            headerToolbar={false}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            locale="es"
            height="auto"
            dayMaxEvents={3}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            eventContent={(arg) => {
              const { event } = arg;
              const props = event.extendedProps || {};
              const listName = props.listName?.toLowerCase() || '';
              const isDone = props.isDueDateDone || 
                             listName === 'done' || 
                             listName === 'hecho';
              
              const isOverdue = !isDone && 
                                event.start && 
                                isBefore(startOfDay(new Date(event.start)), startOfDay(new Date()));

              return (
                <div className={`
                  w-full flex flex-col gap-1 p-2 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md cursor-pointer group bg-white dark:bg-[#13151A]
                  ${isDone ? 'border-emerald-500 opacity-75' : isOverdue ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-500/10' : 'border-[#6C5DD3]'}
                  border border-zinc-200 dark:border-white/10
                `}>
                  {/* Board Tag */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter truncate max-w-[80%]">
                      {props.boardName || 'Sin Tablero'}
                    </span>
                    {isOverdue && <AlertCircle size={10} className="text-rose-500" />}
                    {isDone && <CheckCircle2 size={10} className="text-emerald-500" />}
                  </div>

                  {/* Title & Avatar */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`
                      text-[11px] font-bold leading-tight line-clamp-2
                      ${isDone ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}
                      ${isOverdue ? 'text-rose-900 dark:text-rose-200' : ''}
                    `}>
                      {event.title}
                    </span>
                    
                    {event.extendedProps.assignees?.[0] && (
                      <div className="shrink-0 relative group/avatar">
                        <img 
                          src={event.extendedProps.assignees[0].avatarUrl 
                            ? (event.extendedProps.assignees[0].avatarUrl.startsWith('http') 
                                ? event.extendedProps.assignees[0].avatarUrl 
                                : `${API_BASE_URL}${event.extendedProps.assignees[0].avatarUrl.startsWith('/') ? '' : '/'}${event.extendedProps.assignees[0].avatarUrl}`)
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(event.extendedProps.assignees[0].name)}&background=random`} 
                          className="w-4 h-4 rounded-full ring-1 ring-white shadow-sm object-cover"
                          alt={event.extendedProps.assignees[0].name}
                        />
                        {event.extendedProps.assignees.length > 1 && (
                          <div className="absolute -top-1 -right-1 bg-zinc-800 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full border border-white">
                            +{event.extendedProps.assignees.length - 1}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Stats (Labels) */}
                  {event.extendedProps.labels?.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {event.extendedProps.labels.slice(0, 3).map((label: any) => (
                        <div 
                          key={label.id}
                          className="h-1 w-3 rounded-full" 
                          style={{ backgroundColor: label.color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal 
            cardId={selectedCard.cardId} 
            boardId={selectedCard.boardId}
            isOpen={!!selectedCard} 
            onClose={() => setSelectedCard(null)} 
            onUpdate={fetchEvents}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceCalendarPage;
