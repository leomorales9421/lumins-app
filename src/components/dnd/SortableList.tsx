import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../../types/board';
import { SortableCard } from './SortableCard';

interface SortableListProps {
  list: {
    id: string;
    name?: string;
    title?: string;
    cards?: CardType[];
  };
  onCardClick: (cardId: string) => void;
  onAddCard?: (listId: string, title: string) => void;
}

export const SortableList: React.FC<SortableListProps> = ({ list, onCardClick, onAddCard }) => {
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [newCardTitle, setNewCardTitle] = React.useState('');
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

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim() && onAddCard) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleCancel = () => {
    setIsAddingCard(false);
    setNewCardTitle('');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        h-fit max-h-full flex flex-col w-[340px] bg-white/80 rounded-2xl border border-[#7A5AF8]/10 shadow-soft flex-shrink-0 transition-all
        ${isDragging ? 'opacity-50 ring-2 ring-[#7A5AF8] z-50' : ''}
      `}
    >
      {/* List Header: Identity Style */}
      <div 
        {...attributes} 
        {...listeners} 
        className="p-4 pb-2 flex items-center justify-between cursor-grab active:cursor-grabbing group"
      >
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-6 bg-gradient-to-b from-[#7A5AF8] to-[#E91E63] rounded-full" />
           <h3 className="font-extrabold text-zinc-900 text-sm truncate max-w-[180px]">
             {list.name || list.title}
           </h3>
           <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#7A5AF8]/5 text-[#7A5AF8] text-[10px] font-black">
             {cards.length}
           </div>
        </div>
        
        <button className="text-slate-400 hover:text-zinc-700 transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>

      {/* Cards Area: Body with internal scroll */}
      <div className="overflow-y-auto flex flex-col gap-2 min-h-0 custom-scrollbar px-4">
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

      {/* Quick Card Creation: Footer */}
      <div className="p-4 pt-2">
        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="flex flex-col gap-2">
            <textarea
              autoFocus
              rows={2}
              placeholder="Escribe un título para esta tarjeta..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard(e);
                }
              }}
              className="bg-[#F3E8FF] rounded-lg p-2 text-sm text-zinc-900 outline-none w-full placeholder:text-[#806F9B]/50"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-[#7A5AF8] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#6949d6] transition-colors"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAddingCard(true)}
            className="text-[#806F9B] text-sm font-bold w-full text-left p-2 rounded-lg hover:bg-[#F3E8FF] hover:text-[#7A5AF8] transition-colors flex items-center gap-2 group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M12 5v14M5 12h14"/></svg>
            Añadir tarjeta
          </button>
        )}
      </div>
    </div>
  );
};
