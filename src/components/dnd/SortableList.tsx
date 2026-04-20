import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
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
  onUpdateList?: (listId: string, name: string) => void;
  onDeleteList?: (listId: string) => void;
}

export const SortableList: React.FC<SortableListProps> = ({ list, onCardClick, onAddCard, onUpdateList, onDeleteList }) => {
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [newCardTitle, setNewCardTitle] = React.useState('');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(list.name || list.title || '');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement>(null);
  const cards = list.cards || [];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({
    id: list.id,
    data: { type: 'list', list: { ...list, cards } },
  });

  const isDraggingCardOver = isOver && active?.data.current?.type === 'card';

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

  const handleUpdateTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle !== (list.name || list.title) && onUpdateList) {
      onUpdateList(list.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        cu-column h-fit max-h-full flex flex-col min-w-[300px] max-w-[300px] flex-shrink-0 transition-all
        bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-2xl border border-white/20 p-4
        ${isDragging ? 'opacity-40 scale-95 z-50' : ''}
        ${isDraggingCardOver ? 'ring-2 ring-[#7A5AF8]/30 ring-offset-1' : ''}
      `}
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        className="px-1 py-2 mb-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          {isEditingTitle ? (
            <form onSubmit={handleUpdateTitle} className="flex-1">
              <input
                autoFocus
                className="cu-input w-full px-2 py-1 text-sm font-semibold"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleUpdateTitle}
              />
            </form>
          ) : (
            <h3
              className="font-bold text-[#1A1A2E] dark:text-white text-[14px] truncate cursor-text hover:text-[#7A5AF8] transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
            >
              {list.name || list.title}
            </h3>
          )}
          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/50 text-[#6B7280] text-[10px] font-bold">
            {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0" ref={menuRef}>
          {/* Quick add card */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsAddingCard(true); }}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#7A5AF8] hover:bg-white transition-colors"
            title="Añadir tarjeta"
          >
            <Plus size={15} strokeWidth={2.5} />
          </button>

          {/* Column options */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-white transition-colors"
          >
            <MoreHorizontal size={15} strokeWidth={2.5} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 cu-dropdown py-1 z-[100]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] font-medium text-[#374151] hover:bg-[#F4F5F7] flex items-center gap-2"
              >
                <Pencil size={13} strokeWidth={2.5} className="text-[#9CA3AF]" />
                Editar nombre
              </button>
              <div className="h-px bg-[#F0F1F3] my-0.5 mx-2" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteList && window.confirm('¿Eliminar esta lista?')) {
                    onDeleteList(list.id);
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={13} strokeWidth={2.5} />
                Eliminar lista
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="overflow-y-auto flex flex-col gap-2 min-h-0 custom-scrollbar px-0.5 py-1">
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

      {/* Footer: Add card */}
      <div className="px-2 pt-0.5 pb-2">
        {isAddingCard ? (
          <form onSubmit={handleAddCard} className="flex flex-col gap-2 p-2 bg-[#F4F5F7] rounded-lg border border-[#E8E9EC]">
            <textarea
              autoFocus
              rows={2}
              placeholder="Nombre de la tarjeta..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard(e);
                }
                if (e.key === 'Escape') handleCancel();
              }}
              className="bg-white border border-[#E8E9EC] rounded-md px-2.5 py-2 text-[13px] text-[#1A1A2E] outline-none w-full resize-none placeholder:text-[#9CA3AF] focus:border-[#7A5AF8] focus:ring-2 focus:ring-[#7A5AF8]/10"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-[#7A5AF8] text-white px-3 py-1.5 rounded-md text-[12px] font-semibold hover:bg-[#6949d6] transition-colors"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-[#6B7280] hover:text-[#1A1A2E] p-1 transition-colors text-[12px] font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#6B7280] hover:text-[#7A5AF8] hover:bg-white/50 transition-all text-[13px] font-bold group mt-2"
          >
            <Plus size={16} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
            Añadir tarjeta
          </button>
        )}
      </div>
    </div>
  );
};
