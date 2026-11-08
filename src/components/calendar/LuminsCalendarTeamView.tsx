import React, { useState, useMemo } from 'react';
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
  isToday,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Calendar as CalendarIcon,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import {
  type CalendarCardEvent,
  type CalendarColorBy,
  type CalendarWorkspaceMember,
  PRIORITY_COLORS,
  buildWeekDays,
  getDayKey,
  getEventAccentColor,
  getEventDateRange,
  isCardCompleted,
  isEventOverdue,
} from '../../lib/calendar-utils';
import { getAvatarUrl } from './CalendarCardPreviewPopover';

interface LuminsCalendarTeamViewProps {
  currentDate: Date;
  events: CalendarCardEvent[];
  members: CalendarWorkspaceMember[];
  colorBy: CalendarColorBy;
  hideWeekends: boolean;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onReassignAndReschedule: (
    event: CalendarCardEvent,
    fromMemberId: string | null,
    toMemberId: string | null,
    targetDate: Date
  ) => void;
  onDropUnscheduledCard?: (cardId: string, targetDate: Date, targetMemberId: string | null) => void;
  onOpenQuickCreate?: (date: Date) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

const UNASSIGNED_ROW_ID = '__UNASSIGNED__';

function getLoadBadge(activeCount: number, overloadThreshold: number) {
  if (activeCount === 0) {
    return {
      label: 'Libre',
      dotColor: '#94A3B8',
      badgeClass: 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-400',
      cellBg: '',
      status: 'free' as const,
    };
  }
  if (activeCount >= overloadThreshold) {
    return {
      label: `${activeCount} · Sobrecarga`,
      dotColor: '#EF4444',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
      cellBg: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.07]',
      status: 'overload' as const,
    };
  }
  if (activeCount === overloadThreshold - 1) {
    return {
      label: `${activeCount} · Alta`,
      dotColor: '#F59E0B',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      cellBg: 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05]',
      status: 'high' as const,
    };
  }
  return {
    label: `${activeCount} · OK`,
    dotColor: '#10B981',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    cellBg: '',
    status: 'healthy' as const,
  };
}

