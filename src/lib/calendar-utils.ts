import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  differenceInCalendarDays,
  startOfDay,
  isBefore,
  isAfter,
  isSameDay,
  format,
} from 'date-fns';

export type CalendarViewMode = 'month' | 'week' | 'agenda' | 'team' | 'timeline';
export type CalendarColorBy = 'board' | 'priority' | 'label' | 'status';
export type TimelineScaleMode = 'week' | 'month' | 'quarter';
export type TimelineGroupBy = 'board' | 'list' | 'assignee';

export interface CalendarLabel {
  id: string;
  name: string;
  color: string;
}

export interface CalendarAssignee {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
}

export interface CalendarBoardListInfo {
  id: string;
  name: string;
  position: number;
}

export interface CalendarBoardInfo {
  id: string;
  name: string;
  background?: string | null;
  accentColor: string;
  canEdit: boolean;
  lists?: CalendarBoardListInfo[];
}

export interface CalendarWorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
}

export interface CalendarCardEvent {
  id: string;
  title: string;
  start: string | null;
  end?: string | null;
  backgroundColor: string;
  extendedProps: {
    boardId: string;
    boardName: string;
    boardBackground?: string | null;
    boardAccentColor?: string;
    listId?: string;
    listName: string;
    isDone?: boolean;
    isDueDateDone: boolean;
    priority?: 'P0' | 'P1' | 'P2' | 'P3' | string;
    blocked?: boolean;
    blockedReason?: string | null;
    checklistTotal?: number;
    checklistCompleted?: number;
    commentsCount?: number;
    attachmentsCount?: number;
    canEdit?: boolean;
    labels: CalendarLabel[];
    assignees: CalendarAssignee[];
    startDate: string | null;
    dueDate: string | null;
  };
}

export interface WeekEventSegment {
  event: CalendarCardEvent;
  startCol: number;
  endCol: number;
  span: number;
  laneIndex: number;
  isStart: boolean;
  isEnd: boolean;
  isMultiDay: boolean;
  durationDays: number;
}

export const BOARD_ACCENT_PALETTE = [
  '#6C5DD3', // Indigo / Lumins Primary
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#6366F1', // Indigo 500
  '#84CC16', // Lime
];

