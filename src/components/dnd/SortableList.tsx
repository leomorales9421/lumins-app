import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus, Pencil, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  canEdit?: boolean;
}

export const SortableList: React.FC<SortableListProps> = ({ list, onCardClick, onAddCard, onUpdateList, onDeleteList, canEdit = true }) => {
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [newCardTitle, setNewCardTitle] = React.useState('');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(list.name || list.title || '');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement>(null);
  const cards = (list.cards || []).filter(Boolean);

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
    touchAction: 'none',
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
      data-list-id={list.id}
      className={`
        cu-column h-fit max-h-full flex flex-col transition-all duration-300
        w-[85vw] sm:w-[85vw] md:w-[300px] flex-shrink-0 snap-center md:snap-start
        bg-white/85 dark:bg-[#1C1F26]/90 backdrop-blur-md rounded-2xl md:rounded-lg border border-white/30 dark:border-white/10 p-2 sm:p-3 shadow-xl
        ${isDragging ? 'opacity-40 scale-[0.98] z-50' : ''}
        ${isDraggingCardOver ? 'ring-2 ring-[#6C5DD3]/40 ring-offset-1 bg-white/95 dark:bg-[#1C1F26]' : ''}
      `}
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        className="px-1 py-1 md:py-2 mb-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
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
              className="font-bold text-zinc-900 dark:text-zinc-100 text-[14px] truncate cursor-text hover:text-[#6C5DD3] transition-colors"
              onClick={(e) => { 
                if (!canEdit) return;
                e.stopPropagation(); 
                setIsEditingTitle(true); 
              }}
            >
              {list.name || list.title}
            </h3>
          )}
          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-white/50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold border border-zinc-200 dark:border-white/5">
            {cards.length}
          </span>
        </div>

        {canEdit && (
          <div className="flex items-center gap-0.5 flex-shrink-0" ref={menuRef}>
            {/* Quick add card */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsAddingCard(true); }}
              className="p-1.5 rounded text-zinc-400 dark:text-zinc-500 hover:text-[#6C5DD3] hover:bg-white dark:hover:bg-white/5 transition-colors"
              title="Añadir tarjeta"
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>

            {/* Column options */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className="p-1.5 rounded text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-white/5 transition-colors"
            >
              <MoreHorizontal size={15} strokeWidth={2.5} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  {/* Overlay for mobile to close when clicking outside */}
                  <div className="fixed inset-0 z-[90] md:hidden" onClick={() => setIsMenuOpen(false)} />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Opciones de lista</span>
                      <button onClick={() => setIsMenuOpen(false)} className="md:hidden p-1 hover:bg-zinc-100 dark:hover:bg-white/5 rounded">
                        <X size={14} />
                      </button>
                    </div>
                    
                    <div className="p-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTitle(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-[13px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-[#6C5DD3]/10 hover:text-[#6C5DD3] rounded-lg transition-all flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                          <Pencil size={14} strokeWidth={2.5} />
                        </div>
                        Editar nombre
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteList && window.confirm('¿Eliminar esta lista?')) {
                            onDeleteList(list.id);
                          }
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded bg-red-100/50 dark:bg-red-500/5 flex items-center justify-center">
                          <Trash2 size={14} strokeWidth={2.5} />
                        </div>
                        Eliminar lista
                      </button>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-white/5 border-t border-zinc-100 dark:border-white/5">
                      <p className="text-[10px] text-zinc-400 leading-tight italic">
                        Esta acción no se puede deshacer si la lista tiene tarjetas.
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="overflow-y-auto flex flex-col gap-1.5 min-h-0 custom-scrollbar px-0.5 py-1">
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

      {canEdit && (
        <div className="px-1 md:px-2 pt-0.5 pb-2">
          {isAddingCard ? (
            <form onSubmit={handleAddCard} className="flex flex-col gap-2 p-2 bg-zinc-50 dark:bg-[#13151A] rounded border border-zinc-200 dark:border-white/5">
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
                className="bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded px-2.5 py-2 text-[13px] text-zinc-900 dark:text-zinc-100 outline-none w-full resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="bg-[#6C5DD3] text-white px-3 py-1.5 rounded text-[12px] font-semibold hover:bg-[#312e81] transition-colors"
                >
                  Añadir
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 transition-colors text-[12px] font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCard(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-[#6C5DD3] dark:hover:text-[#8E82E3] hover:bg-white/50 dark:hover:bg-white/5 transition-all text-[13px] font-bold group mt-2"
            >
              <Plus size={16} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
              Añadir tarjeta
            </button>
          )}
        </div>
      )}
    </div>
  );
};
