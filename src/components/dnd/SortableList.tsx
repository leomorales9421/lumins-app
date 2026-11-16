import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus, Pencil, Trash2, X, Archive, Loader2, CheckCircle2 } from 'lucide-react';
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
  onArchiveList?: (listId: string, listName: string) => void;
  onDeleteList?: (listId: string, listName: string) => void;
  onArchiveCard?: (cardId: string) => void;
  onArchiveAllCards?: (listId: string, listName: string, count: number, onlyCompleted?: boolean) => void;
  canEdit?: boolean;
}

export const SortableList: React.FC<SortableListProps> = ({ 
  list, 
  onCardClick, 
  onAddCard, 
  onUpdateList, 
  onArchiveList, 
  onDeleteList, 
  onArchiveCard,
  onArchiveAllCards,
  canEdit = true 
}) => {
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [newCardTitle, setNewCardTitle] = React.useState('');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(list.name || list.title || '');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement>(null);
  const cards = (list.cards || []).filter(Boolean);
  const completedCards = cards.filter(c => c.isDone);

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
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const isDraggingCardOver = isOver && active?.data.current?.type === 'card';

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : (transition || 'transform 300ms cubic-bezier(0.25, 1, 0.5, 1)'),
  };

  const [isSubmittingCard, setIsSubmittingCard] = React.useState(false);
  const cardsContainerRef = React.useRef<HTMLDivElement>(null);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim() && onAddCard && !isSubmittingCard) {
      const title = newCardTitle.trim();
      setIsSubmittingCard(true);
      
      // Immediate smooth scroll down so user sees where the card is being created
      if (cardsContainerRef.current) {
        cardsContainerRef.current.scrollTo({
          top: cardsContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }

      try {
        await onAddCard(list.id, title);
        setNewCardTitle('');
        setIsAddingCard(false);
        // Ensure scroll reaches the newly created card
        setTimeout(() => {
          if (cardsContainerRef.current) {
            cardsContainerRef.current.scrollTo({
              top: cardsContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 60);
      } catch (err) {
        console.error('Error adding card:', err);
      } finally {
        setIsSubmittingCard(false);
      }
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
        cu-column h-fit max-h-full flex flex-col
        w-[82vw] sm:w-[272px] flex-shrink-0
        bg-[#F1F2F4]/95 dark:bg-[#191C24]/92 backdrop-blur-md rounded-xl border border-black/5 dark:border-white/[0.12] p-2 shadow-[0_6px_20px_rgba(15,23,42,0.12)]
        ${isDragging ? 'opacity-40 scale-[0.98] z-50 !transition-none' : 'transition-shadow duration-150'}
        ${isDraggingCardOver ? 'ring-2 ring-[var(--lumins-accent)]/55 bg-white dark:bg-[#212632]' : ''}
      `}
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        className="px-1.5 pt-1 pb-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
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
              className="font-bold text-zinc-900 dark:text-zinc-100 text-[13.5px] truncate cursor-text hover:text-[var(--lumins-accent-fg)] transition-colors"
              onClick={(e) => { 
                if (!canEdit) return;
                e.stopPropagation(); 
                setIsEditingTitle(true); 
              }}
            >
              {list.name || list.title}
            </h3>
          )}
          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-slate-100/90 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold border border-slate-200/70 dark:border-white/5">
            {cards.length}
          </span>
        </div>

        {canEdit && (
          <div className="relative flex items-center gap-0.5 flex-shrink-0" ref={menuRef}>
            {/* Quick add card */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsAddingCard(true); }}
              className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-[var(--lumins-accent-fg)] hover:bg-white dark:hover:bg-white/5 transition-colors cursor-pointer"
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
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                  >
                    <div className="h-1 w-full bg-gradient-to-r from-[#FF665E] via-[#12A9A8] to-[#FFCC40]" />
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Opciones de lista</span>
                      <button onClick={() => setIsMenuOpen(false)} className="md:hidden p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg">
                        <X size={14} />
                      </button>
                    </div>
                    
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTitle(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 hover:bg-[#12A9A8]/10 hover:text-[#0E8786] dark:hover:text-[#4ED4D2] rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#12A9A8]/12 dark:bg-[#12A9A8]/20 text-[#0E8786] dark:text-[#4ED4D2] flex items-center justify-center shrink-0">
                          <Pencil size={14} strokeWidth={2.5} />
                        </div>
                        <span>Editar nombre</span>
                      </button>

                      {/* Bulk Archive Actions */}
                      {cards.length > 0 && (
                        <>
                          <div className="my-1.5 border-t border-zinc-100 dark:border-white/5" />
                          <div className="px-3 pt-1 pb-0.5">
                            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                              Tarjetas en lista
                            </span>
                          </div>

                          {completedCards.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onArchiveAllCards?.(list.id, list.name || list.title || 'Lista', completedCards.length, true);
                                setIsMenuOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-[13px] font-bold text-[#0E8786] dark:text-[#4ED4D2] hover:bg-[#12A9A8]/10 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                              title="Archivar solo las tarjetas marcadas como completadas"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-[#12A9A8]/12 dark:bg-[#12A9A8]/20 flex items-center justify-center shrink-0">
                                  <CheckCircle2 size={14} strokeWidth={2.5} className="text-[#0E8786] dark:text-[#4ED4D2]" />
                                </div>
                                <span className="truncate">Archivar completadas</span>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#12A9A8]/15 text-[#0E8786] dark:text-[#4ED4D2] shrink-0 tabular-nums">
                                {completedCards.length}
                              </span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onArchiveAllCards?.(list.id, list.name || list.title || 'Lista', cards.length, false);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-[13px] font-bold text-amber-800 dark:text-[#FFCC40] hover:bg-[#FFCC40]/15 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                            title="Archivar todas las tarjetas de esta lista"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#FFCC40]/20 dark:bg-[#FFCC40]/15 flex items-center justify-center shrink-0">
                                <Archive size={14} strokeWidth={2.5} className="text-amber-700 dark:text-[#FFCC40]" />
                              </div>
                              <span className="truncate">Archivar todas</span>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFCC40]/25 text-amber-900 dark:text-[#FFCC40] shrink-0 tabular-nums">
                              {cards.length}
                            </span>
                          </button>
                        </>
                      )}

                      <div className="my-1.5 border-t border-zinc-100 dark:border-white/5" />
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveList?.(list.id, list.name || list.title || 'esta lista');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[13px] font-bold text-amber-800 dark:text-[#FFCC40] hover:bg-[#FFCC40]/15 rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#FFCC40]/20 dark:bg-[#FFCC40]/15 text-amber-700 dark:text-[#FFCC40] flex items-center justify-center shrink-0">
                          <Archive size={14} strokeWidth={2.5} />
                        </div>
                        <span>Archivar lista</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteList?.(list.id, list.name || list.title || 'esta lista');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[13px] font-bold text-[#d6453e] dark:text-[#ff8a84] hover:bg-[#FF665E]/10 rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#FF665E]/12 dark:bg-[#FF665E]/15 text-[#d6453e] dark:text-[#ff8a84] flex items-center justify-center shrink-0">
                          <Trash2 size={14} strokeWidth={2.5} />
                        </div>
                        <span>Eliminar lista</span>
                      </button>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-white/[0.03] border-t border-zinc-100 dark:border-white/5">
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight italic">
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
      <div 
        ref={cardsContainerRef}
        className="overflow-y-auto flex flex-col gap-1.5 min-h-0 custom-scrollbar px-0.5 py-1 scroll-smooth"
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card.id)}
              onArchive={onArchiveCard ? () => onArchiveCard(card.id) : undefined}
            />
          ))}
        </SortableContext>

        {/* Creating Card Loader Placeholder */}
        {isSubmittingCard && (
          <div className="bg-white/90 dark:bg-[#1C1F26]/90 p-3 rounded-lg border border-[var(--lumins-accent-border)] shadow-md flex items-center gap-2.5 animate-pulse">
            <Loader2 size={15} className="animate-spin text-[var(--lumins-accent-fg)]" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Creando tarjeta...</span>
          </div>
        )}
      </div>

      {canEdit && (
        <div className="px-0.5 pt-1 pb-0.5">
          {isAddingCard ? (
            <form onSubmit={handleAddCard} className="flex flex-col gap-2 p-2 bg-zinc-50 dark:bg-[#13151A] rounded border border-zinc-200 dark:border-white/5">
              <textarea
                autoFocus
                placeholder="Nombre de la tarjeta..."
                value={newCardTitle}
                onChange={(e) => {
                  setNewCardTitle(e.target.value);
                  e.target.style.height = '0px';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddCard(e);
                  }
                  if (e.key === 'Escape') handleCancel();
                }}
                style={{
                  minHeight: '54px',
                  maxHeight: '180px',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}
                className="bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-[13px] text-zinc-900 dark:text-zinc-100 outline-none w-full resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[var(--lumins-accent)] focus:ring-2 focus:ring-[var(--lumins-accent)]/15 no-scrollbar leading-snug transition-[border-color,box-shadow]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingCard || !newCardTitle.trim()}
                  className="bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:brightness-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSubmittingCard ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Añadiendo...</span>
                    </>
                  ) : (
                    <span>Añadir</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingCard}
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
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-[var(--lumins-accent-fg)] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs font-semibold group cursor-pointer"
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
