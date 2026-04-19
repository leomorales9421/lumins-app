import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Layout,
  Clock
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { es } from 'date-fns/locale';
import { AnimatePresence } from 'framer-motion';
import CardDetailModal from '../components/CardDetailModal';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  backgroundColor: string;
  extendedProps: {
    boardId: string;
    boardName: string;
  };
}

const WorkspaceCalendarPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<{cardId: string, boardId: string} | null>(null);
  const calendarRef = React.useRef<FullCalendar>(null);

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

  const handleEventDrop = async (info: any) => {
    const { event } = info;
    try {
      await apiClient.patch(`/api/cards/${event.id}/dates`, {
        dueDate: event.end ? event.end.toISOString() : event.start.toISOString(),
        startDate: event.start ? event.start.toISOString() : null
      });
      // Refresh events to ensure consistency
      fetchEvents();
    } catch (err) {
      console.error('Failed to update card dates', err);
      info.revert();
    }
  };

  const handleEventClick = (info: any) => {
    setSelectedCard({
      cardId: info.event.id,
      boardId: info.event.extendedProps.boardId
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-4 sm:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#7A5AF8] mb-1">
              <CalendarIcon size={18} strokeWidth={2.5} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Workspace Roadmap</span>
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Calendario Global</h1>
            <p className="text-sm text-zinc-500 font-medium">Visualiza y reprograma las tareas de todo el espacio.</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => calendarRef.current?.getApi().prev()}
              className="p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => calendarRef.current?.getApi().today()}
              className="px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
            >
              Hoy
            </button>
            <button 
              onClick={() => calendarRef.current?.getApi().next()}
              className="p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl shadow-slate-200/40 overflow-hidden p-4 sm:p-6 calendar-container">
          <style>{`
            .fc {
              --fc-border-color: #f1f1f4;
              --fc-today-bg-color: #f5f3ff;
              font-family: inherit;
            }
            .fc .fc-col-header-cell-cushion {
              padding: 12px 4px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #71717a;
            }
            .fc .fc-daygrid-day-number {
              font-size: 13px;
              font-weight: 600;
              color: #3f3f46;
              padding: 8px;
            }
            .fc .fc-event {
              border: none !important;
              padding: 4px 8px !important;
              border-radius: 8px !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
              cursor: pointer !important;
              transition: all 0.2s !important;
            }
            .fc .fc-event:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
              filter: brightness(1.1);
            }
            .fc .fc-event-title {
              font-size: 11px !important;
              font-weight: 800 !important;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              color: white !important;
            }
            .fc-theme-standard td, .fc-theme-standard th {
              border-color: #f1f1f4;
            }
            .fc .fc-scrollgrid {
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid #f1f1f4;
            }
            .fc .fc-day-today {
              background-color: #F5F3FF !important;
            }
            .fc .fc-daygrid-event-harness {
              margin-bottom: 2px;
            }
          `}</style>
          
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={false}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            locale="es"
            height="auto"
            dayMaxEvents={true}
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
