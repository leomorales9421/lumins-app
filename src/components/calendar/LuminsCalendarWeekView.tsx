import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  format,
  isSameDay,
  isToday,
  isWeekend,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarRange,
  Plus,
} from 'lucide-react';
import {
  type CalendarCardEvent,
  type CalendarColorBy,
  PRIORITY_COLORS,
  buildWeekDays,
  getDayKey,
  getEventAccentColor,
  getEventDateRange,
  isCardCompleted,
  isEventOverdue,
  segmentEventsForWeek,
} from '../../lib/calendar-utils';
import { getAvatarUrl } from './CalendarCardPreviewPopover';

interface LuminsCalendarWeekViewProps {
  currentDate: Date;
  events: CalendarCardEvent[];
  colorBy: CalendarColorBy;
  hideWeekends: boolean;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onRescheduleEvent: (event: CalendarCardEvent, targetDate: Date) => void;
  onToggleDone: (event: CalendarCardEvent, e: React.MouseEvent) => void;
  onOpenQuickCreate?: (startDate: Date, dueDate?: Date) => void;
  onDropUnscheduledCard?: (cardId: string, targetDate: Date) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

interface DraggableWeekCardProps {
  event: CalendarCardEvent;
  colorBy: CalendarColorBy;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onToggleDone: (event: CalendarCardEvent, e: React.MouseEvent) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

const DraggableWeekCard: React.FC<DraggableWeekCardProps> = ({
  event,
  colorBy,
  onSelectEvent,
  onToggleDone,
  onOpenQuickMenu,
}) => {
  const props = event.extendedProps;
  const canEdit = props.canEdit !== false;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `week-card:${event.id}`,
    data: { event },
    disabled: !canEdit,
  });

