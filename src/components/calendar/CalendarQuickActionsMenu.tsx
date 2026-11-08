import React, { useEffect, useRef } from 'react';
import { addDays, nextMonday, startOfDay } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Flag,
  UserPlus,
  Calendar as CalendarIcon,
  CalendarOff,
  Archive,
  ExternalLink,
  Eye,
  Check,
} from 'lucide-react';
import {
  type CalendarCardEvent,
  type CalendarWorkspaceMember,
  PRIORITY_COLORS,
  isCardCompleted,
} from '../../lib/calendar-utils';
import { getAvatarUrl } from './CalendarCardPreviewPopover';

interface CalendarQuickActionsMenuProps {
  event: CalendarCardEvent;
  position: { x: number; y: number };
  members: CalendarWorkspaceMember[];
  onClose: () => void;
  onOpenDetail: (event: CalendarCardEvent) => void;
  onOpenBoard: (boardId: string) => void;
  onToggleDone: (event: CalendarCardEvent) => void;
  onChangePriority: (event: CalendarCardEvent, priority: 'P0' | 'P1' | 'P2' | 'P3') => void;
  onToggleAssignee: (event: CalendarCardEvent, member: CalendarWorkspaceMember) => void;
  onQuickMoveDate: (event: CalendarCardEvent, targetDate: Date) => void;
  onRemoveDate: (event: CalendarCardEvent) => void;
  onRequestArchive: (event: CalendarCardEvent) => void;
}

const CalendarQuickActionsMenu: React.FC<CalendarQuickActionsMenuProps> = ({
  event,
  position,
  members,
  onClose,
  onOpenDetail,
  onOpenBoard,
  onToggleDone,
  onChangePriority,
  onToggleAssignee,
  onQuickMoveDate,
  onRemoveDate,
  onRequestArchive,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const props = event.extendedProps;
  const done = isCardCompleted(event);
  const canEdit = props.canEdit !== false;
  const currentPriority = (props.priority || 'P2') as 'P0' | 'P1' | 'P2' | 'P3';

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const menuWidth = 248;
  const menuHeight = 420;

  const left = Math.max(12, Math.min(position.x, viewportWidth - menuWidth - 12));
  const top = Math.max(12, Math.min(position.y, viewportHeight - menuHeight - 12));

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const upcomingMonday = nextMonday(today);

  return (
    <div
      ref={menuRef}
      style={{ top, left, width: menuWidth }}
      className="fixed z-[135] bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/90 dark:border-white/10 shadow-2xl py-1.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={e => e.stopPropagation()}
    >
      {/* Card title header */}
      <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-white/[0.06]">
        <p className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
          {event.title}
        </p>
        <p className="text-[10px] font-semibold text-zinc-400 truncate">
          {props.boardName} › {props.listName}
        </p>
      </div>

      {/* View actions */}
      <div className="py-1 border-b border-zinc-100 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => {
            onOpenDetail(event);
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center gap-2 text-left font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
        >
          <Eye size={13} className="text-zinc-400" />
          Abrir detalle completo
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenBoard(props.boardId);
            onClose();
          }}
          className="w-full px-3 py-1.5 flex items-center gap-2 text-left font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
        >
          <ExternalLink size={13} className="text-zinc-400" />
          Ir al tablero
        </button>
      </div>

      {canEdit && (
        <>
          {/* Toggle Done */}
          <div className="py-1 border-b border-zinc-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                onToggleDone(event);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-left font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
            >
              {done ? (
                <>
                  <Circle size={13} className="text-zinc-400" />
                  Marcar como pendiente
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Marcar como lista
                </>
              )}
            </button>
          </div>

          {/* Priority Quick Selector */}
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
              <Flag size={11} />
              Prioridad
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['P0', 'P1', 'P2', 'P3'] as const).map(p => {
                const info = PRIORITY_COLORS[p];
                const active = currentPriority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onChangePriority(event, p);
                      onClose();
                    }}
                    className={`py-1 rounded-md text-[10px] font-extrabold border transition-all flex items-center justify-center gap-1 ${
                      active
                        ? info.badgeClass
                        : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: info.hex }}
                    />
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Reschedule */}
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
              <CalendarIcon size={11} />
              Mover fecha a
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  onQuickMoveDate(event, today);
                  onClose();
                }}
                className="py-1 px-1.5 rounded-md bg-zinc-50 dark:bg-white/[0.04] hover:bg-[#6C5DD3]/10 hover:text-[#6C5DD3] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/10 transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickMoveDate(event, tomorrow);
                  onClose();
                }}
                className="py-1 px-1.5 rounded-md bg-zinc-50 dark:bg-white/[0.04] hover:bg-[#6C5DD3]/10 hover:text-[#6C5DD3] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/10 transition-colors"
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickMoveDate(event, upcomingMonday);
                  onClose();
                }}
                className="py-1 px-1.5 rounded-md bg-zinc-50 dark:bg-white/[0.04] hover:bg-[#6C5DD3]/10 hover:text-[#6C5DD3] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-white/10 transition-colors"
              >
                Próx. Lun
              </button>
            </div>

            {(props.startDate || props.dueDate) && (
              <button
                type="button"
                onClick={() => {
                  onRemoveDate(event);
                  onClose();
                }}
                className="w-full mt-1 py-1 px-2 rounded-md flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <CalendarOff size={12} />
                Quitar fecha (Enviar a Sin fecha)
              </button>
            )}
          </div>

          {/* Assignees Quick Toggle */}
          {members.length > 0 && (
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                <UserPlus size={11} />
                Asignados
              </div>
              <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-0.5">
                {members.map(m => {
                  const isAssigned = props.assignees?.some(a => a.id === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onToggleAssignee(event, m)}
                      className="w-full px-1.5 py-1 rounded-md flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.05] text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={getAvatarUrl(m)}
                          alt={m.name}
                          style={{ borderRadius: '9999px' }}
                          className="w-4 h-4 object-cover shrink-0"
                        />
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 truncate">
                          {m.name}
                        </span>
                      </div>
                      {isAssigned && <Check size={12} className="text-[#6C5DD3] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Archive (uses global ConfirmActionModal) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onRequestArchive(event);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-left font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Archive size={13} />
              Archivar tarjeta
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarQuickActionsMenu;