interface DraggableTeamChipProps {
  event: CalendarCardEvent;
  memberId: string;
  dayKey: string;
  colorBy: CalendarColorBy;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

const DraggableTeamChip: React.FC<DraggableTeamChipProps> = ({
  event,
  memberId,
  dayKey,
  colorBy,
  onSelectEvent,
  onOpenQuickMenu,
}) => {
  const props = event.extendedProps;
  const canEdit = props.canEdit !== false;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `team-card:${event.id}:${memberId}:${dayKey}`,
    data: { event, fromMemberId: memberId === UNASSIGNED_ROW_ID ? null : memberId },
    disabled: !canEdit,
  });

  const done = isCardCompleted(event);
  const overdue = isEventOverdue(event);
  const color = getEventAccentColor(event, colorBy);
  const priorityInfo = PRIORITY_COLORS[props.priority || 'P2'] || PRIORITY_COLORS.P2;

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
        onOpenQuickMenu?.(event, { x: e.clientX, y: e.clientY });
      }}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: done ? '#10B981' : overdue ? '#EF4444' : color,
      }}
      className={`group px-2 py-1.5 rounded-lg border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#1E222B] shadow-2xs transition-all select-none ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? 'opacity-35 scale-95' : 'hover:border-[#6C5DD3]/50'} ${
        done ? 'opacity-65' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] font-bold text-zinc-400 truncate">
          {props.boardName}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: priorityInfo.hex }}
            title={priorityInfo.label}
          />
          {onOpenQuickMenu && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                onOpenQuickMenu(event, { x: r.left, y: r.bottom + 2 });
              }}
              onPointerDown={e => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity"
            >
              <MoreHorizontal size={11} />
            </button>
          )}
        </div>
      </div>

      <p
        className={`text-[11px] font-bold leading-tight truncate mt-0.5 ${
          done
            ? 'line-through text-zinc-400'
            : 'text-zinc-800 dark:text-zinc-100'
        }`}
      >
        {event.title}
      </p>
    </div>
  );
};

interface DroppableTeamCellProps {
  memberId: string;
  day: Date;
  cellEvents: CalendarCardEvent[];
  overloadThreshold: number;
  colorBy: CalendarColorBy;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onDropUnscheduledCard?: (cardId: string, targetDate: Date, targetMemberId: string | null) => void;
  onOpenQuickMenu?: (event: CalendarCardEvent, pos: { x: number; y: number }) => void;
}

const DroppableTeamCell: React.FC<DroppableTeamCellProps> = ({
  memberId,
  day,
  cellEvents,
  overloadThreshold,
  colorBy,
  onSelectEvent,
  onDropUnscheduledCard,
  onOpenQuickMenu,
}) => {
  const dayKey = getDayKey(day);
  const { isOver, setNodeRef } = useDroppable({
    id: `team-cell:${memberId}:${dayKey}`,
    data: {
      targetMemberId: memberId === UNASSIGNED_ROW_ID ? null : memberId,
      targetDay: day,
    },
  });

  const activeEventsCount = cellEvents.filter(ev => !isCardCompleted(ev)).length;
  const load = getLoadBadge(activeEventsCount, overloadThreshold);
  const today = isToday(day);

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
          onDropUnscheduledCard(
            cardId,
            day,
            memberId === UNASSIGNED_ROW_ID ? null : memberId
          );
        }
      }}
      className={`p-1.5 border-r border-zinc-200/60 dark:border-white/[0.05] last:border-r-0 flex flex-col gap-1.5 min-h-[84px] transition-colors ${
        load.cellBg
      } ${today ? 'bg-[#6C5DD3]/[0.03]' : ''} ${
        isOver ? 'ring-2 ring-inset ring-[#6C5DD3] bg-[#6C5DD3]/10' : ''
      }`}
    >
      {/* Cell capacity indicator */}
      {cellEvents.length > 0 && (
        <div className="flex items-center justify-between px-0.5">
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${load.badgeClass}`}
          >
            {load.label}
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-1 flex-1">
        {cellEvents.map(ev => (
          <DraggableTeamChip
            key={`${memberId}:${dayKey}:${ev.id}`}
            event={ev}
            memberId={memberId}
            dayKey={dayKey}
            colorBy={colorBy}
            onSelectEvent={onSelectEvent}
            onOpenQuickMenu={onOpenQuickMenu}
          />
        ))}
      </div>
    </div>
  );
};

