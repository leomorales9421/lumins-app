import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, ArchiveRestore, User, ListTodo, Loader2 } from 'lucide-react';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';

interface CardData {
  id: string;
  title: string;
  isDone: boolean;
  status: string;
  list: { id: string; name: string };
  assignees: { user: { id: string; name: string; avatarUrl: string | null } }[];
  labels: { label: { name: string; color: string } }[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  events?: { user: { name: string; avatarUrl: string | null } }[];
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

export default function InsightsBoardDetailPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();
  
  const [cards, setCards] = useState<CardData[]>([]);
  const [boardName, setBoardName] = useState<string>('Cargando...');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Filter & Sort states
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'done-active' | 'done-archived' | 'archived-all'>('all');
  const [sortBy, setSortBy] = useState<'updatedDesc' | 'updatedAsc' | 'createdDesc' | 'createdAsc'>('updatedDesc');
  const [dateFilterType, setDateFilterType] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Result state
  const [processedCards, setProcessedCards] = useState<CardData[]>([]);

  useEffect(() => {
    fetchBoardDetails();
    fetchCards();
  }, [boardId]);

  const fetchBoardDetails = async () => {
    try {
      const res = await apiClient.get<any>(`/api/boards/${boardId}`);
      if (res.data?.board) {
        setBoardName(res.data.board.name);
      }
    } catch (error) {
      console.error('Error fetching board name:', error);
    }
  };

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>(`/api/cards/boards/${boardId}/cards`);
      setCards(res.data?.cards || []);
    } catch (error) {
      console.error('Error fetching board cards:', error);
      toast.error('Error al cargar las tareas del proyecto');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters with simulated delay for visual feedback (perceived performance)
  useEffect(() => {
    if (isLoading) return;
    
    setIsFiltering(true);
    
    const timeout = setTimeout(() => {
      let filtered = cards.filter(c => {
        // Status filter
        if (filterType === 'pending' && (c.isDone || c.status !== 'open')) return false;
        if (filterType === 'done-active' && (!c.isDone || c.status !== 'open')) return false;
        if (filterType === 'done-archived' && (!c.isDone || c.status !== 'closed')) return false;
        if (filterType === 'archived-all' && c.status !== 'closed') return false;

        // Date range filter
        if (startDate || endDate) {
          const dateToCompare = new Date(c[dateFilterType]);
          if (startDate && new Date(startDate) > dateToCompare) return false;
          
          if (endDate) {
            // Include the entire end date day
            const endD = new Date(endDate);
            endD.setHours(23, 59, 59, 999);
            if (endD < dateToCompare) return false;
          }
        }
        
        return true;
      });

      // Sort logic
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'updatedDesc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'updatedAsc': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          case 'createdDesc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'createdAsc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default: return 0;
        }
      });

      setProcessedCards(filtered);
      setIsFiltering(false);
    }, 400); // 400ms loader simulation for heavy filtering feedback

    return () => clearTimeout(timeout);
  }, [cards, filterType, sortBy, startDate, endDate, dateFilterType, isLoading]);

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0E1015] flex flex-col">
      {/* Sticky Header - Native app feel */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={goBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
              {boardName}
            </h1>
            <p className="text-xs text-zinc-500">Listado completo de tareas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Controls Section */}
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="p-2.5 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
              >
                <option value="all">Todas las tareas</option>
                <option value="pending">Pendientes (Activas)</option>
                <option value="done-active">Completadas (Activas)</option>
                <option value="done-archived">Completadas (Archivadas)</option>
                <option value="archived-all">Todas las archivadas</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2.5 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
              >
                <option value="updatedDesc">Modificación (Más reciente)</option>
                <option value="updatedAsc">Modificación (Más antigua)</option>
                <option value="createdDesc">Creación (Más reciente)</option>
                <option value="createdAsc">Creación (Más antigua)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 lg:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rango de fechas</label>
              <div className="flex items-center gap-2">
                <select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value as any)}
                  className="w-[110px] p-2.5 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
                  title="Tipo de fecha a filtrar"
                >
                  <option value="createdAt">Creación</option>
                  <option value="updatedAt">Modific.</option>
                </select>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 p-2.5 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
                />
                <span className="text-zinc-400 font-bold">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 p-2.5 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
                />
              </div>
            </div>

          </div>
        </div>

        {/* List Section */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              Mostrando {processedCards.length} resultados
              {isFiltering && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6C5DD3]" />}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading || (isFiltering && processedCards.length === 0) ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                ))}
              </div>
            ) : processedCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <ListTodo className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold">No se encontraron tareas</p>
                <p className="text-sm">Prueba ajustando los filtros superiores</p>
              </div>
            ) : (
              <div className={`space-y-3 transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
                {processedCards.map(card => {
                  const lastModifier = card.events?.[0]?.user || card.assignees?.[0]?.user;
                  return (
                    <div
                      key={card.id}
                      className={`p-4 rounded-xl border transition-all ${
                        card.isDone 
                          ? 'bg-green-50/30 border-green-100 dark:bg-green-900/10 dark:border-green-900/30' 
                          : 'bg-white border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700/50 hover:border-[#6C5DD3]/50'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              {card.list?.name || 'Sin lista'}
                            </span>
                            {card.isDone && (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Completada
                              </span>
                            )}
                            {card.status === 'closed' && (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                                <ArchiveRestore size={10} />
                                Archivada
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug">
                            {card.title}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs text-zinc-500 font-medium">
                            <div className="flex items-center gap-1.5" title="Fecha de Creación">
                              <Calendar size={14} className="text-zinc-400" />
                              <span className="hidden sm:inline">Creada:</span> {formatDateTime(card.createdAt)}
                            </div>
                            <div className="flex items-center gap-1.5" title="Última modificación o completada">
                              <Clock size={14} className="text-zinc-400" />
                              <span className="hidden sm:inline">Modificada:</span> {formatDateTime(card.updatedAt)}
                            </div>
                            {lastModifier && (
                              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                {lastModifier.avatarUrl ? (
                                  <img src={lastModifier.avatarUrl} alt={lastModifier.name} className="w-4 h-4 rounded-full object-cover" />
                                ) : (
                                  <User size={12} className="text-zinc-400" />
                                )}
                                <span className="text-[10px] uppercase tracking-wider font-bold truncate max-w-[100px]">
                                  Por: {lastModifier.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center md:flex-col justify-end md:justify-center gap-2 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 pt-3 md:pt-0 md:pl-4">
                           <button 
                            onClick={() => navigate(`/boards/${boardId}?card=${card.id}`)}
                            className="text-xs font-bold text-[#6C5DD3] hover:text-[#5b4eb3] bg-[#6C5DD3]/10 px-4 py-2 rounded-lg transition-colors w-full md:w-auto text-center"
                           >
                             Ver en tablero
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
