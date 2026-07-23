import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, RefreshCw, ArchiveRestore, ListTodo } from 'lucide-react';
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
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { status: 'open' });
      toast.success('Tarjeta desarchivada con éxito');
      setCards(cards.filter(c => c.id !== cardId));
      onRestore(); // trigger board reload
    } catch (error) {
      console.error('Error restoring card:', error);
      toast.error('Error al restaurar la tarjeta');
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
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

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-900">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <ArchiveRestore className="text-[#6C5DD3]" />
                Tarjetas Archivadas
              </h2>
              <p className="text-sm text-zinc-500 mt-1">{cards.length} elementos en el archivo</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
              <Clock size={16} />
              Ordenar por:
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2 border rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
            >
              <option value="updatedDesc">Fecha de archivo (Más reciente)</option>
              <option value="updatedAsc">Fecha de archivo (Más antigua)</option>
              <option value="createdDesc">Fecha de creación (Más reciente)</option>
              <option value="createdAsc">Fecha de creación (Más antigua)</option>
            </select>
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50 dark:bg-[#13151A]">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                ))}
              </div>
            ) : sortedCards.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <ArchiveRestore size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-bold">No hay tarjetas archivadas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedCards.map(card => (
                  <div
                    key={card.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#6C5DD3] transition-colors shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {card.list?.name || 'Sin lista'}
                        </span>
                        {card.isDone && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600">
                            Completada
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{card.title}</h4>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <ArchiveRestore size={12} />
                          <span className="font-semibold">Archivada:</span> {formatDateTime(card.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span className="font-semibold">Creada:</span> {formatDateTime(card.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRestore(card.id)}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-2 border border-transparent dark:border-zinc-700"
                    >
                      <RefreshCw size={14} />
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
