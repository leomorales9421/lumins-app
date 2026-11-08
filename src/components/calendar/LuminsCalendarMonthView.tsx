import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  isSameMonth,
  isSameDay,
  isToday,
  isWeekend,
  isBefore,
  isAfter,
  addDays,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Flame,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type CalendarCardEvent,
  type CalendarColorBy,
  type WeekEventSegment,
  buildMonthWeeks,
  getDayKey,
  getEventAccentColor,
  getEventDateRange,
  isCardCompleted,
  isEventOverdue,
  segmentEventsForWeek,
  PRIORITY_COLORS,
} from '../../lib/calendar-utils';
import CalendarCardPreviewPopover, { getAvatarUrl } from './CalendarCardPreviewPopover';

interface LuminsCalendarMonthViewProps {
  currentDate: Date;
  events: CalendarCardEvent[];
  colorBy: CalendarColorBy;
  hideWeekends: boolean;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onRescheduleEvent: (event: CalendarCardEvent, targetDate: Date) => void;
  onToggleDone: (event: CalendarCardEvent, e: React.MouseEvent) => void;
  onOpenQuickCreate?: (startDate: Date, dueDate?: Date) => void;
  onResizeEventDates?: (event: CalendarCardEvent, newStart: Date, newEnd: Date) => void;
  onDropUnscheduledCard?: (cardId: string, targetDate: Date) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

interface DroppableDayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  isInRangeSelection: boolean;
  hiddenCount: number;
  dayEvents: CalendarCardEvent[];
  onOpenOverflow: (day: Date, events: CalendarCardEvent[], rect: DOMRect) => void;
  onOpenQuickCreate?: (startDate: Date, dueDate?: Date) => void;
  onDropUnscheduledCard?: (cardId: string, targetDate: Date) => void;
  onRangeSelectStart: (day: Date) => void;
  onRangeSelectEnter: (day: Date) => void;
}

