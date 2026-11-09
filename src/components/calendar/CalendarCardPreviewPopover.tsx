import React from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Lock,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Layers,
  ExternalLink,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  type CalendarCardEvent,
  type CalendarColorBy,
  PRIORITY_COLORS,
  getEventAccentColor,
  getEventDateRange,
  isCardCompleted,
  isEventOverdue,
  formatTime12h,
} from '../../lib/calendar-utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface CalendarCardPreviewPopoverProps {
  event: CalendarCardEvent;
  colorBy: CalendarColorBy;
  onOpenDetail: (event: CalendarCardEvent) => void;
  onToggleDone?: (event: CalendarCardEvent, e: React.MouseEvent) => void;
}

export const getAvatarUrl = (user: { name: string; avatarUrl?: string | null }) => {
  if (user.avatarUrl) {
    if (user.avatarUrl.startsWith('http')) return user.avatarUrl;
    return `${API_BASE_URL}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=6C5DD3&color=fff`;
};

const CalendarCardPreviewPopover: React.FC<CalendarCardPreviewPopoverProps> = ({
  event,
  colorBy,
  onOpenDetail,
  onToggleDone,
}) => {
  const props = event.extendedProps;
  const isDone = isCardCompleted(event);
  const isOverdue = isEventOverdue(event);
  const accentColor = getEventAccentColor(event, colorBy);
  const { start, end, isMultiDay, durationDays } = getEventDateRange(event);
  const priorityInfo = PRIORITY_COLORS[props.priority || 'P2'] || PRIORITY_COLORS.P2;

  const timeSuffix = props.dueDate ? ` · ${formatTime12h(props.dueDate)}` : '';
  const dateText = isMultiDay
    ? `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })} (${durationDays} días)${timeSuffix}`
    : `${format(end, "EEEE d 'de' MMMM", { locale: es })}${timeSuffix}`;

  const hasChecklist = (props.checklistTotal || 0) > 0;
  const checklistPct = hasChecklist
    ? Math.round(((props.checklistCompleted || 0) / (props.checklistTotal || 1)) * 100)
    : 0;

  return (
    <div
      className="w-80 bg-white dark:bg-[#1C1F26] rounded-xl shadow-2xl border border-zinc-200/90 dark:border-white/10 overflow-hidden text-left z-[120] select-none"
      onClick={e => e.stopPropagation()}
    >
      {/* Top Color Accent Strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-3.5 space-y-3">
        {/* Board › List Breadcrumb + Status Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: props.boardAccentColor || accentColor }}
            />
            <span className="truncate">{props.boardName}</span>
            <span className="text-zinc-300 dark:text-zinc-600">›</span>
            <span className="truncate text-zinc-700 dark:text-zinc-300">{props.listName}</span>
          </div>

          {isDone ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={11} />
              Hecha
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertCircle size={11} />
              Vencida
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h4
          className={`text-sm font-bold leading-snug break-words [overflow-wrap:anywhere] line-clamp-3 ${
            isDone
              ? 'line-through text-zinc-400 dark:text-zinc-500'
              : 'text-zinc-900 dark:text-zinc-100'
          }`}
        >
          {event.title}
        </h4>

        {/* Blocked Banner */}
        {props.blocked && (
          <div className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px]">
            <Lock size={13} className="shrink-0 mt-0.5 text-amber-500" />
            <div className="min-w-0">
              <span className="font-extrabold">Bloqueada</span>
              {props.blockedReason && (
                <p className="text-[10px] opacity-90 line-clamp-2 mt-0.5">{props.blockedReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Date & Priority Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold capitalize">
            <CalendarIcon size={12} className="text-[#6C5DD3]" />
            <span>{dateText}</span>
          </div>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${priorityInfo.badgeClass}`}
          >
            {priorityInfo.label}
          </span>
        </div>

        {/* Labels */}
        {props.labels && props.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {props.labels.map(label => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: label.color || '#6C5DD3' }}
              >
                {label.name || 'Etiqueta'}
              </span>
            ))}
          </div>
        )}

        {/* Checklist & Counters */}
        {(hasChecklist || (props.commentsCount || 0) > 0 || (props.attachmentsCount || 0) > 0) && (
          <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-white/5">
            {hasChecklist && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <CheckSquare size={12} className="text-[#6C5DD3]" />
                    Checklist
                  </span>
                  <span>
                    {props.checklistCompleted}/{props.checklistTotal} ({checklistPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      checklistPct === 100 ? 'bg-emerald-500' : 'bg-[#6C5DD3]'
                    }`}
                    style={{ width: `${checklistPct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {(props.commentsCount || 0) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={12} />
                  {props.commentsCount}
                </span>
              )}
              {(props.attachmentsCount || 0) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip size={12} />
                  {props.attachmentsCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Assignees */}
        {props.assignees && props.assignees.length > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Asignados
            </span>
            <div className="flex items-center -space-x-1.5">
              {props.assignees.slice(0, 5).map(member => (
                <img
                  key={member.id}
                  src={getAvatarUrl(member)}
                  alt={member.name}
                  title={member.name}
                  className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#1C1F26] object-cover"
                />
              ))}
              {props.assignees.length > 5 && (
                <span className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1C1F26]">
                  +{props.assignees.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
          {props.canEdit !== false && onToggleDone ? (
            <button
              type="button"
              onClick={e => onToggleDone(event, e)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isDone
                  ? 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <Check size={13} strokeWidth={2.5} />
              {isDone ? 'Reabrir' : 'Marcar lista'}
            </button>
          ) : (
            <span className="text-[10px] font-semibold text-zinc-400 inline-flex items-center gap-1">
              <Layers size={11} />
              Solo lectura
            </span>
          )}

          <button
            type="button"
            onClick={() => onOpenDetail(event)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#8E82E3] hover:bg-[#6C5DD3] hover:text-white transition-colors ml-auto"
          >
            <span>Abrir tarjeta</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarCardPreviewPopover;

