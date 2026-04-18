import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white p-5 rounded-xl shadow-soft border border-[#7A5AF8]/5 cursor-grab active:cursor-grabbing
        group hover:border-[#7A5AF8]/30 hover:shadow-heavy transition-all duration-300
        ${isDragging ? 'opacity-50 ring-2 ring-[#7A5AF8] shadow-2xl scale-105 z-50' : ''}
      `}
    >
      <div className="flex flex-col gap-4">
        {/* Card Header: Tags (Manrope Labels) */}
        <div className="flex flex-wrap gap-2">
           {card.labels && card.labels.length > 0 ? (
             card.labels.map((label, idx) => (
               <span 
                 key={idx} 
                 className="px-2.5 py-1 rounded-md bg-[#7A5AF8]/10 text-[#7A5AF8] text-[9px] font-extrabold uppercase tracking-widest"
               >
                 {label.name}
               </span>
             ))
           ) : (
             <div className="h-1 w-8 bg-[#F3E8FF] rounded-full" />
           )}
        </div>

        {/* Card Title (Manrope Body) */}
        <h4 className="text-sm font-bold text-[#100B26] leading-relaxed group-hover:text-[#7A5AF8] transition-colors">
          {card.title}
        </h4>

        {/* Card Footer: Metadata (Neutral Colors) */}
        <div className="flex items-center justify-between mt-1">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-[#806F9B]/60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {card.commentsCount || 0}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-[#806F9B]/60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                {card.attachmentsCount || 0}
              </div>
           </div>

           <div className="w-6 h-6 rounded-md bg-[#F3E8FF] flex items-center justify-center text-[9px] font-black text-[#7A5AF8] border border-white shadow-sm">
              {card.members && card.members[0] ? card.members[0].name[0] : 'U'}
           </div>
        </div>
      </div>
    </div>
  );
};
