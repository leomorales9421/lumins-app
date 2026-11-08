import React, { useState, useMemo } from 'react';
import { addDays, nextMonday, startOfDay, format } from 'date-fns';
import {
  X,
  Search,
  CalendarPlus,
  Inbox,
  CheckSquare,
  GripVertical,
  MoreHorizontal,
} from 'lucide-react';
import {
  type CalendarBoardInfo,
  type CalendarCardEvent,
  type CalendarColorBy,
  PRIORITY_COLORS,
  getEventAccentColor,
  parseCalendarDate,
} from '../../lib/calendar-utils';
import { getAvatarUrl } from './CalendarCardPreviewPopover';

interface CalendarUnscheduledDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  unscheduledEvents: CalendarCardEvent[];
  boards: CalendarBoardInfo[];
  colorBy: CalendarColorBy;
  onScheduleCard: (event: CalendarCardEvent, targetDate: Date) => void;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onOpenQuickMenu: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

const CalendarUnscheduledDrawer: React.FC<CalendarUnscheduledDrawerProps> = ({
  isOpen,
  onClose,
  unscheduledEvents,
  boards,
  colorBy,
  onScheduleCard,
  onSelectEvent,
  onOpenQuickMenu,
}) => {
  const [search, setSearch] = useState('');
  const [boardFilter, setBoardFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [activeScheduleCardId, setActiveScheduleCardId] = useState<string | null>(null);
  const [customDateStr, setCustomDateStr] = useState<string>(() =>
    format(new Date(), 'yyyy-MM-dd')
  );

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unscheduledEvents.filter(ev => {
      const props = ev.extendedProps;
      if (boardFilter !== 'ALL' && props.boardId !== boardFilter) return false;
      if (priorityFilter !== 'ALL' && (props.priority || 'P2') !== priorityFilter) return false;
      if (q) {
        const hay = `${ev.title} ${props.boardName} ${props.listName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [unscheduledEvents, boardFilter, priorityFilter, search]);

  if (!isOpen) return null;

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const upcomingMonday = nextMonday(today);

  return (
    <aside className="w-full sm:w-80 lg:w-84 shrink-0 h-full bg-white dark:bg-[#181B22] rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#15181F] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#6C5DD3]/12 text-[#6C5DD3] dark:text-[#A599F9] flex items-center justify-center shrink-0">
            <Inbox size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">
                Sin fecha
              </h3>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#6C5DD3]/15 text-[#6C5DD3] dark:text-[#A599F9]">
                {filteredCards.length}
              </span>
            </div>
            <p className="text-[10px] font-medium text-zinc-400 truncate">
              Arrastra a un día o pulsa Programar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors"
          title="Cerrar panel Sin fecha"
        >
          <X size={15} />
        </button>
      </div>

      {/* Filters */}
      <div className="p-2.5 border-b border-zinc-100 dark:border-white/[0.06] space-y-2 shrink-0 bg-white dark:bg-[#181B22]">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tarjeta sin fecha..."
            className="w-full h-8 pl-8 pr-7 rounded-lg bg-zinc-100/80 dark:bg-white/[0.05] border border-transparent focus:border-[#6C5DD3] text-xs font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={boardFilter}
            onChange={e => setBoardFilter(e.target.value)}
            className="h-7 px-2 rounded-lg bg-zinc-50 dark:bg-[#14171E] border border-zinc-200/80 dark:border-white/10 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-[#6C5DD3]"
          >
            <option value="ALL">Todos los tableros</option>
            {boards.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="h-7 px-2 rounded-lg bg-zinc-50 dark:bg-[#14171E] border border-zinc-200/80 dark:border-white/10 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-[#6C5DD3]"
          >
            <option value="ALL">Cualquier prioridad</option>
            <option value="P0">P0 · Crítica</option>
            <option value="P1">P1 · Alta</option>
            <option value="P2">P2 · Media</option>
            <option value="P3">P3 · Baja</option>
          </select>
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 space-y-2">
        {filteredCards.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center px-4">
            <Inbox size={28} className="text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
              {unscheduledEvents.length === 0
                ? '¡Todas las tarjetas tienen fecha!'
                : 'Sin coincidencias con este filtro'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {unscheduledEvents.length === 0
                ? 'No quedan tareas pendientes de programar.'
                : 'Prueba limpiando la búsqueda o cambiando de tablero.'}
            </p>
          </div>
        ) : (
          filteredCards.map(ev => {
            const props = ev.extendedProps;
            const canEdit = props.canEdit !== false;
            const accentColor = getEventAccentColor(ev, colorBy);
            const priorityInfo =
              PRIORITY_COLORS[props.priority || 'P2'] || PRIORITY_COLORS.P2;
            const isScheduling = activeScheduleCardId === ev.id;

            return (
              <div
                key={ev.id}
                draggable={canEdit}
                onDragStart={e => {
                  if (!canEdit) return;
                  e.dataTransfer.setData('application/lumins-calendar-card', ev.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  onOpenQuickMenu(ev, { x: e.clientX, y: e.clientY });
                }}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: accentColor,
                }}
                className={`group p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1E222B] hover:border-[#6C5DD3]/50 shadow-2xs transition-all space-y-1.5 ${
                  canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                }`}
              >
                {/* Top: Board › List + Context menu */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0 text-[10px] font-bold text-zinc-400">
                    {canEdit && (
                      <GripVertical
                        size={12}
                        className="text-zinc-300 dark:text-zinc-600 shrink-0 -ml-1"
                      />
                    )}
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: props.boardAccentColor || accentColor }}
                    />
                    <span className="truncate text-zinc-600 dark:text-zinc-300">
                      {props.boardName}
                    </span>
                    <span>›</span>
                    <span className="truncate">{props.listName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      onOpenQuickMenu(ev, { x: rect.left, y: rect.bottom + 4 });
                    }}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10"
                  >
                    <MoreHorizontal size={13} />
                  </button>
                </div>

                {/* Title */}
                <p
                  onClick={() => onSelectEvent(ev)}
                  className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 break-words [overflow-wrap:anywhere] cursor-pointer hover:text-[#6C5DD3]"
                >
                  {ev.title}
                </p>

                {/* Bottom row: Priority + Assignees + Quick Schedule button */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${priorityInfo.badgeClass}`}
                    >
                      {props.priority || 'P2'}
                    </span>

                    {(props.checklistTotal || 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-zinc-400">
                        <CheckSquare size={10} />
                        {props.checklistCompleted}/{props.checklistTotal}
                      </span>
                    )}

                    {props.assignees && props.assignees.length > 0 && (
                      <div className="flex items-center -space-x-1">
                        {props.assignees.slice(0, 2).map(m => (
                          <img
                            key={m.id}
                            src={getAvatarUrl(m)}
                            alt={m.name}
                            title={m.name}
                            style={{ borderRadius: '9999px' }}
                            className="w-4 h-4 object-cover ring-1 ring-white dark:ring-[#1E222B]"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setActiveScheduleCardId(isScheduling ? null : ev.id);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                        isScheduling
                          ? 'bg-[#6C5DD3] text-white'
                          : 'bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#A599F9] hover:bg-[#6C5DD3]/20'
                      }`}
                    >
                      <CalendarPlus size={11} />
                      Programar
                    </button>
                  )}
                </div>

                {/* Inline Quick Schedule Picker */}
                {isScheduling && canEdit && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="mt-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06] space-y-1.5 animate-in fade-in duration-100"
                  >
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onScheduleCard(ev, today);
                          setActiveScheduleCardId(null);
                        }}
                        className="py-1 rounded-md bg-zinc-100 dark:bg-white/[0.06] hover:bg-[#6C5DD3] hover:text-white text-[10px] font-extrabold text-zinc-700 dark:text-zinc-200 transition-colors"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onScheduleCard(ev, tomorrow);
                          setActiveScheduleCardId(null);
                        }}
                        className="py-1 rounded-md bg-zinc-100 dark:bg-white/[0.06] hover:bg-[#6C5DD3] hover:text-white text-[10px] font-extrabold text-zinc-700 dark:text-zinc-200 transition-colors"
                      >
                        Mañana
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onScheduleCard(ev, upcomingMonday);
                          setActiveScheduleCardId(null);
                        }}
                        className="py-1 rounded-md bg-zinc-100 dark:bg-white/[0.06] hover:bg-[#6C5DD3] hover:text-white text-[10px] font-extrabold text-zinc-700 dark:text-zinc-200 transition-colors"
                      >
                        Próx. Lun
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={customDateStr}
                        onChange={e => setCustomDateStr(e.target.value)}
                        className="flex-1 h-7 px-2 rounded-md bg-zinc-50 dark:bg-[#13161C] border border-zinc-200 dark:border-white/10 text-[11px] font-bold text-zinc-800 dark:text-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseCalendarDate(customDateStr);
                          if (parsed) {
                            onScheduleCard(ev, parsed);
                            setActiveScheduleCardId(null);
                          }
                        }}
                        className="h-7 px-2.5 rounded-md bg-[#6C5DD3] text-white text-[10px] font-extrabold hover:bg-[#5b4eb8]"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default CalendarUnscheduledDrawer;