export const PRIORITY_COLORS: Record<string, { hex: string; label: string; badgeClass: string }> = {
  P0: {
    hex: '#EF4444',
    label: 'P0 · Crítica',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  P1: {
    hex: '#F97316',
    label: 'P1 · Alta',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  P2: {
    hex: '#3B82F6',
    label: 'P2 · Media',
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  P3: {
    hex: '#64748B',
    label: 'P3 · Baja',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
};

export function resolveBoardAccentColor(boardId: string, background?: string | null): string {
  if (background) {
    if (background.includes('cyan') || background.includes('sky')) return '#0EA5E9';
    if (background.includes('emerald') || background.includes('teal')) return '#10B981';
    if (background.includes('amber') || background.includes('yellow')) return '#F59E0B';
    if (background.includes('orange')) return '#F97316';
    if (background.includes('rose') || background.includes('pink')) return '#EC4899';
    if (background.includes('red')) return '#EF4444';
    if (background.includes('fuchsia') || background.includes('purple')) return '#8B5CF6';
    if (background.includes('lime')) return '#84CC16';
    if (background.includes('blue')) return '#3B82F6';
    if (background.includes('indigo')) return '#6C5DD3';
  }
  let hash = 0;
  const key = boardId || 'default';
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return BOARD_ACCENT_PALETTE[hash % BOARD_ACCENT_PALETTE.length];
}

/**
 * Normalizes a date string or Date into a timezone-safe local start-of-day Date.
 * Prevents ±1 day shifts when dates are stored at 00:00:00.000Z or across timezones.
 */
export function parseCalendarDate(raw: string | Date | null | undefined): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : startOfDay(raw);
  }
  const str = String(raw).trim();
  // Pure YYYY-MM-DD or exact UTC midnight YYYY-MM-DDT00:00:00.000Z
  const utcMidnightMatch = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z)?$/.exec(str);
  if (utcMidnightMatch) {
    const year = Number(utcMidnightMatch[1]);
    const month = Number(utcMidnightMatch[2]) - 1;
    const day = Number(utcMidnightMatch[3]);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

/**
 * Serializes a calendar day at 12:00 local time so that any timezone parsing it
 * preserves the exact calendar date (YYYY-MM-DD) without shifting.
 */
export function toSafeCalendarISO(date: Date): string {
  const safe = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  return safe.toISOString();
}

export function getDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isCardCompleted(event: CalendarCardEvent): boolean {
  const props = event.extendedProps;
  if (typeof props.isDone === 'boolean') {
    return props.isDone || Boolean(props.isDueDateDone);
  }
  const listName = (props.listName || '').toLowerCase().trim();
  return Boolean(props.isDueDateDone || listName === 'done' || listName === 'hecho');
}

export function getEventDateRange(event: CalendarCardEvent): {
  start: Date;
  end: Date;
  isMultiDay: boolean;
  durationDays: number;
} {
  const rawStart = parseCalendarDate(event.extendedProps?.startDate || event.start);
  const rawEnd = parseCalendarDate(event.extendedProps?.dueDate || event.end || event.start);

  const fallback = startOfDay(new Date());
  let start = rawStart || rawEnd || fallback;
  let end = rawEnd || rawStart || fallback;

  if (isAfter(start, end)) {
    const temp = start;
    start = end;
    end = temp;
  }

  const durationDays = differenceInCalendarDays(end, start) + 1;
  return {
    start,
    end,
    isMultiDay: durationDays > 1,
    durationDays,
  };
}

export function isEventOverdue(event: CalendarCardEvent, todayDate: Date = startOfDay(new Date())): boolean {
  if (isCardCompleted(event)) return false;
  const { end } = getEventDateRange(event);
  return isBefore(end, startOfDay(todayDate));
}

export function getEventAccentColor(
  event: CalendarCardEvent,
  colorBy: CalendarColorBy,
  todayDate: Date = startOfDay(new Date())
): string {
  const props = event.extendedProps;
  const boardColor =
    props.boardAccentColor ||
    resolveBoardAccentColor(props.boardId, props.boardBackground) ||
    event.backgroundColor ||
    '#6C5DD3';

  switch (colorBy) {
    case 'priority': {
      const p = props.priority || 'P2';
      return PRIORITY_COLORS[p]?.hex || '#3B82F6';
    }
    case 'label': {
      return props.labels?.[0]?.color || boardColor;
    }
    case 'status': {
      if (isCardCompleted(event)) return '#10B981';
      if (props.blocked) return '#F59E0B';
      if (isEventOverdue(event, todayDate)) return '#EF4444';
      return '#6C5DD3';
    }
    case 'board':
    default:
      return boardColor;
  }
}

/**
 * Generates the matrix of weeks for a given month.
 * Starts weeks on Monday (weekStartsOn: 1) so hiding weekends cleanly leaves Mon-Fri.
 */
export function buildMonthWeeks(currentDate: Date, hideWeekends: boolean): Date[][] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks: Date[][] = [];

  for (let i = 0; i < allDays.length; i += 7) {
    const weekSlice = allDays.slice(i, i + 7);
    const filteredWeek = hideWeekends ? weekSlice.slice(0, 5) : weekSlice;
    weeks.push(filteredWeek);
  }

  return weeks;
}

export function buildWeekDays(currentDate: Date, hideWeekends: boolean): Date[] {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  return hideWeekends ? days.slice(0, 5) : days;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

/**
 * Segments all events that intersect with a given week row into horizontal lanes (`laneIndex`).
 * Multi-day events are placed first so continuous bars align seamlessly across days.
 */
export function segmentEventsForWeek(
  events: CalendarCardEvent[],
  weekDays: Date[]
): {
  segments: WeekEventSegment[];
  lanesCount: number;
  eventsByDayKey: Map<string, CalendarCardEvent[]>;
} {
  if (weekDays.length === 0) {
    return { segments: [], lanesCount: 0, eventsByDayKey: new Map() };
  }

  const weekStart = startOfDay(weekDays[0]);
  const weekEnd = startOfDay(weekDays[weekDays.length - 1]);
  const eventsByDayKey = new Map<string, CalendarCardEvent[]>();

  for (const day of weekDays) {
    eventsByDayKey.set(getDayKey(day), []);
  }

  const rawSegments: Omit<WeekEventSegment, 'laneIndex'>[] = [];

  for (const event of events) {
    const { start, end, isMultiDay, durationDays } = getEventDateRange(event);

    // Check if event overlaps with [weekStart, weekEnd]
    if (isAfter(start, weekEnd) || isBefore(end, weekStart)) {
      continue;
    }

    // Populate daily map for "+N more" popover & mobile dots
    for (let col = 0; col < weekDays.length; col++) {
      const d = startOfDay(weekDays[col]);
      if (!isBefore(d, start) && !isAfter(d, end)) {
        const key = getDayKey(d);
        eventsByDayKey.get(key)?.push(event);
      }
    }

    const clampedStart = isBefore(start, weekStart) ? weekStart : start;
    const clampedEnd = isAfter(end, weekEnd) ? weekEnd : end;

    let startCol = weekDays.findIndex(d => isSameDay(d, clampedStart));
    let endCol = weekDays.findIndex(d => isSameDay(d, clampedEnd));

    if (startCol === -1) startCol = 0;
    if (endCol === -1) endCol = weekDays.length - 1;
    if (endCol < startCol) endCol = startCol;

    const span = endCol - startCol + 1;

    rawSegments.push({
      event,
      startCol,
      endCol,
      span,
      isStart: !isBefore(start, weekStart),
      isEnd: !isAfter(end, weekEnd),
      isMultiDay,
      durationDays,
    });
  }

  // Sort segments:
  // 1. Earlier start column
  // 2. Longer span first (so multi-day bars sit on top lanes cleanly)
  // 3. Multi-day before single-day
  // 4. Priority (P0 -> P3)
  // 5. Title alphabetical
  rawSegments.sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    if (b.span !== a.span) return b.span - a.span;
    if (a.isMultiDay !== b.isMultiDay) return a.isMultiDay ? -1 : 1;
    const pA = PRIORITY_WEIGHT[a.event.extendedProps.priority || 'P2'] ?? 2;
    const pB = PRIORITY_WEIGHT[b.event.extendedProps.priority || 'P2'] ?? 2;
    if (pA !== pB) return pA - pB;
    return a.event.title.localeCompare(b.event.title);
  });

  // Greedy lane allocation
  // lanesOccupancy[laneIndex] = boolean[weekDays.length]
  const lanesOccupancy: boolean[][] = [];
  const placedSegments: WeekEventSegment[] = [];

  for (const seg of rawSegments) {
    let assignedLane = -1;

    for (let l = 0; l < lanesOccupancy.length; l++) {
      let free = true;
      for (let c = seg.startCol; c <= seg.endCol; c++) {
        if (lanesOccupancy[l][c]) {
          free = false;
          break;
        }
      }
      if (free) {
        assignedLane = l;
        break;
      }
    }

    if (assignedLane === -1) {
      assignedLane = lanesOccupancy.length;
      lanesOccupancy.push(new Array(weekDays.length).fill(false));
    }

    for (let c = seg.startCol; c <= seg.endCol; c++) {
      lanesOccupancy[assignedLane][c] = true;
    }

    placedSegments.push({
      ...seg,
      laneIndex: assignedLane,
    });
  }

  return {
    segments: placedSegments,
    lanesCount: lanesOccupancy.length,
    eventsByDayKey,
  };
}