const LuminsCalendarTeamView: React.FC<LuminsCalendarTeamViewProps> = ({
  currentDate,
  events,
  members,
  colorBy,
  hideWeekends,
  onSelectEvent,
  onReassignAndReschedule,
  onDropUnscheduledCard,
  onOpenQuickCreate,
  onOpenQuickMenu,
}) => {
  const [overloadThreshold, setOverloadThreshold] = useState<number>(4);
  const [activeDragEvent, setActiveDragEvent] = useState<CalendarCardEvent | null>(null);
  const [mobileMode, setMobileMode] = useState<'cards' | 'grid'>('cards');

  const weekDays = useMemo(
    () => buildWeekDays(currentDate, hideWeekends),
    [currentDate, hideWeekends]
  );

  // Build rows: Unassigned + Workspace Members
  const rows = useMemo(() => {
    const memberMap = new Map<string, CalendarWorkspaceMember>();
    for (const m of members) {
      memberMap.set(m.id, m);
    }
    // Also ensure any assignee on events is included
    for (const ev of events) {
      for (const a of ev.extendedProps.assignees || []) {
        if (!memberMap.has(a.id)) {
          memberMap.set(a.id, {
            id: a.id,
            name: a.name,
            email: a.email || '',
            avatarUrl: a.avatarUrl || null,
            role: 'MEMBER',
          });
        }
      }
    }

    return [
      {
        id: UNASSIGNED_ROW_ID,
        name: 'Sin asignar',
        email: '',
        avatarUrl: null,
        role: 'UNASSIGNED',
        isUnassigned: true,
      },
      ...Array.from(memberMap.values()).map(m => ({
        ...m,
        isUnassigned: false,
      })),
    ];
  }, [members, events]);

  // Matrix: rowId -> dayKey -> CalendarCardEvent[]
  const matrix = useMemo(() => {
    const map = new Map<string, Map<string, CalendarCardEvent[]>>();
    for (const r of rows) {
      const dayMap = new Map<string, CalendarCardEvent[]>();
      for (const d of weekDays) {
        dayMap.set(getDayKey(d), []);
      }
      map.set(r.id, dayMap);
    }

    for (const ev of events) {
      const { start, end } = getEventDateRange(ev);
      const assignees = ev.extendedProps.assignees || [];

      for (const d of weekDays) {
        const dayStart = startOfDay(d);
        if (!isBefore(dayStart, start) && !isAfter(dayStart, end)) {
          const dayKey = getDayKey(dayStart);
          if (assignees.length === 0) {
            map.get(UNASSIGNED_ROW_ID)?.get(dayKey)?.push(ev);
          } else {
            for (const a of assignees) {
              map.get(a.id)?.get(dayKey)?.push(ev);
            }
          }
        }
      }
    }

    return map;
  }, [rows, weekDays, events]);

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
    const fromMemberId = (e.active.data.current?.fromMemberId as string | null) ?? null;
    const targetData = e.over?.data.current as
      | { targetMemberId: string | null; targetDay: Date }
      | undefined;

    if (ev && targetData) {
      onReassignAndReschedule(
        ev,
        fromMemberId,
        targetData.targetMemberId,
        targetData.targetDay
      );
    }
  };

  const colsCount = weekDays.length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#181B22] rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-xs">
        {/* Top Workload Toolbar & Legend (Requirement 3.2) */}
        <div className="px-3.5 py-2 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/90 dark:bg-[#14171E] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <Users size={15} className="text-[#6C5DD3]" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100 whitespace-nowrap">
              Carga de Trabajo
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile View Mode Switcher (Tarjetas vs Grilla) */}
            <div className="flex md:hidden items-center bg-zinc-200/60 dark:bg-white/10 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMobileMode('cards')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  mobileMode === 'cards'
                    ? 'bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-white shadow-2xs font-black'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Tarjetas
              </button>
              <button
                type="button"
                onClick={() => setMobileMode('grid')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  mobileMode === 'grid'
                    ? 'bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-white shadow-2xs font-black'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Matriz
              </button>
            </div>

            {/* Semaphore Legend */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 text-[9px] sm:text-[10px] font-bold shrink-0">
              <span className="inline-flex items-center gap-0.5 sm:gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={10} />
                <span className="hidden sm:inline">1–{overloadThreshold - 2}</span> Saludable
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={10} />
                <span className="hidden sm:inline">{overloadThreshold - 1}</span> Alta
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 text-rose-600 dark:text-rose-400">
                <Flame size={10} />
                <span className="hidden sm:inline">{overloadThreshold}+</span> Sobrecarga
              </span>
            </div>

            {/* Overload threshold selector */}
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-zinc-500 shrink-0">
              <span className="hidden sm:inline">Alerta en:</span>
              <select
                value={overloadThreshold}
                onChange={e => setOverloadThreshold(Number(e.target.value))}
                className="h-6 px-1.5 rounded-md bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-[10px] sm:text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200"
              >
                <option value={3}>3/día</option>
                <option value={4}>4/día</option>
                <option value={5}>5/día</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Native Cards Mode (< md) */}
        {mobileMode === 'cards' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 md:hidden">
            {rows.map(row => {
              const dayMap = matrix.get(row.id);
              let weeklyTasks: CalendarCardEvent[] = [];
              let peakDailyLoad = 0;

              if (dayMap) {
                const seen = new Set<string>();
                for (const [, list] of dayMap.entries()) {
                  const active = list.filter(ev => !isCardCompleted(ev));
                  if (active.length > peakDailyLoad) peakDailyLoad = active.length;
                  for (const ev of list) {
                    if (!seen.has(ev.id)) {
                      seen.add(ev.id);
                      weeklyTasks.push(ev);
                    }
                  }
                }
              }

              const peakStatus = getLoadBadge(peakDailyLoad, overloadThreshold);

              return (
                <div
                  key={row.id}
                  className="bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/80 dark:border-white/10 p-3.5 shadow-xs space-y-3"
                >
                  {/* Member Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {row.isUnassigned ? (
                        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <UserX size={15} />
                        </div>
                      ) : (
                        <img
                          src={getAvatarUrl(row)}
                          alt={row.name}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-white/10 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                          {row.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-zinc-400">
                          {weeklyTasks.length} {weeklyTasks.length === 1 ? 'tarea' : 'tareas'} asignadas
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${peakStatus.badgeClass}`}>
                      {peakDailyLoad === 0 ? 'Libre' : `${peakDailyLoad}/día · ${peakStatus.label.split('·')[1] || 'OK'}`}
                    </span>
                  </div>

                  {/* 7-Day Mini Strip */}
                  <div className="grid grid-cols-7 gap-1 pt-2 border-t border-zinc-100 dark:border-white/5 text-center">
                    {weekDays.map(day => {
                      const key = getDayKey(day);
                      const dayTasks = dayMap?.get(key) || [];
                      const today = isToday(day);
                      return (
                        <div
                          key={key}
                          className={`py-1 rounded-lg flex flex-col items-center justify-center ${
                            today ? 'bg-[#6C5DD3]/15 text-[#6C5DD3]' : 'bg-zinc-50 dark:bg-white/[0.03]'
                          }`}
                        >
                          <span className="text-[9px] font-bold uppercase text-zinc-400">
                            {format(day, 'EEE', { locale: es }).slice(0, 2)}
                          </span>
                          <span className="text-[11px] font-black">{format(day, 'd')}</span>
                          {dayTasks.length > 0 ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C5DD3] mt-0.5" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Member Tasks List */}
                  {weeklyTasks.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {weeklyTasks.map(ev => {
                        const isDone = isCardCompleted(ev);
                        const color = getEventAccentColor(ev, colorBy);
                        return (
                          <div
                            key={ev.id}
                            onClick={() => onSelectEvent(ev)}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/5 active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                {ev.title}
                              </span>
                            </div>
                            {ev.extendedProps.dueDate && (
                              <span className="text-[10px] text-zinc-400 font-semibold shrink-0">
                                {format(new Date(ev.extendedProps.dueDate), 'd MMM', { locale: es })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable Workload Matrix (Desktop or Mobile Grid Mode) */}
        <div className={`${mobileMode === 'cards' ? 'hidden md:flex' : 'flex'} flex-1 min-h-0 overflow-auto custom-scrollbar`}>
          <div className="min-w-[620px] md:min-w-[780px] flex flex-col">
            {/* Sticky Day Headers */}
            <div
              className="sticky top-0 z-20 grid border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-[#15181F]"
              style={{
                gridTemplateColumns: `minmax(110px, 220px) repeat(${colsCount}, minmax(85px, 1fr))`,
              }}
            >
              <div className="px-2.5 sm:px-3.5 py-2.5 border-r border-zinc-200/80 dark:border-white/10 flex items-center text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                Miembro / Capacidad
              </div>

              {weekDays.map(day => {
                const key = getDayKey(day);
                const today = isToday(day);
                return (
                  <div
                    key={key}
                    className={`px-2.5 py-2 border-r border-zinc-200/60 dark:border-white/[0.05] last:border-r-0 flex items-center justify-between ${
                      today ? 'bg-[#6C5DD3]/[0.08]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        style={{ borderRadius: '9999px' }}
                        className={`w-6 h-6 text-[11px] font-black flex items-center justify-center shrink-0 ${
                          today
                            ? 'bg-[#6C5DD3] text-white'
                            : 'bg-zinc-200/70 dark:bg-white/10 text-zinc-700 dark:text-zinc-200'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-200 truncate">
                          {format(day, 'EEE', { locale: es })}
                        </span>
                        <span className="text-[9px] font-semibold text-zinc-400 capitalize">
                          {format(day, 'MMM', { locale: es })}
                        </span>
                      </div>
                    </div>

                    {onOpenQuickCreate && (
                      <button
                        type="button"
                        onClick={() => onOpenQuickCreate(day)}
                        title="Crear tarea en este día"
                        className="p-1 rounded-md text-zinc-400 hover:text-[#6C5DD3] hover:bg-[#6C5DD3]/10 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Member Rows */}
            <div className="divide-y divide-zinc-200/70 dark:divide-white/[0.06]">
              {rows.map(row => {
                const dayMap = matrix.get(row.id);
                let weeklyUniqueTasks = new Set<string>();
                let peakDailyLoad = 0;

                if (dayMap) {
                  for (const [, list] of dayMap.entries()) {
                    const active = list.filter(ev => !isCardCompleted(ev));
                    if (active.length > peakDailyLoad) peakDailyLoad = active.length;
                    for (const ev of list) weeklyUniqueTasks.add(ev.id);
                  }
                }

                const peakStatus = getLoadBadge(peakDailyLoad, overloadThreshold);

                return (
                  <div
                    key={row.id}
                    className={`grid ${
                      row.isUnassigned
                        ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.03]'
                        : 'bg-white dark:bg-[#181B22]'
                    }`}
                    style={{
                      gridTemplateColumns: `minmax(110px, 220px) repeat(${colsCount}, minmax(85px, 1fr))`,
                    }}
                  >
                    {/* Left Member Cell */}
                    <div className="p-2 sm:p-3 border-r border-zinc-200/80 dark:border-white/10 flex flex-col justify-between gap-2 sticky left-0 z-10 bg-white dark:bg-[#181B22]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {row.isUnassigned ? (
                          <div
                            style={{ borderRadius: '9999px' }}
                            className="w-8 h-8 bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"
                          >
                            <UserX size={15} />
                          </div>
                        ) : (
                          <img
                            src={getAvatarUrl(row)}
                            alt={row.name}
                            style={{ borderRadius: '9999px' }}
                            className="w-8 h-8 object-cover ring-2 ring-zinc-100 dark:ring-white/10 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                            {row.name}
                          </p>
                          <p className="text-[10px] font-semibold text-zinc-400 truncate">
                            {weeklyUniqueTasks.size}{' '}
                            {weeklyUniqueTasks.size === 1 ? 'tarea' : 'tareas'} en semana
                          </p>
                        </div>
                      </div>

                      {!row.isUnassigned && (
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-100 dark:border-white/[0.05]">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">
                            Pico diario:
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${peakStatus.badgeClass}`}
                          >
                            {peakDailyLoad === 0 ? 'Sin carga' : `${peakDailyLoad}/día`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Day Cells */}
                    {weekDays.map(day => {
                      const key = getDayKey(day);
                      const cellEvents = dayMap?.get(key) || [];
                      return (
                        <DroppableTeamCell
                          key={`${row.id}:${key}`}
                          memberId={row.id}
                          day={day}
                          cellEvents={cellEvents}
                          overloadThreshold={overloadThreshold}
                          colorBy={colorBy}
                          onSelectEvent={onSelectEvent}
                          onDropUnscheduledCard={onDropUnscheduledCard}
                          onOpenQuickMenu={onOpenQuickMenu}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragEvent && (
          <div
            className="px-3 py-1.5 rounded-lg shadow-xl text-xs font-bold text-white flex items-center gap-2 pointer-events-none"
            style={{ backgroundColor: getEventAccentColor(activeDragEvent, colorBy) }}
          >
            <CalendarIcon size={13} />
            <span className="truncate max-w-[200px]">{activeDragEvent.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default LuminsCalendarTeamView;

