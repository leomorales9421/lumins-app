import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Users, ListTodo, ExternalLink, Calendar, Clock } from 'lucide-react';
import apiClient from '../../lib/api-client';

interface CardData {
  id: string;
  title: string;
  isDone: boolean;
  list: { id: string; name: string };
  assignees: { user: { id: string; name: string; avatarUrl: string | null } }[];
  labels: { label: { name: string; color: string } }[];
  dueDate: string | null;
  createdAt: string;
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

export default function BoardCardsModal({
  boardId,
  boardName,
  onClose,
}: {
  boardId: string;
  boardName: string;
  onClose: () => void;
}) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => {
    fetchCards();
  }, [boardId]);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>(`/api/cards/boards/${boardId}/cards`);
      setCards(res.data?.cards || []);
    } catch (error) {
      console.error('Error fetching board cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCards = cards.filter(c => {
    if (filter === 'done') return c.isDone;
    if (filter === 'pending') return !c.isDone;
    return true;
  });

  const groupedByList = filteredCards.reduce<Record<string, CardData[]>>((acc, card) => {
    const listName = card.list?.name || 'Sin lista';
    if (!acc[listName]) acc[listName] = [];
    acc[listName].push(card);
    return acc;
  }, {});

  const totalCards = cards.length;
  const doneCards = cards.filter(c => c.isDone).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-900">
          <div>
            <h2 className="text-xl font-black">{boardName}</h2>
            <p className="text-sm text-zinc-500 mt-1">{doneCards}/{totalCards} tarjetas completadas</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
          {(['all', 'pending', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-[#6C5DD3] text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'done' ? 'Completadas' : 'Pendientes'}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50 dark:bg-[#13151A]">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <ListTodo size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-bold">
                {filter === 'all'
                  ? 'No hay tarjetas en este proyecto'
                  : filter === 'done'
                  ? 'No hay tarjetas completadas'
                  : 'No hay tarjetas pendientes'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByList).map(([listName, listCards]) => (
                <div key={listName}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6C5DD3]" />
                    {listName}
                    <span className="text-zinc-300 font-normal">({listCards.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {listCards.map(card => (
                      <a
                        key={card.id}
                        href={`/boards/${boardId}?cardId=${card.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#6C5DD3] hover:shadow-md transition-all group"
                      >
                        {card.isDone ? (
                          <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle size={18} className="text-zinc-300 dark:text-zinc-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${card.isDone ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'} group-hover:text-[#6C5DD3] transition-colors`}>
                            {card.title}
                          </p>
                          {card.createdAt && (
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                              <Calendar size={10} />
                              <span>{formatDateTime(card.createdAt).split(' ')[0]}</span>
                              <Clock size={10} />
                              <span>{formatDateTime(card.createdAt).split(' ').slice(1).join(' ')}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {card.assignees && card.assignees.length > 0 && (
                              <div className="flex -space-x-1.5">
                                {card.assignees.slice(0, 3).map((a, i) => (
                                  a.user.avatarUrl ? (
                                    <img key={i} src={a.user.avatarUrl} alt={a.user.name} className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900" />
                                  ) : (
                                    <div key={i} className="w-5 h-5 rounded-full bg-[#6C5DD3] text-white flex items-center justify-center text-[8px] font-bold border-2 border-white dark:border-zinc-900">
                                      {a.user.name.charAt(0)}
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                            {card.labels && card.labels.length > 0 && (
                              <div className="flex gap-1">
                                {card.labels.slice(0, 2).map((l, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                    style={{ backgroundColor: l.label.color + '20', color: l.label.color }}
                                  >
                                    {l.label.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {card.dueDate && (
                              <span className="text-[10px] text-zinc-400 font-medium">
                                {new Date(card.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
