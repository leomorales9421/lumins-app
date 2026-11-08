import React, { useMemo, useRef } from 'react';
import {
  format,
  startOfDay,
  isToday,
  isTomorrow,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isBefore,
  isAfter,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  Lock,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  type CalendarCardEvent,
  type CalendarColorBy,
  PRIORITY_COLORS,
  getDayKey,
  getEventAccentColor,
  getEventDateRange,
  isCardCompleted,
  isEventOverdue,
} from '../../lib/calendar-utils';
import { getAvatarUrl } from './CalendarCardPreviewPopover';

interface LuminsCalendarAgendaViewProps {
  currentDate: Date;
  onChangeDate: (newDate: Date) => void;
  events: CalendarCardEvent[];
  colorBy: CalendarColorBy;
  onSelectEvent: (event: CalendarCardEvent) => void;
  onToggleDone: (event: CalendarCardEvent, e: React.MouseEvent) => void;
}

const LuminsCalendarAgendaView: React.FC<LuminsCalendarAgendaViewProps> = ({
  currentDate,
  onChangeDate,
  events,
  colorBy,
  onSelectEvent,
  onToggleDone,
}) => {
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const touchStartX = useRef<number | null>(null);

  // Week strip days around currentDate
  const weekStripDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Overdue open events (across workspace)
  const overdueEvents = useMemo(() => {
    return events
      .filter(ev => isEventOverdue(ev))
      .sort((a, b) => {
        const rangeA = getEventDateRange(a);
        const rangeB = getEventDateRange(b);
        return rangeA.end.getTime() - rangeB.end.getTime();
      });
  }, [events]);

  // Group events by calendar day in current month (plus current week if spanning outside month)
  const dayGroups = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const intervalStart = isBefore(weekStripDays[0], monthStart) ? weekStripDays[0] : monthStart;
    const intervalEnd = isAfter(weekStripDays[6], monthEnd) ? weekStripDays[6] : monthEnd;

    const allDays = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    const groups: Array<{ day: Date; key: string; items: CalendarCardEvent[] }> = [];

    for (const day of allDays) {
      const d = startOfDay(day);
      const matching = events.filter(ev => {
        const { start, end } = getEventDateRange(ev);
        return !isBefore(d, start) && !isAfter(d, end);
      });

      if (matching.length > 0 || isToday(d) || isSameDay(d, currentDate)) {
        groups.push({
          day: d,
          key: getDayKey(d),
          items: matching,
        });
      }
    }

    return groups;
  }, [currentDate, events, weekStripDays]);

  const eventsCountByDayKey = useMemo(() => {
    const map = new Map<string, CalendarCardEvent[]>();
    for (const d of weekStripDays) {
      const dayStart = startOfDay(d);
      const list = events.filter(ev => {
        const { start, end } = getEventDateRange(ev);
        return !isBefore(dayStart, start) && !isAfter(dayStart, end);
      });
      map.set(getDayKey(dayStart), list);
    }
    return map;
  }, [weekStripDays, events]);

  const handleSelectStripDay = (day: Date) => {
    onChangeDate(day);
    const key = getDayKey(day);
    const targetEl = dayRefs.current[key];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) > 55) {
      if (deltaX < 0) {
        onChangeDate(addWeeks(currentDate, 1));
      } else {
        onChangeDate(subWeeks(currentDate, 1));
      }
    }
  };

  const renderEventRow = (ev: CalendarCardEvent, contextKey: string) => {
    const props = ev.extendedProps;
    const done = isCardCompleted(ev);
    const overdue = isEventOverdue(ev);
    const accentColor = getEventAccentColor(ev, colorBy);
    const priorityInfo = PRIORITY_COLORS[props.priority || 'P2'] || PRIORITY_COLORS.P2;
    const { start, end, isMultiDay, durationDays } = getEventDateRange(ev);
    const hasChecklist = (props.checklistTotal || 0) > 0;
    const canEdit = props.canEdit !== false;

    return (
      <div
        key={`${contextKey}:${ev.id}`}
        onClick={() => onSelectEvent(ev)}
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: done ? '#10B981' : overdue ? '#EF4444' : accentColor,
        }}
        className={`flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer ${
          done
            ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] opacity-75'
            : overdue
            ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.1] hover:bg-rose-500/[0.08]'
            : 'bg-white dark:bg-[#1E222B] hover:bg-zinc-50/80 dark:hover:bg-white/[0.04]'
        }`}
      >
        {/* Left: Checkbox + Main info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {canEdit && (
            <button
              type="button"
              onClick={e => onToggleDone(ev, e)}
              title={done ? 'Reabrir tarea' : 'Marcar como lista'}
              style={{ borderRadius: '9999px' }}
              className={`mt-0.5 w-5 h-5 flex items-center justify-center border-2 transition-all shrink-0 ${
                done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-zinc-300 dark:border-white/25 text-zinc-300 dark:text-white/25 hover:border-emerald-500 hover:text-emerald-500'
              }`}
            >
              <Check size={11} strokeWidth={3} />
            </button>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: props.boardAccentColor || accentColor }}
              />
              <span className="truncate max-w-[160px] text-zinc-600 dark:text-zinc-300">
                {props.boardName}
              </span>
              <span>›</span>
              <span className="truncate max-w-[140px]">{props.listName}</span>

              {isMultiDay && (
                <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                  {format(start, 'd MMM', { locale: es })} – {format(end, 'd MMM', { locale: es })} ({durationDays}d)
                </span>
              )}
            </div>

            <h4
              className={`text-sm font-bold leading-snug break-words [overflow-wrap:anywhere] line-clamp-2 ${
                done
                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {ev.title}
            </h4>

            {/* Metadata tags */}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${priorityInfo.badgeClass}`}
              >
                {priorityInfo.label}
              </span>

              {props.blocked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold">
                  <Lock size={10} />
                  Bloqueada
                </span>
              )}

              {props.labels?.map(lbl => (
                <span
                  key={lbl.id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: lbl.color || '#6C5DD3' }}
                >
                  {lbl.name || 'Etiqueta'}
                </span>
              ))}

              {hasChecklist && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                  <CheckSquare size={11} />
                  {props.checklistCompleted}/{props.checklistTotal}
                </span>
              )}

              {(props.commentsCount || 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                  <MessageSquare size={11} />
                  {props.commentsCount}
                </span>
              )}

              {(props.attachmentsCount || 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                  <Paperclip size={11} />
                  {props.attachmentsCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Assignees */}
        {props.assignees && props.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5 shrink-0">
            {props.assignees.slice(0, 3).map(member => (
              <img
                key={member.id}
                src={getAvatarUrl(member)}
                alt={member.name}
                title={member.name}
                className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-[#1E222B] object-cover"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-[#181B22] rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-xs">
      {/* 1. Interactive / Swipeable Horizontal Week Strip (Requirement 1.19) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="px-2 sm:px-4 py-2.5 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#15181F] shrink-0 flex items-center gap-1.5"
      >
        <button
          type="button"
          onClick={() => onChangeDate(subWeeks(currentDate, 1))}
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors shrink-0"
          title="Semana anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="grid grid-cols-7 gap-1 flex-1">
          {weekStripDays.map(day => {
            const key = getDayKey(day);
            const dayItems = eventsCountByDayKey.get(key) || [];
            const selected = isSameDay(day, currentDate);
            const today = isToday(day);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectStripDay(day)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  selected
                    ? 'bg-[#6C5DD3] text-white shadow-sm shadow-[#6C5DD3]/30'
                    : today
                    ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#A599F9]'
                    : 'hover:bg-zinc-200/50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    selected ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {format(day, 'EEE', { locale: es }).slice(0, 3)}
                </span>
                <span className="text-sm font-black mt-0.5 leading-none">
                  {format(day, 'd')}
                </span>
                <div className="flex items-center gap-0.5 mt-1 h-1.5">
                  {dayItems.slice(0, 3).map(ev => (
                    <span
                      key={ev.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: selected
                          ? '#FFFFFF'
                          : getEventAccentColor(ev, colorBy),
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onChangeDate(addWeeks(currentDate, 1))}
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors shrink-0"
          title="Semana siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 2. Scrollable Chronological Agenda Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-6">
        {/* Overdue Section */}
        {overdueEvents.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle size={15} />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Vencidas requieren atención
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                {overdueEvents.length}
              </span>
            </div>
            <div className="space-y-2">
              {overdueEvents.map(ev => renderEventRow(ev, 'overdue'))}
            </div>
          </div>
        )}

        {/* Chronological Day Groups */}
        {dayGroups.map(group => {
          const today = isToday(group.day);
          const tomorrow = isTomorrow(group.day);
          const inCurrentMonth = isSameMonth(group.day, currentDate);

          return (
            <div
              key={group.key}
              ref={el => {
                dayRefs.current[group.key] = el;
              }}
              className={`space-y-2.5 ${!inCurrentMonth ? 'opacity-75' : ''}`}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between py-1.5 px-2 rounded-lg bg-zinc-100/90 dark:bg-[#1E222B]/95 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  {today && (
                    <span className="px-2 py-0.5 rounded-md bg-[#6C5DD3] text-white text-[10px] font-black uppercase tracking-wider">
                      Hoy
                    </span>
                  )}
                  {tomorrow && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-[#6C5DD3] dark:text-[#A599F9] text-[10px] font-black uppercase tracking-wider">
                      Mañana
                    </span>
                  )}
                  <h3 className="text-xs font-extrabold capitalize text-zinc-800 dark:text-zinc-200">
                    {format(group.day, "EEEE d 'de' MMMM", { locale: es })}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                  {group.items.length} {group.items.length === 1 ? 'tarea' : 'tareas'}
                </span>
              </div>

              {group.items.length === 0 ? (
                <div className="px-3 py-4 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 text-center text-xs font-semibold text-zinc-400 flex items-center justify-center gap-2">
                  <Sparkles size={14} className="text-[#6C5DD3]" />
                  <span>Día despejado sin entregas programadas</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {group.items.map(ev => renderEventRow(ev, group.key))}
                </div>
              )}
            </div>
          );
        })}

        {dayGroups.length === 0 && overdueEvents.length === 0 && (
          <div className="py-16 text-center space-y-2">
            <CalendarIcon size={32} className="mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
              No hay tareas con fecha en este periodo
            </p>
            <p className="text-xs text-zinc-400">
              Asigna fechas a tus tarjetas o ajusta los filtros activos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LuminsCalendarAgendaView;

