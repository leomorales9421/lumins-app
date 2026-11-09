import React, { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  differenceInCalendarDays,
  format,
  isToday,
  isWeekend,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  GanttChart,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  List as ListIcon,
  Users, 
} from 'lucide-react';
import {
  type CalendarBoardInfo,
  type CalendarCardEvent,
  type CalendarColorBy,
  type CalendarWorkspaceMember,
  type TimelineGroupBy,
  type TimelineScaleMode,
  PRIORITY_COLORS,
  getDayKey,
  getEventAccentColor,
  getEventDateRange,
  isCardCompleted,
  isEventOverdue,
} from '../../lib/calendar-utils';
import { getAvatarUrl } from './CalendarCardPreviewPopover';

interface LuminsCalendarTimelineViewProps {
  currentDate: Date;
  events: CalendarCardEvent[];
  boards: CalendarBoardInfo[];
  members: CalendarWorkspaceMember[];
  colorBy: CalendarColorBy;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onResizeEventDates: (
    event: CalendarCardEvent,
    newStartDate: Date,
    newDueDate: Date
  ) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

interface TimelineGroup {
  id: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
  avatarUrl?: string | null;
  items: CalendarCardEvent[];
}

const LuminsCalendarTimelineView: React.FC<LuminsCalendarTimelineViewProps> = ({
  currentDate,
  events,
  boards,
  members,
  colorBy,
  onSelectEvent,
  onResizeEventDates,
  onOpenQuickMenu,
}) => {
  const [scale, setScale] = useState<TimelineScaleMode>('month');
  const [groupBy, setGroupBy] = useState<TimelineGroupBy>('board');
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>({});
  const [resizeDraft, setResizeDraft] = useState<{
    eventId: string;
    edge: 'start' | 'end' | 'move';
    originX: number;
    origStart: Date;
    origEnd: Date;
    deltaDays: number;
  } | null>(null);

  // Build timeline days interval based on scale
  const timelineDays = useMemo(() => {
    if (scale === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addDays(start, 13); // 14-day sprint window
      return eachDayOfInterval({ start, end });
    }
    if (scale === 'quarter') {
      const start = startOfMonth(currentDate);
      const end = addDays(start, 89); // 90-day quarter window
      return eachDayOfInterval({ start, end });
    }
    // Default: month
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate, scale]);

  const dayColWidth = scale === 'week' ? 76 : scale === 'month' ? 44 : 26;
  const rangeStart = startOfDay(timelineDays[0]);
  const rangeEnd = startOfDay(timelineDays[timelineDays.length - 1]);

  // Filter events that intersect with visible timeline range
  const visibleEvents = useMemo(() => {
    return events.filter(ev => {
      const { start, end } = getEventDateRange(ev);
      return !isAfter(start, rangeEnd) && !isBefore(end, rangeStart);
    });
  }, [events, rangeStart, rangeEnd]);

  // Group events by Board, List, or Assignee
  const groups = useMemo<TimelineGroup[]>(() => {
    if (groupBy === 'board') {
      const map = new Map<string, TimelineGroup>();
      for (const b of boards) {
        map.set(b.id, {
          id: b.id,
          title: b.name,
          accentColor: b.accentColor,
          items: [],
        });
      }
      for (const ev of visibleEvents) {
        const bId = ev.extendedProps.boardId;
        if (!map.has(bId)) {
          map.set(bId, {
            id: bId,
            title: ev.extendedProps.boardName,
            accentColor: ev.extendedProps.boardAccentColor || '#6C5DD3',
            items: [],
          });
        }
        map.get(bId)?.items.push(ev);
      }
      return Array.from(map.values()).filter(g => g.items.length > 0 || boards.length <= 8);
    }

    if (groupBy === 'list') {
      const map = new Map<string, TimelineGroup>();
      for (const ev of visibleEvents) {
        const key = `${ev.extendedProps.boardId}:${ev.extendedProps.listName}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            title: ev.extendedProps.listName,
            subtitle: ev.extendedProps.boardName,
            accentColor: ev.extendedProps.boardAccentColor || '#6C5DD3',
            items: [],
          });
        }
        map.get(key)?.items.push(ev);
      }
      return Array.from(map.values());
    }

    // groupBy === 'assignee'
    const map = new Map<string, TimelineGroup>();
    map.set('__UNASSIGNED__', {
      id: '__UNASSIGNED__',
      title: 'Sin asignar',
      accentColor: '#94A3B8',
      items: [],
    });
    for (const m of members) {
      map.set(m.id, {
        id: m.id,
        title: m.name,
        avatarUrl: getAvatarUrl(m),
        accentColor: '#6C5DD3',
        items: [],
      });
    }
    for (const ev of visibleEvents) {
      const assignees = ev.extendedProps.assignees || [];
      if (assignees.length === 0) {
        map.get('__UNASSIGNED__')?.items.push(ev);
      } else {
        for (const a of assignees) {
          if (!map.has(a.id)) {
            map.set(a.id, {
              id: a.id,
              title: a.name,
              avatarUrl: getAvatarUrl(a),
              accentColor: '#6C5DD3',
              items: [],
            });
          }
          map.get(a.id)?.items.push(ev);
        }
      }
    }
    return Array.from(map.values()).filter(
      g => g.items.length > 0 || g.id !== '__UNASSIGNED__'
    );
  }, [groupBy, boards, members, visibleEvents]);

  const toggleGroup = (id: string) => {
    setCollapsedGroupIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startPointerInteraction = (
    e: React.PointerEvent,
    ev: CalendarCardEvent,
    edge: 'start' | 'end' | 'move'
  ) => {
    if (ev.extendedProps.canEdit === false) return;
    e.stopPropagation();
    e.preventDefault();

    const { start, end } = getEventDateRange(ev);
    const originX = e.clientX;

    setResizeDraft({
      eventId: ev.id,
      edge,
      originX,
      origStart: start,
      origEnd: end,
      deltaDays: 0,
    });

    const handleMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - originX;
      const dDays = Math.round(dx / dayColWidth);
      setResizeDraft(prev => (prev ? { ...prev, deltaDays: dDays } : null));
    };

    const handleUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);

      const dx = upEvt.clientX - originX;
      const dDays = Math.round(dx / dayColWidth);

      setResizeDraft(null);
      if (dDays === 0) {
        if (edge === 'move' && Math.abs(dx) < 4) {
          onSelectEvent(ev);
        }
        return;
      }

      let nextStart = start;
      let nextEnd = end;
      if (edge === 'start') {
        nextStart = addDays(start, dDays);
        if (isAfter(nextStart, nextEnd)) nextStart = nextEnd;
      } else if (edge === 'end') {
        nextEnd = addDays(end, dDays);
        if (isBefore(nextEnd, nextStart)) nextEnd = nextStart;
      } else {
        nextStart = addDays(start, dDays);
        nextEnd = addDays(end, dDays);
      }

      onResizeEventDates(ev, nextStart, nextEnd);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const totalGridWidth = timelineDays.length * dayColWidth;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#181B22] rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-xs">
      {/* Top Timeline Controls */}
      <div className="px-3 py-2 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/90 dark:bg-[#14171E] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <GanttChart size={15} className="text-[#6C5DD3]" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100 whitespace-nowrap">
            Cronograma Timeline
          </span>
          <span className="text-[11px] font-medium text-zinc-400 hidden md:inline">
            · Arrastra una barra para moverla o estira sus bordes para ajustar duración
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Group By Selector */}
          <div className="flex items-center bg-zinc-200/60 dark:bg-white/[0.06] p-0.5 rounded-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setGroupBy('board')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 transition-all ${
                groupBy === 'board'
                  ? 'bg-white dark:bg-[#232732] text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Layers size={11} />
              Tablero
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('list')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 transition-all ${
                groupBy === 'list'
                  ? 'bg-white dark:bg-[#232732] text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <ListIcon size={11} />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('assignee')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 transition-all ${
                groupBy === 'assignee'
                  ? 'bg-white dark:bg-[#232732] text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Users size={11} />
              Asignado
            </button>
          </div>

          {/* Scale Selector */}
          <div className="flex items-center bg-zinc-200/60 dark:bg-white/[0.06] p-0.5 rounded-lg text-[11px] font-extrabold">
            {(
              [
                { id: 'week', label: '14 Días' },
                { id: 'month', label: 'Mes' },
                { id: 'quarter', label: 'Trimestre' },
              ] as const
            ).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScale(s.id)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  scale === s.id
                    ? 'bg-[#6C5DD3] text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Synchronized Timeline Container */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <div
          className="min-w-fit flex flex-col"
          style={{ minWidth: `calc(110px + ${totalGridWidth}px)` }}
        >
          {/* Sticky Timeline Dates Header */}
          <div className="sticky top-0 z-20 flex border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-[#15181F]">
            <div className="w-[140px] sm:w-[200px] md:w-[280px] lg:w-[320px] shrink-0 px-2 sm:px-3.5 py-2.5 border-r border-zinc-200/80 dark:border-white/10 sticky left-0 z-30 bg-zinc-50 dark:bg-[#15181F] flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              <span className="truncate">
                {groupBy === 'board'
                  ? 'Tablero / Tarea'
                  : groupBy === 'list'
                  ? 'Lista / Tarea'
                  : 'Miembro / Tarea'}
              </span>
              <span>({visibleEvents.length})</span>
            </div>

            <div className="flex" style={{ width: totalGridWidth }}>
              {timelineDays.map(day => {
                const key = getDayKey(day);
                const today = isToday(day);
                const weekend = isWeekend(day);
                return (
                  <div
                    key={key}
                    style={{ width: dayColWidth }}
                    className={`py-1.5 border-r border-zinc-200/50 dark:border-white/[0.04] flex flex-col items-center justify-center shrink-0 ${
                      today
                        ? 'bg-[#6C5DD3]/15 text-[#6C5DD3] dark:text-[#A599F9]'
                        : weekend
                        ? 'bg-zinc-100/60 dark:bg-white/[0.02] text-zinc-400'
                        : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {scale !== 'quarter' && (
                      <span className="text-[9px] font-bold uppercase leading-none opacity-75">
                        {format(day, 'EEEEE', { locale: es })}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-black leading-tight ${
                        today ? 'underline decoration-2' : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Groups & Gantt Rows */}
          <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.05]">
            {groups.map(group => {
              const isCollapsed = Boolean(collapsedGroupIds[group.id]);

              return (
                <div key={group.id} className="flex flex-col">
                  {/* Group Header Bar */}
                  <div className="flex bg-zinc-50/70 dark:bg-[#15181F]/80 border-b border-zinc-200/50 dark:border-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="w-[140px] sm:w-[200px] md:w-[280px] lg:w-[320px] shrink-0 px-2 sm:px-3 py-2 border-r border-zinc-200/80 dark:border-white/10 sticky left-0 z-10 bg-zinc-50 dark:bg-[#15181F] flex items-center justify-between gap-1.5 text-left hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isCollapsed ? (
                          <ChevronRight size={14} className="text-zinc-400 shrink-0" />
                        ) : (
                          <ChevronDown size={14} className="text-zinc-400 shrink-0" />
                        )}
                        {group.avatarUrl ? (
                          <img
                            src={group.avatarUrl}
                            alt={group.title}
                            style={{ borderRadius: '9999px' }}
                            className="w-5 h-5 object-cover shrink-0"
                          />
                        ) : (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: group.accentColor || '#6C5DD3' }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                            {group.title}
                          </p>
                          {group.subtitle && (
                            <p className="text-[10px] font-semibold text-zinc-400 truncate">
                              {group.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-200/70 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 shrink-0">
                        {group.items.length}
                      </span>
                    </button>

                    <div className="flex-1" />
                  </div>

                  {/* Group Task Rows */}
                  {!isCollapsed &&
                    group.items.map(ev => {
                      const props = ev.extendedProps;
                      const done = isCardCompleted(ev);
                      const overdue = isEventOverdue(ev);
                      const canEdit = props.canEdit !== false;
                      const color = getEventAccentColor(ev, colorBy);
                      const priorityInfo =
                        PRIORITY_COLORS[props.priority || 'P2'] || PRIORITY_COLORS.P2;

                      const rawRange = getEventDateRange(ev);
                      let dispStart = rawRange.start;
                      let dispEnd = rawRange.end;

                      if (resizeDraft && resizeDraft.eventId === ev.id) {
                        if (resizeDraft.edge === 'start') {
                          dispStart = addDays(resizeDraft.origStart, resizeDraft.deltaDays);
                          if (isAfter(dispStart, dispEnd)) dispStart = dispEnd;
                        } else if (resizeDraft.edge === 'end') {
                          dispEnd = addDays(resizeDraft.origEnd, resizeDraft.deltaDays);
                          if (isBefore(dispEnd, dispStart)) dispEnd = dispStart;
                        } else {
                          dispStart = addDays(resizeDraft.origStart, resizeDraft.deltaDays);
                          dispEnd = addDays(resizeDraft.origEnd, resizeDraft.deltaDays);
                        }
                      }

                      const clampedStart = isBefore(dispStart, rangeStart)
                        ? rangeStart
                        : dispStart;
                      const clampedEnd = isAfter(dispEnd, rangeEnd) ? rangeEnd : dispEnd;

                      const offsetDays = Math.max(
                        0,
                        differenceInCalendarDays(clampedStart, rangeStart)
                      );
                      const spanDays = Math.max(
                        1,
                        differenceInCalendarDays(clampedEnd, clampedStart) + 1
                      );

                      const barLeft = offsetDays * dayColWidth + 3;
                      const barWidth = Math.max(18, spanDays * dayColWidth - 6);

                      return (
                        <div
                          key={`${group.id}:${ev.id}`}
                          className="flex items-center hover:bg-zinc-50/50 dark:hover:bg-white/[0.015] transition-colors h-10"
                        >
                          {/* Left Sticky Task Label */}
                          <div
                            onClick={() => onSelectEvent(ev)}
                            onContextMenu={e => {
                              e.preventDefault();
                              onOpenQuickMenu?.(ev, { x: e.clientX, y: e.clientY });
                            }}
                            className="w-[140px] sm:w-[200px] md:w-[280px] lg:w-[320px] shrink-0 h-full px-2 sm:px-3 border-r border-zinc-200/80 dark:border-white/10 sticky left-0 z-10 bg-white dark:bg-[#181B22] flex items-center justify-between gap-1.5 cursor-pointer hover:text-[#6C5DD3]"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {done ? (
                                <CheckCircle2
                                  size={13}
                                  className="text-emerald-500 shrink-0"
                                />
                              ) : overdue ? (
                                <AlertCircle size={13} className="text-rose-500 shrink-0" />
                              ) : props.blocked ? (
                                <Lock size={12} className="text-amber-500 shrink-0" />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: priorityInfo.hex }}
                                />
                              )}
                              <span
                                className={`text-xs font-bold truncate ${
                                  done
                                    ? 'line-through text-zinc-400'
                                    : 'text-zinc-800 dark:text-zinc-200'
                                }`}
                              >
                                {ev.title}
                              </span>
                            </div>

                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-extrabold border shrink-0 ${priorityInfo.badgeClass}`}
                            >
                              {props.priority || 'P2'}
                            </span>
                          </div>

                          {/* Right Timeline Track */}
                          <div
                            className="relative h-full flex items-center"
                            style={{ width: totalGridWidth }}
                          >
                            {/* Background vertical day lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                              {timelineDays.map(day => {
                                const today = isToday(day);
                                const weekend = isWeekend(day);
                                return (
                                  <div
                                    key={getDayKey(day)}
                                    style={{ width: dayColWidth }}
                                    className={`h-full border-r border-zinc-100 dark:border-white/[0.03] shrink-0 ${
                                      today
                                        ? 'bg-[#6C5DD3]/[0.05]'
                                        : weekend
                                        ? 'bg-zinc-50/40 dark:bg-white/[0.01]'
                                        : ''
                                    }`}
                                  />
                                );
                              })}
                            </div>

                            {/* Gantt Bar */}
                            <div
                              onPointerDown={e => startPointerInteraction(e, ev, 'move')}
                              onContextMenu={e => {
                                e.preventDefault();
                                onOpenQuickMenu?.(ev, { x: e.clientX, y: e.clientY });
                              }}
                              style={{
                                left: barLeft,
                                width: barWidth,
                                backgroundColor: done
                                  ? 'rgba(16, 185, 129, 0.16)'
                                  : `${color}24`,
                                borderColor: done ? '#10B981' : color,
                                borderLeftWidth: '4px',
                              }}
                              className={`group/bar absolute z-10 h-7 rounded-md border flex items-center justify-between px-2 text-[11px] font-bold select-none shadow-2xs transition-shadow ${
                                canEdit
                                  ? 'cursor-grab active:cursor-grabbing hover:shadow-md'
                                  : 'cursor-pointer'
                              }`}
                            >
                              {/* Left Resize Handle */}
                              {canEdit && (
                                <div
                                  onPointerDown={e => startPointerInteraction(e, ev, 'start')}
                                  title="Arrastrar para cambiar fecha de inicio"
                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-black/15 dark:bg-white/25 rounded-l"
                                />
                              )}

                              {barWidth >= 80 ? (
                                <>
                                  <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
                                    <span
                                      className={`truncate ${
                                        done
                                          ? 'line-through text-zinc-500'
                                          : 'text-zinc-900 dark:text-zinc-100'
                                      }`}
                                    >
                                      {ev.title}
                                    </span>
                                    <span className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 shrink-0">
                                      ({spanDays}d)
                                    </span>
                                  </div>

                                  {props.assignees && props.assignees.length > 0 && barWidth >= 110 && (
                                    <div className="flex items-center -space-x-1 shrink-0 pointer-events-none">
                                      {props.assignees.slice(0, 2).map(m => (
                                        <img
                                          key={m.id}
                                          src={getAvatarUrl(m)}
                                          alt={m.name}
                                          style={{ borderRadius: '9999px' }}
                                          className="w-4 h-4 object-cover ring-1 ring-white dark:ring-[#181B22]"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  {/* Compact indicator inside narrow bar without squeezed text */}
                                  <div className="w-full flex items-center justify-center pointer-events-none">
                                    {done ? (
                                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                    ) : spanDays > 1 ? (
                                      <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300">
                                        {spanDays}d
                                      </span>
                                    ) : (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: color }}
                                      />
                                    )}
                                  </div>

                                  {/* Floating label to the right of narrow bar */}
                                  <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none whitespace-nowrap z-20">
                                    <span
                                      className={`text-[11px] font-bold ${
                                        done
                                          ? 'line-through text-zinc-400'
                                          : 'text-zinc-700 dark:text-zinc-200'
                                      }`}
                                    >
                                      {ev.title}
                                    </span>
                                    <span className="text-[10px] font-semibold text-zinc-400">
                                      ({spanDays === 1 ? '1 día' : `${spanDays} días`})
                                    </span>
                                  </div>
                                </>
                              )}

                              {/* Right Resize Handle */}
                              {canEdit && (
                                <div
                                  onPointerDown={e => startPointerInteraction(e, ev, 'end')}
                                  title="Arrastrar para cambiar fecha de entrega"
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-black/15 dark:bg-white/25 rounded-r"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuminsCalendarTimelineView;