const DroppableDayCell: React.FC<DroppableDayCellProps> = ({
  day,
  isCurrentMonth,
  isInRangeSelection,
  hiddenCount,
  dayEvents,
  onOpenOverflow,
  onOpenQuickCreate,
  onDropUnscheduledCard,
  onRangeSelectStart,
  onRangeSelectEnter,
}) => {
  const dayKey = getDayKey(day);
  const { isOver, setNodeRef } = useDroppable({
    id: `day:${dayKey}`,
    data: { day },
  });

  const today = isToday(day);
  const weekend = isWeekend(day);

  return (
    <div
      ref={setNodeRef}
      onMouseDown={e => {
        if (e.button === 0 && e.target === e.currentTarget) {
          onRangeSelectStart(day);
        }
      }}
      onMouseEnter={() => onRangeSelectEnter(day)}
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
      className={`group/cell relative h-full flex flex-col justify-between p-1.5 border-r border-b border-zinc-200/70 dark:border-white/[0.06] last:border-r-0 transition-colors select-none ${
        isInRangeSelection
          ? 'bg-[#6C5DD3]/15 dark:bg-[#6C5DD3]/25 ring-1 ring-inset ring-[#6C5DD3]'
          : today
          ? 'bg-[#6C5DD3]/[0.05] dark:bg-[#6C5DD3]/[0.11]'
          : weekend
          ? 'bg-zinc-50/75 dark:bg-white/[0.015]'
          : 'bg-white dark:bg-[#181B22]'
      } ${!isCurrentMonth ? 'opacity-45 bg-zinc-50/50 dark:bg-[#13151A]/60' : ''} ${
        isOver ? 'ring-2 ring-inset ring-[#6C5DD3] bg-[#6C5DD3]/10 dark:bg-[#6C5DD3]/20 z-10' : ''
      }`}
    >
      {/* Top row: Day number & Quick Create + button */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1 pointer-events-none">
          <span
            style={{ borderRadius: '9999px' }}
            className={`inline-flex items-center justify-center text-xs font-extrabold leading-none transition-all ${
              today
                ? 'w-6 h-6 bg-[#6C5DD3] text-white shadow-sm shadow-[#6C5DD3]/40'
                : 'w-6 h-6 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {format(day, 'd')}
          </span>

          {day.getDate() === 1 && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {format(day, 'MMM', { locale: es })}
            </span>
          )}
        </div>

        {onOpenQuickCreate && (
          <button
            type="button"
            title="Crear tarea en este día"
            onClick={e => {
              e.stopPropagation();
              onOpenQuickCreate(day, day);
            }}
            className="opacity-0 group-hover/cell:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-[#6C5DD3] hover:bg-[#6C5DD3]/12 transition-all z-20"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Bottom row: +N more pill */}
      {hiddenCount > 0 && (
        <div className="mt-auto pt-0.5 flex justify-start z-20">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onOpenOverflow(day, dayEvents, rect);
            }}
            className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#6C5DD3]/10 hover:bg-[#6C5DD3]/20 text-[#6C5DD3] dark:text-[#A599F9] transition-colors cursor-pointer"
          >
            +{hiddenCount} más
          </button>
        </div>
      )}
    </div>
  );
};

interface DraggableSegmentBarProps {
  segment: WeekEventSegment;
  colorBy: CalendarColorBy;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onHoverStart: (event: CalendarCardEvent, rect: DOMRect) => void;
  onHoverEnd: () => void;
  onStartEdgeResize?: (
    e: React.PointerEvent,
    event: CalendarCardEvent,
    edge: 'start' | 'end'
  ) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

const DraggableSegmentBar: React.FC<DraggableSegmentBarProps> = ({
  segment,
  colorBy,
  onSelectEvent,
  onHoverStart,
  onHoverEnd,
  onStartEdgeResize,
  onOpenQuickMenu,
}) => {
  const { event, startCol, span, laneIndex, isStart, isEnd, isMultiDay } = segment;
  const props = event.extendedProps;
  const canEdit = props.canEdit !== false;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `seg:${event.id}:${laneIndex}:${startCol}`,
    data: { event },
    disabled: !canEdit,
  });

  const isDone = isCardCompleted(event);
  const isOverdue = isEventOverdue(event);
  const accentColor = getEventAccentColor(event, colorBy);
  const isP0 = props.priority === 'P0';
  const hasChecklist = (props.checklistTotal || 0) > 0;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={e => {
        e.stopPropagation();
        onSelectEvent(event);
      }}
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        onHoverEnd();
        onOpenQuickMenu?.(event, { x: e.clientX, y: e.clientY });
      }}
      onMouseEnter={e => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onHoverStart(event, rect);
      }}
      onMouseLeave={onHoverEnd}
      className={`relative pointer-events-auto h-[22px] flex items-center justify-between gap-1.5 px-1.5 text-[11px] font-bold transition-all select-none group overflow-hidden ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? 'opacity-35 scale-[0.98]' : 'hover:brightness-95 dark:hover:brightness-110'} ${
        isStart ? 'rounded-l-md ml-1' : 'rounded-l-none ml-0 border-l-0'
      } ${isEnd ? 'rounded-r-md mr-1' : 'rounded-r-none mr-0 border-r-0'} ${
        isDone
          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-zinc-400 dark:text-zinc-400 border border-emerald-500/30'
          : isOverdue
          ? 'bg-rose-500/12 dark:bg-rose-500/20 text-rose-900 dark:text-rose-200 border border-rose-500/40'
          : isMultiDay
          ? 'text-zinc-900 dark:text-zinc-100 border'
          : 'bg-white dark:bg-[#222631] text-zinc-800 dark:text-zinc-100 border border-zinc-200/90 dark:border-white/10 shadow-2xs'
      }`}
      style={{
        gridColumn: `${startCol + 1} / span ${span}`,
        gridRow: laneIndex + 1,
        ...(isStart
          ? { borderLeftWidth: '3.5px', borderLeftColor: isDone ? '#10B981' : isOverdue ? '#EF4444' : accentColor }
          : {}),
        ...(isMultiDay && !isDone && !isOverdue
          ? {
              backgroundColor: `${accentColor}1A`,
              borderColor: `${accentColor}4D`,
            }
          : {}),
      }}
    >
      {/* Left Resize Handle (Requirement 2.3) */}
      {canEdit && isStart && onStartEdgeResize && (
        <div
          onPointerDown={e => onStartEdgeResize(e, event, 'start')}
          title="Arrastrar para cambiar fecha de inicio"
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/15 dark:bg-white/25 z-20"
        />
      )}

      <div className="flex items-center gap-1 min-w-0 flex-1">
        {!isStart && (
          <ChevronLeft size={10} className="shrink-0 opacity-60" />
        )}
        {isDone ? (
          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
        ) : props.blocked ? (
          <Lock size={11} className="text-amber-500 shrink-0" />
        ) : isOverdue ? (
          <AlertCircle size={11} className="text-rose-500 shrink-0" />
        ) : isP0 ? (
          <Flame size={11} className="text-rose-500 shrink-0" />
        ) : (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
        )}

        <span className={`truncate leading-none ${isDone ? 'line-through opacity-75' : ''}`}>
          {event.title}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasChecklist && span > 1 && (
          <span className="hidden lg:inline-flex items-center gap-0.5 text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/10 px-1 rounded">
            <CheckSquare size={9} />
            {props.checklistCompleted}/{props.checklistTotal}
          </span>
        )}

        {props.assignees?.[0] && (
          <img
            src={getAvatarUrl(props.assignees[0])}
            alt={props.assignees[0].name}
            style={{ borderRadius: '9999px' }}
            className="w-4 h-4 ring-1 ring-white dark:ring-[#181B22] object-cover shrink-0"
          />
        )}

        {!isEnd && (
          <ChevronRight size={10} className="shrink-0 opacity-60" />
        )}
      </div>

      {/* Right Resize Handle (Requirement 2.3) */}
      {canEdit && isEnd && onStartEdgeResize && (
        <div
          onPointerDown={e => onStartEdgeResize(e, event, 'end')}
          title="Arrastrar para cambiar fecha de entrega"
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/15 dark:bg-white/25 z-20"
        />
      )}
    </div>
  );
};

const LuminsCalendarMonthView: React.FC<LuminsCalendarMonthViewProps> = ({
  currentDate,
  events,
  colorBy,
  hideWeekends,
  onSelectEvent,
  onRescheduleEvent,
  onToggleDone,
  onOpenQuickCreate,
  onResizeEventDates,
  onDropUnscheduledCard,
  onOpenQuickMenu,
}) => {
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<number | null>(null);

  const [rowHeight, setRowHeight] = useState<number>(130);
  const [activeDragEvent, setActiveDragEvent] = useState<CalendarCardEvent | null>(null);
  const [rangeAnchorDay, setRangeAnchorDay] = useState<Date | null>(null);
  const [rangeCurrentDay, setRangeCurrentDay] = useState<Date | null>(null);
  const [hoverPreview, setHoverPreview] = useState<{
    event: CalendarCardEvent;
    x: number;
    top?: number;
    bottom?: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const [overflowPopover, setOverflowPopover] = useState<{
    day: Date;
    events: CalendarCardEvent[];
    x: number;
    y: number;
  } | null>(null);
  const [mobileSelectedDay, setMobileSelectedDay] = useState<Date | null>(null);

  const weeks = useMemo(
    () => buildMonthWeeks(currentDate, hideWeekends),
    [currentDate, hideWeekends]
  );

  const colsCount = hideWeekends ? 5 : 7;

  const weekDataList = useMemo(
    () => weeks.map(weekDays => ({ weekDays, ...segmentEventsForWeek(events, weekDays) })),
    [weeks, events]
  );

  // Measure actual available height per week row so we fit as many lanes as physically fit without scroll
  useEffect(() => {
    const el = gridBodyRef.current;
    if (!el) return;

    const updateSize = () => {
      const totalH = el.clientHeight;
      if (totalH > 0 && weeks.length > 0) {
        setRowHeight(Math.floor(totalH / weeks.length));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [weeks.length]);

  // Global mouseup for multi-day empty range selection (Requirement 2.2)
  useEffect(() => {
    if (!rangeAnchorDay) return;
    const handleUp = () => {
      if (rangeAnchorDay && rangeCurrentDay && !isSameDay(rangeAnchorDay, rangeCurrentDay)) {
        const s = isBefore(rangeAnchorDay, rangeCurrentDay) ? rangeAnchorDay : rangeCurrentDay;
        const e = isAfter(rangeAnchorDay, rangeCurrentDay) ? rangeAnchorDay : rangeCurrentDay;
        onOpenQuickCreate?.(s, e);
      }
      setRangeAnchorDay(null);
      setRangeCurrentDay(null);
    };
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [rangeAnchorDay, rangeCurrentDay, onOpenQuickCreate]);

  const isDayInSelectedRange = (day: Date): boolean => {
    if (!rangeAnchorDay || !rangeCurrentDay) return false;
    const s = startOfDay(isBefore(rangeAnchorDay, rangeCurrentDay) ? rangeAnchorDay : rangeCurrentDay);
    const e = startOfDay(isAfter(rangeAnchorDay, rangeCurrentDay) ? rangeAnchorDay : rangeCurrentDay);
    const d = startOfDay(day);
    return !isBefore(d, s) && !isAfter(d, e);
  };

  // Edge resize handler for Month view bars (Requirement 2.3)
  const handleStartEdgeResize = (
    e: React.PointerEvent,
    event: CalendarCardEvent,
    edge: 'start' | 'end'
  ) => {
    if (!onResizeEventDates) return;
    e.stopPropagation();
    e.preventDefault();
    handleHoverEnd();

    const gridEl = gridBodyRef.current;
    const colWidth = gridEl ? gridEl.clientWidth / colsCount : 140;
    const originX = e.clientX;
    const { start, end } = getEventDateRange(event);

    const handleUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointerup', handleUp);
      const dx = upEvt.clientX - originX;
      const deltaDays = Math.round(dx / Math.max(40, colWidth));
      if (deltaDays === 0) return;

      let nextStart = start;
      let nextEnd = end;
      if (edge === 'start') {
        nextStart = addDays(start, deltaDays);
        if (isAfter(nextStart, nextEnd)) nextStart = nextEnd;
      } else {
        nextEnd = addDays(end, deltaDays);
        if (isBefore(nextEnd, nextStart)) nextEnd = nextStart;
      }
      onResizeEventDates(event, nextStart, nextEnd);
    };

    window.addEventListener('pointerup', handleUp);
  };

  // 28px top day number header + 20px bottom "+N more" reserve; each lane is 24px (22px + 2px gap)
  const maxVisibleLanes = useMemo(() => {
    const availableForLanes = rowHeight - 46;
    return Math.max(1, Math.min(6, Math.floor(availableForLanes / 24)));
  }, [rowHeight]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setHoverPreview(null);
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

  const handleHoverStart = (event: CalendarCardEvent, rect: DOMRect) => {
    if (activeDragEvent) return;
    if (leaveTimeoutRef.current) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = window.setTimeout(() => {
      const popoverW = 320;
      let x = rect.left;

      // Keep within horizontal screen bounds
      if (x + popoverW > window.innerWidth - 16) {
        x = Math.max(16, window.innerWidth - popoverW - 16);
      }

      // Check vertical space: popover height is ~300-340px
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedPopoverHeight = 330;

      // Always place above if space below is tighter than estimated height or if card is in the lower half
      const placement: 'top' | 'bottom' =
        spaceBelow < estimatedPopoverHeight || (rect.top > window.innerHeight * 0.55 && spaceAbove >= 200)
          ? 'top'
          : 'bottom';

      if (placement === 'top') {
        // Anchor the bottom of the popover directly 4px above the card
        const bottom = Math.max(16, window.innerHeight - rect.top + 4);
        setHoverPreview({ event, x, bottom, placement });
      } else {
        // Anchor the top of the popover directly 4px below the card, clamped to screen height
        const top = Math.min(window.innerHeight - estimatedPopoverHeight - 16, rect.bottom + 4);
        setHoverPreview({ event, x, top, placement });
      }
    }, 120);
  };

  const handleHoverEnd = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (leaveTimeoutRef.current) {
      window.clearTimeout(leaveTimeoutRef.current);
    }
    // 220ms grace period so moving the cursor from card to popover never drops the popover
    leaveTimeoutRef.current = window.setTimeout(() => {
      setHoverPreview(null);
    }, 220);
  };

  const handleOpenOverflow = (day: Date, dayEvents: CalendarCardEvent[], rect: DOMRect) => {
    setHoverPreview(null);
    const popoverW = 310;
    const popoverH = 320;
    let x = rect.left;
    let y = rect.bottom + 4;
    if (x + popoverW > window.innerWidth - 16) {
      x = Math.max(16, window.innerWidth - popoverW - 16);
    }
    if (y + popoverH > window.innerHeight - 16) {
      y = Math.max(16, rect.top - popoverH - 4);
    }
    setOverflowPopover({ day, events: dayEvents, x, y });
  };

  const weekdayHeaders = useMemo(() => {
    const base = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return hideWeekends ? base.slice(0, 5) : base;
  }, [hideWeekends]);

  const mobileDayEvents = useMemo(() => {
    if (!mobileSelectedDay) return [];
    const key = getDayKey(mobileSelectedDay);
    for (const wd of weekDataList) {
      const list = wd.eventsByDayKey.get(key);
      if (list) return list;
    }
    return [];
  }, [mobileSelectedDay, weekDataList]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#181B22] rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-xs relative">
      {/* Weekday Header Row */}
      <div
        className="grid border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#15181F] shrink-0"
        style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
      >
        {weekdayHeaders.map((label, idx) => (
          <div
            key={label}
            className={`py-2 text-center text-[11px] font-extrabold uppercase tracking-wider border-r border-zinc-200/50 dark:border-white/[0.04] last:border-r-0 ${
              idx >= 5
                ? 'text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* DESKTOP FULL-HEIGHT GRID (>= md) */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={gridBodyRef}
          className="hidden md:grid flex-1 min-h-0 w-full overflow-hidden"
          style={{
            gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))`,
          }}
        >
          {weekDataList.map((weekData, weekIdx) => {
            const { weekDays, segments, eventsByDayKey } = weekData;
            const visibleSegments = segments.filter(s => s.laneIndex < maxVisibleLanes);

            return (
              <div key={weekIdx} className="relative min-h-0 w-full h-full overflow-hidden">
                {/* 1. Background Droppable Day Cells */}
                <div
                  className="grid h-full w-full"
                  style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
                >
                  {weekDays.map(day => {
                    const key = getDayKey(day);
                    const allDayEvents = eventsByDayKey.get(key) || [];
                    // Count how many segments covering this column are hidden
                    const colIdx = weekDays.findIndex(d => isSameDay(d, day));
                    const hiddenInCol = segments.filter(
                      s =>
                        s.laneIndex >= maxVisibleLanes &&
                        colIdx >= s.startCol &&
                        colIdx <= s.endCol
                    ).length;

                    return (
                      <DroppableDayCell
                        key={key}
                        day={day}
                        isCurrentMonth={isSameMonth(day, currentDate)}
                        isInRangeSelection={isDayInSelectedRange(day)}
                        hiddenCount={hiddenInCol}
                        dayEvents={allDayEvents}
                        onOpenOverflow={handleOpenOverflow}
                        onOpenQuickCreate={onOpenQuickCreate}
                        onDropUnscheduledCard={onDropUnscheduledCard}
                        onRangeSelectStart={d => {
                          setRangeAnchorDay(d);
                          setRangeCurrentDay(d);
                        }}
                        onRangeSelectEnter={d => {
                          if (rangeAnchorDay) setRangeCurrentDay(d);
                        }}
                      />
                    );
                  })}
                </div>

                {/* 2. Foreground Continuous Event Lanes */}
                <div
                  className="absolute inset-x-0 top-7 bottom-5 pointer-events-none grid gap-y-[2px] content-start"
                  style={{
                    gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
                    gridAutoRows: '22px',
                  }}
                >
                  {visibleSegments.map(seg => (
                    <DraggableSegmentBar
                      key={`${seg.event.id}:${seg.laneIndex}:${seg.startCol}`}
                      segment={seg}
                      colorBy={colorBy}
                      onSelectEvent={onSelectEvent}
                      onHoverStart={handleHoverStart}
                      onHoverEnd={handleHoverEnd}
                      onStartEdgeResize={handleStartEdgeResize}
                      onOpenQuickMenu={onOpenQuickMenu}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragEvent && (
            <div
              className="px-2.5 py-1 rounded-md shadow-xl text-xs font-bold text-white flex items-center gap-2 pointer-events-none"
              style={{
                backgroundColor: getEventAccentColor(activeDragEvent, colorBy),
              }}
            >
              <CalendarIcon size={12} />
              <span className="truncate max-w-[200px]">{activeDragEvent.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* MOBILE DOT-MATRIX MONTH GRID (< md) (Requirement 1.20) */}
      <div
        className="grid md:hidden flex-1 min-h-0 w-full"
        style={{
          gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))`,
        }}
      >
        {weekDataList.map((weekData, weekIdx) => (
          <div
            key={weekIdx}
            className="grid h-full w-full"
            style={{ gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))` }}
          >
            {weekData.weekDays.map(day => {
              const key = getDayKey(day);
              const dayEvents = weekData.eventsByDayKey.get(key) || [];
              const today = isToday(day);
              const selected = mobileSelectedDay && isSameDay(day, mobileSelectedDay);
              const inMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMobileSelectedDay(day)}
                  className={`flex flex-col items-center justify-between p-1.5 border-r border-b border-zinc-200/70 dark:border-white/[0.06] last:border-r-0 transition-colors ${
                    selected
                      ? 'bg-[#6C5DD3]/15 dark:bg-[#6C5DD3]/25'
                      : today
                      ? 'bg-[#6C5DD3]/[0.05]'
                      : 'bg-white dark:bg-[#181B22]'
                  } ${!inMonth ? 'opacity-40' : ''}`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                      today
                        ? 'bg-[#6C5DD3] text-white'
                        : selected
                        ? 'text-[#6C5DD3] dark:text-[#A599F9] font-black'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {/* Colored dots instead of unreadable 9px text */}
                  <div className="flex items-center justify-center gap-1 flex-wrap max-w-full pb-1">
                    {dayEvents.slice(0, 4).map(ev => (
                      <span
                        key={ev.id}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isCardCompleted(ev)
                            ? '#10B981'
                            : isEventOverdue(ev)
                            ? '#EF4444'
                            : getEventAccentColor(ev, colorBy),
                        }}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] font-black text-[#6C5DD3] leading-none">
                        +{dayEvents.length - 4}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hover Preview Popover (Desktop) */}
      <AnimatePresence>
        {hoverPreview && !overflowPopover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              left: hoverPreview.x,
              top: hoverPreview.placement === 'bottom' ? hoverPreview.top : undefined,
              bottom: hoverPreview.placement === 'top' ? hoverPreview.bottom : undefined,
              zIndex: 130,
            }}
            className={`cursor-default ${
              hoverPreview.placement === 'top' ? 'pb-2.5 -mb-2.5' : 'pt-2.5 -mt-2.5'
            }`}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
              if (leaveTimeoutRef.current) {
                window.clearTimeout(leaveTimeoutRef.current);
                leaveTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleHoverEnd}
          >
            <CalendarCardPreviewPopover
              event={hoverPreview.event}
              colorBy={colorBy}
              onOpenDetail={ev => {
                setHoverPreview(null);
                onSelectEvent(ev);
              }}
              onToggleDone={onToggleDone}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day "+N more" Internal Scroll Popover (Requirement 1.4) */}
      <AnimatePresence>
        {overflowPopover && (
          <>
            <div
              className="fixed inset-0 z-[125]"
              onClick={() => setOverflowPopover(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: overflowPopover.x,
                top: overflowPopover.y,
                zIndex: 130,
              }}
              className="w-76 bg-white dark:bg-[#1C1F26] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/70 dark:bg-white/[0.02]">
                <div>
                  <p className="text-xs font-extrabold capitalize text-zinc-900 dark:text-zinc-100">
                    {format(overflowPopover.day, "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-[10px] font-semibold text-zinc-500">
                    {overflowPopover.events.length} tarea(s) en este día
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOverflowPopover(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="max-h-68 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                {overflowPopover.events.map(ev => {
                  const done = isCardCompleted(ev);
                  const overdue = isEventOverdue(ev);
                  const color = getEventAccentColor(ev, colorBy);
                  const pInfo = PRIORITY_COLORS[ev.extendedProps.priority || 'P2'] || PRIORITY_COLORS.P2;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setOverflowPopover(null);
                        onSelectEvent(ev);
                      }}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      style={{ borderLeftWidth: '3.5px', borderLeftColor: done ? '#10B981' : overdue ? '#EF4444' : color }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                          <span className="truncate">{ev.extendedProps.boardName}</span>
                          <span>›</span>
                          <span className="truncate">{ev.extendedProps.listName}</span>
                        </div>
                        <p
                          className={`text-xs font-bold truncate mt-0.5 ${
                            done
                              ? 'line-through text-zinc-400'
                              : 'text-zinc-800 dark:text-zinc-100'
                          }`}
                        >
                          {ev.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${pInfo.badgeClass}`}
                        >
                          {ev.extendedProps.priority || 'P2'}
                        </span>
                        {ev.extendedProps.assignees?.[0] && (
                          <img
                            src={getAvatarUrl(ev.extendedProps.assignees[0])}
                            alt={ev.extendedProps.assignees[0].name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Selected Day Bottom Sheet (Requirement 1.20) */}
      <AnimatePresence>
        {mobileSelectedDay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[130] md:hidden"
              onClick={() => setMobileSelectedDay(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[140] md:hidden bg-white dark:bg-[#1C1F26] rounded-t-2xl border-t border-zinc-200 dark:border-white/10 shadow-2xl max-h-[75dvh] flex flex-col"
            >
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-black capitalize text-zinc-900 dark:text-zinc-100">
                    {format(mobileSelectedDay, "EEEE d 'de' MMMM", { locale: es })}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {mobileDayEvents.length} tarea(s) programadas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSelectedDay(null)}
                  className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5 pb-8">
                {mobileDayEvents.length === 0 ? (
                  <p className="text-center text-xs font-semibold text-zinc-400 py-8">
                    No hay tareas programadas para este día.
                  </p>
                ) : (
                  mobileDayEvents.map(ev => {
                    const done = isCardCompleted(ev);
                    const color = getEventAccentColor(ev, colorBy);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setMobileSelectedDay(null);
                          onSelectEvent(ev);
                        }}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10"
                        style={{ borderLeftWidth: '4px', borderLeftColor: color }}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-zinc-400 block truncate">
                            {ev.extendedProps.boardName} › {ev.extendedProps.listName}
                          </span>
                          <p
                            className={`text-sm font-bold truncate ${
                              done ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {ev.title}
                          </p>
                        </div>
                        {ev.extendedProps.canEdit !== false && (
                          <button
                            type="button"
                            onClick={e => onToggleDone(ev, e)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                              done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-zinc-300 dark:border-white/20 text-transparent'
                            }`}
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LuminsCalendarMonthView;