  const done = isCardCompleted(event);
  const overdue = isEventOverdue(event);
  const accentColor = getEventAccentColor(event, colorBy);
  const priorityInfo = PRIORITY_COLORS[props.priority || 'P2'] || PRIORITY_COLORS.P2;
  const hasChecklist = (props.checklistTotal || 0) > 0;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelectEvent(event)}
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        onOpenQuickMenu?.(event, { x: e.clientX, y: e.clientY });
      }}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: done ? '#10B981' : overdue ? '#EF4444' : accentColor,
      }}
      className={`group p-2.5 rounded-lg border border-zinc-200/90 dark:border-white/10 shadow-2xs transition-all select-none space-y-2 ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? 'opacity-35 scale-[0.98]' : 'hover:shadow-md hover:border-zinc-300 dark:hover:border-white/20'} ${
        done
          ? 'bg-emerald-500/[0.06] dark:bg-emerald-500/10 opacity-80'
          : overdue
          ? 'bg-rose-500/[0.06] dark:bg-rose-500/12'
          : 'bg-white dark:bg-[#1E222B]'
      }`}
    >
      {/* Top Row: Board › List & Quick Check */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 min-w-0 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: props.boardAccentColor || accentColor }}
          />
          <span className="truncate">{props.boardName}</span>
          <span>›</span>
          <span className="truncate text-zinc-500 dark:text-zinc-400">{props.listName}</span>
        </div>

        {canEdit && (
          <button
            type="button"
            title={done ? 'Marcar como pendiente' : 'Marcar como lista'}
            onClick={e => onToggleDone(event, e)}
            onPointerDown={e => e.stopPropagation()}
            style={{ borderRadius: '9999px' }}
            className={`w-5 h-5 flex items-center justify-center border-2 transition-all shrink-0 ${
              done
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-zinc-300 dark:border-white/25 text-zinc-300 dark:text-white/25 hover:border-emerald-500 hover:text-emerald-500'
            }`}
          >
            <Check size={11} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Title (2 lines) */}
      <p
        className={`text-xs font-bold leading-snug line-clamp-2 break-words [overflow-wrap:anywhere] ${
          done
            ? 'line-through text-zinc-400 dark:text-zinc-500'
            : 'text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {event.title}
      </p>

      {/* Labels */}
      {props.labels && props.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {props.labels.slice(0, 3).map(lbl => (
            <span
              key={lbl.id}
              className="px-1.5 py-0.5 rounded text-[9px] font-extrabold text-white truncate max-w-[90px]"
              style={{ backgroundColor: lbl.color || '#6C5DD3' }}
            >
              {lbl.name || 'Etiqueta'}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Priority, Status & Assignees */}
      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${priorityInfo.badgeClass}`}
          >
            {props.priority || 'P2'}
          </span>

          {props.blocked && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500" title={props.blockedReason || 'Bloqueada'}>
              <Lock size={11} />
            </span>
          )}

          {overdue && !done && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-500" title="Vencida">
              <AlertCircle size={11} />
            </span>
          )}

          {hasChecklist && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
              <CheckSquare size={10} />
              {props.checklistCompleted}/{props.checklistTotal}
            </span>
          )}

          {(props.commentsCount || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-400">
              <MessageSquare size={10} />
              {props.commentsCount}
            </span>
          )}

          {(props.attachmentsCount || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-400">
              <Paperclip size={10} />
              {props.attachmentsCount}
            </span>
          )}
        </div>

        {props.assignees && props.assignees.length > 0 && (
          <div className="flex items-center -space-x-1 shrink-0">
            {props.assignees.slice(0, 3).map(member => (
              <img
                key={member.id}
                src={getAvatarUrl(member)}
                alt={member.name}
                title={member.name}
                className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-[#1E222B] object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DroppableWeekColumnProps {
  day: Date;
  singleDayEvents: CalendarCardEvent[];
  colorBy: CalendarColorBy;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onToggleDone: (event: CalendarCardEvent, e: React.MouseEvent) => void;
  onDropUnscheduledCard?: (cardId: string, targetDate: Date) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

const DroppableWeekColumn: React.FC<DroppableWeekColumnProps> = ({
  day,
  singleDayEvents,
  colorBy,
  onSelectEvent,
  onToggleDone,
  onDropUnscheduledCard,
  onOpenQuickMenu,
}) => {
  const dayKey = getDayKey(day);
  const { isOver, setNodeRef } = useDroppable({
    id: `week-day:${dayKey}`,
    data: { day },
  });

  const today = isToday(day);
  const weekend = isWeekend(day);

  return (
    <div
      ref={setNodeRef}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('application/lumins-calendar-card')) {
          e.preventDefault();
        }
      }}
      onDrop={e => {
        const cardId = e.dataTransfer.getData('application/lumins-calendar-card');
        if (cardId && onDropUnscheduledCard) {
          e.preventDefault();
          onDropUnscheduledCard(cardId, day);
        }
      }}
      className={`flex flex-col min-h-0 h-full border-r border-zinc-200/70 dark:border-white/[0.06] last:border-r-0 transition-colors ${
        today
          ? 'bg-[#6C5DD3]/[0.04] dark:bg-[#6C5DD3]/[0.08]'
          : weekend
          ? 'bg-zinc-50/60 dark:bg-white/[0.015]'
          : 'bg-white dark:bg-[#181B22]'
      } ${isOver ? 'ring-2 ring-inset ring-[#6C5DD3] bg-[#6C5DD3]/10' : ''}`}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {singleDayEvents.length === 0 ? (
          <div className="h-full min-h-[120px] flex items-center justify-center">
            <span className="text-[11px] font-semibold text-zinc-300 dark:text-zinc-600 select-none">
              Sin tareas
            </span>
          </div>
        ) : (
          singleDayEvents.map(ev => (
            <DraggableWeekCard
              key={ev.id}
              event={ev}
              colorBy={colorBy}
              onSelectEvent={onSelectEvent}
              onToggleDone={onToggleDone}
              onOpenQuickMenu={onOpenQuickMenu}
            />
          ))
        )}
      </div>
    </div>
  );
};

const LuminsCalendarWeekView: React.FC<LuminsCalendarWeekViewProps> = ({
  currentDate,
  events,
  colorBy,
  hideWeekends,
  onSelectEvent,
  onRescheduleEvent,
  onToggleDone,
  onOpenQuickCreate,
  onDropUnscheduledCard,
  onOpenQuickMenu,
}) => {
  const [activeDragEvent, setActiveDragEvent] = useState<CalendarCardEvent | null>(null);
  const mobileDayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mobileScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const weekDays = useMemo(
    () => buildWeekDays(currentDate, hideWeekends),
    [currentDate, hideWeekends]
  );

  // Selected day for mobile top strip (defaults to Today if in current week, else first day of week)
  const [selectedMobileDayKey, setSelectedMobileDayKey] = useState<string>(() => {
    const todayMatch = weekDays.find(d => isToday(d));
    return getDayKey(todayMatch || weekDays[0] || currentDate);
  });

  useEffect(() => {
    const todayMatch = weekDays.find(d => isToday(d));
    const targetDay = todayMatch || weekDays[0];
    if (targetDay) {
      const key = getDayKey(targetDay);
      setSelectedMobileDayKey(key);
    }
  }, [weekDays]);

  const colsCount = weekDays.length;

  // Separate multi-day events from single-day events (for desktop) + build full per-day list (for mobile)
  const { multiDayEvents, singleDayEventsByKey, allDayEventsByKey } = useMemo(() => {
    const multi: CalendarCardEvent[] = [];
    const singleMap = new Map<string, CalendarCardEvent[]>();
    const allMap = new Map<string, CalendarCardEvent[]>();

    for (const d of weekDays) {
      const k = getDayKey(d);
      singleMap.set(k, []);
      allMap.set(k, []);
    }

    for (const ev of events) {
      const { start, end, isMultiDay } = getEventDateRange(ev);
      if (isMultiDay) {
        multi.push(ev);
      } else {
        for (const d of weekDays) {
          if (isSameDay(d, start) || isSameDay(d, end)) {
            singleMap.get(getDayKey(d))?.push(ev);
          }
        }
      }

      // Populate allDayEventsByKey (includes both multi-day spanning that day and single-day)
      for (const d of weekDays) {
        if (
          isWithinInterval(d, {
            start: startOfDay(start),
            end: endOfDay(end),
          })
        ) {
          allMap.get(getDayKey(d))?.push(ev);
        }
      }
    }

    return {
      multiDayEvents: multi,
      singleDayEventsByKey: singleMap,
      allDayEventsByKey: allMap,
    };
  }, [events, weekDays]);

  const multiDaySegmentation = useMemo(
    () => segmentEventsForWeek(multiDayEvents, weekDays),
    [multiDayEvents, weekDays]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const ev = e.active.data.current?.event as CalendarCardEvent | undefined;
    if (ev) setActiveDragEvent(ev);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragEvent(null);
    const ev = e.active.data.current?.event as CalendarCardEvent | undefined;
    const targetDay = e.over?.data.current?.day as Date | undefined;
    if (ev && targetDay) {
      onRescheduleEvent(ev, targetDay);
    }
  };

  const handleMobileDayJump = (day: Date) => {
    const key = getDayKey(day);
    setSelectedMobileDayKey(key);
    const el = mobileDayRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#181B22] rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-xs">
        {/* =========================================================
            MOBILE VIEW (< md): Sticky 7-Day Strip + Vertical Week Stack
           ========================================================= */}
        <div className="flex md:hidden flex-1 min-h-0 flex-col overflow-hidden">
          {/* 1. Sticky 7-Day Week Strip */}
          <div
            className="grid border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/90 dark:bg-[#15181F] px-1.5 py-2 shrink-0 gap-1"
            style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
          >
            {weekDays.map(day => {
              const key = getDayKey(day);
              const today = isToday(day);
              const isSelected = selectedMobileDayKey === key;
              const dayEvents = allDayEventsByKey.get(key) || [];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleMobileDayJump(day)}
                  className={`flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#6C5DD3] text-white shadow-sm shadow-[#6C5DD3]/25'
                      : today
                      ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#9E8CFC]'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-tight leading-none ${
                      isSelected
                        ? 'text-white/85'
                        : today
                        ? 'text-[#6C5DD3] dark:text-[#9E8CFC]'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {format(day, 'EEEEE', { locale: es })}
                  </span>
                  <span className="text-xs font-black mt-1 leading-none">
                    {format(day, 'd')}
                  </span>

                  {/* Task Dots / Counter */}
                  <div className="flex items-center justify-center gap-0.5 mt-1.5 h-2">
                    {dayEvents.length === 0 ? (
                      <span className="w-1 h-1 rounded-full bg-transparent" />
                    ) : (
                      dayEvents.slice(0, 3).map(ev => {
                        const c = isSelected
                          ? '#FFFFFF'
                          : isCardCompleted(ev)
                          ? '#10B981'
                          : isEventOverdue(ev)
                          ? '#EF4444'
                          : getEventAccentColor(ev, colorBy);
                        return (
                          <span
                            key={ev.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        );
                      })
                    )}
                    {dayEvents.length > 3 && (
                      <span
                        className={`text-[8px] font-black leading-none ${
                          isSelected ? 'text-white/90' : 'text-zinc-400'
                        }`}
                      >
                        +
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. Vertical Stacked 7-Day Feed */}
          <div
            ref={mobileScrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-zinc-100 dark:divide-white/[0.06]"
          >
            {weekDays.map(day => {
              const key = getDayKey(day);
              const today = isToday(day);
              const isSelected = selectedMobileDayKey === key;
              const dayEvents = allDayEventsByKey.get(key) || [];

              return (
                <div
                  key={key}
                  ref={el => {
                    mobileDayRefs.current[key] = el;
                  }}
                  onClick={() => setSelectedMobileDayKey(key)}
                  className={`transition-colors ${
                    today
                      ? 'bg-[#6C5DD3]/[0.03] dark:bg-[#6C5DD3]/[0.06]'
                      : isSelected
                      ? 'bg-zinc-50/70 dark:bg-white/[0.015]'
                      : ''
                  }`}
                >
                  {/* Day Section Header */}
                  <div className="sticky top-0 z-10 px-3.5 py-2.5 bg-white/95 dark:bg-[#181B22]/95 backdrop-blur-xs flex items-center justify-between border-b border-zinc-100/80 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                          today
                            ? 'bg-[#6C5DD3] text-white shadow-xs shadow-[#6C5DD3]/30'
                            : isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            : 'bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-extrabold capitalize text-zinc-900 dark:text-zinc-100 truncate">
                          {format(day, 'EEEE', { locale: es })}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-400 capitalize shrink-0">
                          {format(day, 'd MMM', { locale: es })}
                        </span>
                        {today && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#6C5DD3]/15 text-[#6C5DD3] dark:text-[#9E8CFC] shrink-0">
                            Hoy
                          </span>
                        )}
                      </div>
                    </div>

                    {dayEvents.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 shrink-0">
                        {dayEvents.length} {dayEvents.length === 1 ? 'tarea' : 'tareas'}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600 shrink-0">
                        Sin tareas
                      </span>
                    )}
                  </div>

                  {/* Day Tasks List (only takes extra vertical space when there are tasks) */}
                  {dayEvents.length > 0 && (
                    <div className="p-3 space-y-2">
                      {dayEvents.map(ev => {
                        const { start, end, isMultiDay } = getEventDateRange(ev);
                        return (
                          <div key={`${key}:${ev.id}`} className="space-y-1">
                            {isMultiDay && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-[#6C5DD3] dark:text-[#9E8CFC] px-1">
                                <CalendarRange size={11} />
                                <span>
                                  Varios días: {format(start, 'd MMM', { locale: es })} –{' '}
                                  {format(end, 'd MMM', { locale: es })}
                                </span>
                              </div>
                            )}
                            <DraggableWeekCard
                              event={ev}
                              colorBy={colorBy}
                              onSelectEvent={onSelectEvent}
                              onToggleDone={onToggleDone}
                              onOpenQuickMenu={onOpenQuickMenu}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            DESKTOP / TABLET LANDSCAPE VIEW (md+): 7-Column Grid
           ========================================================= */}
        <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
          {/* 1. Day Column Headers */}
          <div
            className="grid border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#15181F] shrink-0"
            style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
          >
            {weekDays.map(day => {
              const key = getDayKey(day);
              const today = isToday(day);
              const singleCount = singleDayEventsByKey.get(key)?.length || 0;
              const multiCount = multiDaySegmentation.eventsByDayKey.get(key)?.length || 0;
              const totalCount = singleCount + multiCount;

              return (
                <div
                  key={key}
                  className={`group/header px-2 lg:px-3 py-2.5 border-r border-zinc-200/60 dark:border-white/[0.05] last:border-r-0 flex items-center justify-between gap-1 min-w-0 ${
                    today ? 'bg-[#6C5DD3]/[0.06] dark:bg-[#6C5DD3]/[0.12]' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                    <span
                      style={{ borderRadius: '9999px' }}
                      className={`w-6 h-6 lg:w-7 lg:h-7 text-xs font-black flex items-center justify-center shrink-0 ${
                        today
                          ? 'bg-[#6C5DD3] text-white shadow-sm shadow-[#6C5DD3]/30'
                          : 'bg-zinc-200/70 dark:bg-white/10 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 truncate">
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 capitalize truncate">
                        {format(day, 'MMM', { locale: es })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {totalCount > 0 && (
                      <span className="px-1.5 lg:px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-200/70 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                        {totalCount}
                      </span>
                    )}
                    {onOpenQuickCreate && (
                      <button
                        type="button"
                        onClick={() => onOpenQuickCreate(day, day)}
                        title="Crear tarea en este día"
                        className="opacity-0 group-hover/header:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-[#6C5DD3] hover:bg-[#6C5DD3]/12 transition-all"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Top Spanning Section for Multi-day Tasks */}
          {multiDaySegmentation.segments.length > 0 && (
            <div className="border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/40 dark:bg-[#14171E] px-1 py-2 shrink-0 max-h-36 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 mb-1">
                Tareas de varios días ({multiDaySegmentation.segments.length})
              </div>
              <div
                className="grid gap-y-1.5"
                style={{
                  gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
                }}
              >
                {multiDaySegmentation.segments.map(seg => {
                  const { event, startCol, span, laneIndex, isStart, isEnd, durationDays } = seg;
                  const done = isCardCompleted(event);
                  const overdue = isEventOverdue(event);
                  const color = getEventAccentColor(event, colorBy);

                  return (
                    <div
                      key={`multi:${event.id}:${laneIndex}`}
                      onClick={() => onSelectEvent(event)}
                      onContextMenu={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenQuickMenu?.(event, { x: e.clientX, y: e.clientY });
                      }}
                      style={{
                        gridColumn: `${startCol + 1} / span ${span}`,
                        gridRow: laneIndex + 1,
                        backgroundColor: done ? 'rgba(16,185,129,0.12)' : `${color}1F`,
                        borderColor: done ? '#10B981' : `${color}66`,
                        borderLeftWidth: isStart ? '4px' : '1px',
                        borderLeftColor: done ? '#10B981' : overdue ? '#EF4444' : color,
                      }}
                      className={`h-7 flex items-center justify-between gap-2 px-2.5 text-xs font-bold border cursor-pointer transition-all hover:brightness-95 ${
                        isStart ? 'rounded-l-lg ml-1' : 'ml-0'
                      } ${isEnd ? 'rounded-r-lg mr-1' : 'mr-0'}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!isStart && <ChevronLeft size={12} className="shrink-0 opacity-60" />}
                        {done ? (
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <span
                          className={`truncate ${
                            done ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {event.title}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                          · {durationDays}d
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                          {event.extendedProps.boardName}
                        </span>
                        {event.extendedProps.assignees?.[0] && (
                          <img
                            src={getAvatarUrl(event.extendedProps.assignees[0])}
                            alt={event.extendedProps.assignees[0].name}
                            style={{ borderRadius: '9999px' }}
                            className="w-5 h-5 object-cover"
                          />
                        )}
                        {!isEnd && <ChevronRight size={12} className="shrink-0 opacity-60" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Main Day Columns (Expanded Cards) */}
          <div
            className="flex-1 min-h-0 grid w-full overflow-hidden"
            style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
          >
            {weekDays.map(day => {
              const key = getDayKey(day);
              const singleEvents = singleDayEventsByKey.get(key) || [];
              return (
                <DroppableWeekColumn
                  key={key}
                  day={day}
                  singleDayEvents={singleEvents}
                  colorBy={colorBy}
                  onSelectEvent={onSelectEvent}
                  onToggleDone={onToggleDone}
                  onDropUnscheduledCard={onDropUnscheduledCard}
                  onOpenQuickMenu={onOpenQuickMenu}
                />
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragEvent && (
          <div
            className="px-3 py-2 rounded-lg shadow-xl text-xs font-bold text-white flex items-center gap-2 pointer-events-none"
            style={{ backgroundColor: getEventAccentColor(activeDragEvent, colorBy) }}
          >
            <CalendarIcon size={13} />
            <span className="truncate max-w-[220px]">{activeDragEvent.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default LuminsCalendarWeekView;

