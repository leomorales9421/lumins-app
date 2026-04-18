import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../../types/board';
import { SortableCard } from './SortableCard';

interface SortableListProps {
  list: {
    id: string;
    title: string;
    cards?: CardType[];
  };
  onCardClick: (cardId: string) => void;
}

export const SortableList: React.FC<SortableListProps> = ({ list, onCardClick }) => {
  const cards = list.cards || [];
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'list',
      list: { ...list, cards },
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
      className={`
        flex flex-col w-[340px] max-h-full bg-white/80 rounded-2xl border border-[#7A5AF8]/10 shadow-soft flex-shrink-0 transition-all
        ${isDragging ? 'opacity-50 ring-2 ring-[#7A5AF8] z-50' : ''}
      `}
    >
      {/* List Header: Identity Style */}
      <div 
        {...attributes} 
        {...listeners} 
        className="p-7 flex items-center justify-between cursor-grab active:cursor-grabbing group"
      >
        <div className="flex items-center gap-4">
           <div className="w-1.5 h-6 bg-gradient-to-b from-[#7A5AF8] to-[#E91E63] rounded-full" />
           <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest truncate max-w-[180px]">
             {list.title}
           </h3>
           <span className="px-3 py-1 rounded-md bg-[#7A5AF8]/5 text-[#7A5AF8] text-[10px] font-black">
             {cards.length}
           </span>
        </div>
        
        <button className="text-zinc-300 hover:text-[#7A5AF8] transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>

      {/* Cards Area: Manrope Labels */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 flex flex-col gap-4 min-h-[100px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard 
              key={card.id} 
              card={card} 
              onClick={() => onCardClick(card.id)} 
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Footer */}
      <div className="p-5 mt-auto">
        <button className="w-full h-12 rounded-xl bg-white border border-zinc-100 text-[#7A5AF8] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#7A5AF8] hover:text-white transition-all shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Añadir Despliegue
        </button>
      </div>
    </div>
  );
};
