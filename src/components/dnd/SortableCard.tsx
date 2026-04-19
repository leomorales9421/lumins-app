import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Paperclip, CheckSquare, Eye, AlignLeft, Clock, Zap, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Card } from '../../types/board';

interface SortableCardProps {
  card: Card;
  onClick: () => void;
}

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
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // Calculate checklist progress
  const checklistItems = card.checklists?.flatMap(cl => cl.items) || [];
  const totalItems = checklistItems.length;
  const doneItems = checklistItems.filter(i => i.done).length;

  const isOverdue = card.dueDate ? new Date(card.dueDate) < new Date() : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white p-5 rounded-xl border border-[#7A5AF8]/5 cursor-grab active:cursor-grabbing
        group hover:border-[#7A5AF8]/30 hover:shadow-heavy transition-all duration-300
        ${isDragging ? 'rotate-2 scale-105 shadow-xl border-[#7A5AF8] z-50 bg-white' : 'shadow-sm'}
      `}
    >
      <div className="flex flex-col gap-4">
        {/* Card Header: Labels (Vibrant Matte Mini Bars) */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((item: any, idx: number) => (
              <div 
                key={item.label?.id || idx} 
                title={item.label?.name}
                style={{ backgroundColor: item.label?.color }}
                className="w-10 h-2 rounded-full cursor-help shadow-sm transition-transform hover:scale-110"
              />
            ))}
          </div>
        )}

        {/* Card Title (Manrope Body) */}
        <h4 className="text-sm font-bold text-[#100B26] leading-relaxed group-hover:text-[#7A5AF8] transition-colors">
          {card.title}
        </h4>

        {/* Card Footer: Metadata (Vibrant Matte Style) */}
        <div className="flex items-center justify-between mt-1">
           <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
              {/* Due Date Badge */}
              {card.dueDate && (
                <div 
                  className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md transition-all ${
                    isOverdue 
                      ? 'bg-red-500 text-white shadow-sm' 
                      : 'text-[#806F9B] hover:bg-slate-50 hover:text-[#7A5AF8]'
                  }`}
                  title={isOverdue ? 'Vencido' : 'Fecha de vencimiento'}
                >
                  <Clock size={12} strokeWidth={3} />
                  <span>{format(parseISO(card.dueDate), 'd MMM', { locale: es })}</span>
                </div>
              )}

              {/* Watching (Mock) */}
              <div className="flex items-center gap-1 text-[10px] font-black text-[#806F9B] hover:text-[#7A5AF8] transition-colors cursor-help" title="Siguiendo">
                <Eye size={12} strokeWidth={3} />
              </div>

              {/* Priority Badge */}
              {card.priority && card.priority !== 'P3' && (
                <div 
                  className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md border shadow-sm transition-all ${
                    card.priority === 'P0' ? 'bg-red-50 text-red-600 border-red-100' : 
                    card.priority === 'P1' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}
                  title={`Prioridad: ${card.priority}`}
                >
                  <Zap size={10} strokeWidth={4} fill="currentColor" />
                  <span>{card.priority}</span>
                </div>
              )}

              {/* Risk Level Badge */}
              {card.riskLevel && card.riskLevel !== 'low' && (
                <div 
                  className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md border shadow-sm transition-all ${
                    card.riskLevel === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 
                    'bg-orange-50 text-orange-600 border-orange-100'
                  }`}
                  title={`Riesgo: ${card.riskLevel === 'high' ? 'ALTO' : 'MED'}`}
                >
                  <AlertCircle size={10} strokeWidth={4} />
                  <span>{card.riskLevel === 'high' ? 'ALTO' : 'MED'}</span>
                </div>
              )}

              {/* Description */}
              {card.description && (
                <div className="flex items-center gap-1 text-[10px] font-black text-[#806F9B]" title="Tiene descripción">
                  <AlignLeft size={12} strokeWidth={3} />
                </div>
              )}

              {/* Comments */}
              {(card._count?.comments || 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-black text-[#806F9B]" title="Comentarios">
                  <MessageSquare size={12} strokeWidth={3} />
                  <span>{card._count?.comments}</span>
                </div>
              )}

              {/* Attachments */}
              {(card._count?.attachments || 0) > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-black text-[#806F9B]" title="Adjuntos">
                  <Paperclip size={12} strokeWidth={3} />
                  <span>{card._count?.attachments}</span>
                </div>
              )}

              {/* Checklist Progress */}
              {totalItems > 0 && (
                <div 
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black transition-colors ${
                    doneItems === totalItems 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-[#806F9B] hover:bg-slate-50'
                  }`}
                  title="Progreso de checklist"
                >
                  <CheckSquare size={12} strokeWidth={3} />
                  <span>{doneItems}/{totalItems}</span>
                </div>
              )}
           </div>

           <div className="flex -space-x-1 items-center">
             {card.assignees && card.assignees.length > 0 ? (
               card.assignees.map((assignee: any, idx: number) => (
                 <div 
                   key={assignee.user.id || idx}
                   title={assignee.user.name}
                   className="w-6 h-6 rounded-full bg-[#7A5AF8] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ring-1 ring-purple-50 transition-transform hover:scale-110 hover:z-10 cursor-help"
                 >
                   {assignee.user.name ? assignee.user.name[0].toUpperCase() : 'U'}
                 </div>
               ))
             ) : (
               <div className="w-6 h-6 rounded-md bg-[#F3E8FF] flex items-center justify-center text-[9px] font-black text-[#7A5AF8] border border-white shadow-sm">
                 U
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
