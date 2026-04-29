import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Paperclip, CheckSquare, Eye, AlignLeft, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Card } from '../../types/board';
import UserAvatar from '../ui/UserAvatar';

interface SortableCardProps {
  card: Card;
  onClick: () => void;
}

const PRIORITY_BORDER: Record<string, string> = {
  P0: 'priority-p0',
  P1: 'priority-p1',
  P2: 'priority-p2',
  P3: 'priority-p3',
};

const PRIORITY_DOT: Record<string, string> = {
  P0: '#EF4444',
  P1: '#F97316',
  P2: '#EAB308',
  P3: '#94A3B8',
};

export const SortableCard: React.FC<SortableCardProps> = ({ card, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: 'none',
  };

  const checklistItems = card.checklists?.flatMap(cl => cl.items) || [];
  const totalItems = checklistItems.length;
  const doneItems = checklistItems.filter(i => i.done).length;
  const checklistPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const isOverdue = card.dueDate ? new Date(card.dueDate) < new Date() : false;
  const priorityClass = card.priority ? PRIORITY_BORDER[card.priority] : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cu-card ${priorityClass} cursor-grab active:cursor-grabbing group
        ${isDragging ? 'opacity-50 scale-105 shadow-card-hover z-50' : ''}
      `}
    >
      <div className="px-2.5 pt-2.5 pb-2 flex flex-col gap-2">

        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.map((item: any, idx: number) => (
              <span
                key={item.label?.id || idx}
                title={item.label?.name}
                style={{ backgroundColor: item.label?.color }}
                className="w-8 h-2 rounded-full inline-block shadow-sm"
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-[#6C5DD3] transition-colors">
          {card.title}
        </p>

        {/* Checklist progress bar */}
        {totalItems > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-zinc-100 dark:bg-white/5 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all ${doneItems === totalItems ? 'bg-emerald-500' : 'bg-[#6C5DD3]'}`}
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold ${doneItems === totalItems ? 'text-emerald-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
              {checklistPct}%
            </span>
          </div>
        )}

        {/* Footer: metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-wrap">

            {/* Due date */}
            {card.dueDate && (
              <span
                className={`flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5 ${
                  isOverdue
                    ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
                title={isOverdue ? 'Vencido' : 'Fecha de vencimiento'}
              >
                <Clock size={11} strokeWidth={2.5} />
                {format(parseISO(card.dueDate), 'd MMM', { locale: es })}
              </span>
            )}

            {/* Comments */}
            {(card._count?.comments || 0) > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400" title="Comentarios">
                <MessageSquare size={11} strokeWidth={2.5} />
                {card._count?.comments}
              </span>
            )}

            {/* Attachments */}
            {(card._count?.attachments || 0) > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400" title="Adjuntos">
                <Paperclip size={11} strokeWidth={2.5} />
                {card._count?.attachments}
              </span>
            )}

            {/* Checklist count */}
            {totalItems > 0 && (
              <span
                className={`flex items-center gap-1 text-[11px] font-medium ${doneItems === totalItems ? 'text-emerald-600' : 'text-zinc-500 dark:text-zinc-400'}`}
                title="Checklist"
              >
                <CheckSquare size={11} strokeWidth={2.5} />
                {doneItems}/{totalItems}
              </span>
            )}

            {/* Description indicator */}
            {card.description && (
              <span className="text-zinc-400 dark:text-zinc-500" title="Tiene descripción">
                <AlignLeft size={11} strokeWidth={2.5} />
              </span>
            )}
          </div>

          {/* Right: Priority dot + Assignees */}
          <div className="flex items-center gap-1.5">
            {/* Priority dot */}
            {card.priority && (
              <span
                title={`Prioridad ${card.priority}`}
                style={{ backgroundColor: PRIORITY_DOT[card.priority] || '#94A3B8' }}
                className="w-2 h-2 rounded flex-shrink-0"
              />
            )}

            {/* Assignees */}
            <div className="flex -space-x-1.5">
              {card.assignees && card.assignees.length > 0 ? (
                card.assignees.slice(0, 4).map((assignee: any, idx: number) => (
                  <div
                    key={assignee.user?.id || `assignee-${idx}`}
                    title={assignee.user?.name}
                    className="w-5 h-5 rounded border border-white dark:border-[#1C1F26] shadow-sm transition-transform hover:scale-110"
                  >
                    <UserAvatar 
                      name={assignee.user?.name || 'Usuario'} 
                      avatarUrl={assignee.user?.avatarUrl} 
                      size="xs"
                    />
                  </div>
                ))
              ) : (
                <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center">
                  <Eye size={9} className="text-zinc-400 dark:text-zinc-500" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
