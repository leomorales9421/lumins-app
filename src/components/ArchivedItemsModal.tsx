import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, RefreshCw, ArchiveRestore, Search, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';

interface CardData {
  id: string;
  title: string;
  isDone: boolean;
  list: { id: string; name: string };
  assignees: { user: { id: string; name: string; avatarUrl: string | null } }[];
  labels: { label: { name: string; color: string } }[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

export default function ArchivedItemsModal({
  boardId,
  onClose,
  onRestore,
}: {
  boardId: string;
  onClose: () => void;
  onRestore: () => void;
}) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedDesc' | 'updatedAsc' | 'createdDesc' | 'createdAsc'>('updatedDesc');

  useEffect(() => {
    fetchArchivedCards();
  }, [boardId]);

  const fetchArchivedCards = async () => {
    setIsLoading(true);
    try {
      // status=closed gets only archived cards
      const res = await apiClient.get<any>(`/api/cards/boards/${boardId}/cards?status=closed`);
      setCards(res.data?.cards || []);
    } catch (error) {
      console.error('Error fetching archived cards:', error);
      toast.error('Error al cargar las tarjetas archivadas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (cardId: string) => {
    setRestoringId(cardId);
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { status: 'open' });
      toast.success('Tarjeta desarchivada con éxito');
      setCards(cards.filter(c => c.id !== cardId));
      onRestore(); // trigger board reload
    } catch (error) {
      console.error('Error restoring card:', error);
      toast.error('Error al restaurar la tarjeta');
    } finally {
      setRestoringId(null);
    }
  };

  const filteredAndSortedCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = cards.filter(card => {
      if (!q) return true;
      return (
        card.title.toLowerCase().includes(q) ||
        card.list?.name?.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updatedDesc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'updatedAsc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'createdDesc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAsc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [cards, searchQuery, sortBy]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet / Modal container */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="relative bg-white dark:bg-zinc-900 rounded-t-[28px] sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl h-[88vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden border-t sm:border border-zinc-200 dark:border-zinc-800 z-10"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0 bg-[#F8FAFC] dark:bg-zinc-900">
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center shrink-0">
              <ArchiveRestore size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                  Tarjetas Archivadas
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {cards.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                Restaura tarjetas para volver a mostrarlas en el tablero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters & Search Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between bg-zinc-50 dark:bg-zinc-800/40 shrink-0">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título o lista..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-zinc-500 shrink-0">
              <Clock size={14} />
              Ordenar:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 border rounded-xl bg-white dark:bg-zinc-800 dark:border-zinc-700 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] transition-all"
            >
              <option value="updatedDesc">Archivada: Más reciente</option>
              <option value="updatedAsc">Archivada: Más antigua</option>
              <option value="createdDesc">Creada: Más reciente</option>
              <option value="createdAsc">Creada: Más antigua</option>
            </select>
          </div>
        </div>

        {/* Card List Area */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50 dark:bg-[#13151A] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredAndSortedCards.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <ArchiveRestore size={44} className="mx-auto mb-3 opacity-30 text-zinc-400" />
              <p className="font-bold text-base text-zinc-700 dark:text-zinc-300">
                {searchQuery ? 'No hay tarjetas que coincidan' : 'No hay tarjetas archivadas'}
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Intenta con otro término de búsqueda o limpia el filtro.'
                  : 'Las tarjetas que archives en este tablero aparecerán aquí.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#6C5DD3]/50 dark:hover:border-[#6C5DD3]/50 transition-all shadow-sm group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {card.list?.name || 'Sin lista'}
                      </span>
                      {card.isDone && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Completada
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 break-words leading-snug">
                      {card.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <ArchiveRestore size={12} className="shrink-0 text-zinc-400" />
                        <span>Archivada: {formatDateTime(card.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="shrink-0 text-zinc-400" />
                        <span>Creada: {formatDateTime(card.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60 flex sm:justify-end shrink-0">
                    <button
                      onClick={() => handleRestore(card.id)}
                      disabled={restoringId === card.id}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#6C5DD3]/10 hover:bg-[#6C5DD3]/20 active:bg-[#6C5DD3]/30 text-[#6C5DD3] dark:bg-[#6C5DD3]/20 dark:hover:bg-[#6C5DD3]/30 dark:text-indigo-300 transition-all active:scale-95 flex items-center justify-center gap-2 border border-[#6C5DD3]/20 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={restoringId === card.id ? 'animate-spin' : ''} />
                      <span>{restoringId === card.id ? 'Restaurando...' : 'Restaurar'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
