import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, 
  MessageSquare, 
  ArrowRight, 
  Paperclip, 
  UserPlus, 
  Filter, 
  Layout, 
  ChevronDown,
  Activity,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { Skeleton } from '../components/ui/Skeleton';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import CardDetailModal from '../components/CardDetailModal';
import UserAvatar from '../components/ui/UserAvatar';

interface CardEvent {
  id: string;
  type: 'MOVE' | 'ATTACHMENT' | 'COMMENT' | 'MEMBER' | 'DESCRIPTION' | 'TITLE' | 'DATES';
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  card: {
    id: string;
    title: string;
    board: {
      id: string;
      name: string;
    };
  };
  fromList?: { id: string, name: string };
  toList?: { id: string, name: string };
  comment?: { body: string };
}

const WorkspaceActivityPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [activity, setActivity] = useState<CardEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBoard, setFilterBoard] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedCard, setSelectedCard] = useState<{cardId: string, boardId: string} | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  const [boards, setBoards] = useState<{id: string, name: string}[]>([]);
  const [members, setMembers] = useState<{id: string, name: string}[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const fetchActivity = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBoard) params.append('boardId', filterBoard);
      if (filterUser) params.append('userId', filterUser);
      if (filterType) params.append('type', filterType);
      
      const skip = (currentPage - 1) * itemsPerPage;
      params.append('limit', itemsPerPage.toString());
      params.append('skip', skip.toString());
      
      const response = await apiClient.get<{ data: { activity: CardEvent[], total: number } }>(
        `/api/workspaces/${workspaceId}/activity?${params.toString()}`
      );
      setActivity(response.data.activity);
      setTotalItems(response.data.total);
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, filterBoard, filterUser, filterType, currentPage]);

  const fetchFiltersData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const workspaceRes = await apiClient.get(`/api/workspaces/${workspaceId}`);
      const ws = workspaceRes.data.workspace;
      setBoards(ws.boards.map((b: any) => ({ id: b.id, name: b.name })));
      setMembers(ws.members.map((m: any) => ({ id: m.user.id, name: m.user.name })));
    } catch (err) {
      console.error('Failed to fetch filter data', err);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBoard, filterUser, filterType]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'COMMENT': return <MessageSquare size={12} />;
      case 'MOVE': return <ArrowRight size={12} />;
      case 'ATTACHMENT': return <Paperclip size={12} />;
      case 'MEMBER': return <UserPlus size={12} />;
      default: return <Info size={12} />;
    }
  };

  const getEventIconStyles = (type: string) => {
    switch (type) {
      case 'COMMENT': return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'MOVE': return 'bg-indigo-100 dark:bg-[#6C5DD3]/10 text-indigo-600 dark:text-[#8E82E3] border-indigo-200 dark:border-[#6C5DD3]/20';
      case 'ATTACHMENT': return 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20';
      case 'MEMBER': return 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20';
      default: return 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10';
    }
  };

  const getEventText = (event: CardEvent) => {
    const userName = <span className="font-bold text-zinc-900 dark:text-zinc-100">{event.user.name}</span>;
    const cardTitle = <span className="font-bold text-zinc-900 dark:text-zinc-100">{event.card.title}</span>;

    switch (event.type) {
      case 'MOVE':
        return <>{userName} movió la tarjeta {cardTitle} de <span className="font-medium">{event.fromList?.name}</span> a <span className="font-medium">{event.toList?.name}</span></>;
      case 'COMMENT':
        return <>{userName} comentó en {cardTitle}</>;
      case 'ATTACHMENT':
        return <>{userName} adjuntó un archivo a {cardTitle}</>;
      case 'MEMBER':
        return <>{userName} agregó un miembro a {cardTitle}</>;
      case 'DESCRIPTION':
        return <>{userName} actualizó la descripción de {cardTitle}</>;
      default:
        return <>{userName} realizó una acción en {cardTitle}</>;
    }
  };

  const groupEventsByDate = (events: CardEvent[]) => {
    const groups: { [key: string]: CardEvent[] } = {};
    events.forEach(event => {
      const date = new Date(event.createdAt);
      let dateKey = format(date, 'd MMMM, yyyy', { locale: es });
      if (isToday(date)) dateKey = 'Hoy';
      else if (isYesterday(date)) dateKey = 'Ayer';
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  };

  const groupedActivity = groupEventsByDate(activity);

  const FiltersContent = ({ isMobile = false }) => (
    <div className={`bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 p-5 sm:p-6 ${!isMobile ? 'shadow-xl shadow-slate-200/40 dark:shadow-none' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-[#6C5DD3]">
            <Filter size={16} />
          </div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Filtros</h2>
        </div>
        
        {isMobile && (
          <button 
            onClick={() => setIsMobileFiltersOpen(false)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronDown size={20} className="text-zinc-400" />
          </button>
        )}

        {!isMobile && (
           <button 
            onClick={() => {
              setFilterBoard('');
              setFilterUser('');
              setFilterType('');
            }}
            className="text-[10px] font-bold text-rose-500 uppercase tracking-tight hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div>
          <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2 block">Tablero</label>
          <div className="relative">
            <select 
              value={filterBoard}
              onChange={(e) => setFilterBoard(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-[#13151A] border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-2 focus:ring-[#6C5DD3]/20 appearance-none outline-none transition-all cursor-pointer"
            >
              <option value="">Todos los tableros</option>
              {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2 block">Miembro</label>
          <div className="relative">
            <select 
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-[#13151A] border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-2 focus:ring-[#6C5DD3]/20 appearance-none outline-none transition-all cursor-pointer"
            >
              <option value="">Todos los miembros</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2 block">Acción</label>
          <div className="relative">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-[#13151A] border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold text-zinc-700 dark:text-zinc-200 focus:ring-2 focus:ring-[#6C5DD3]/20 appearance-none outline-none transition-all cursor-pointer"
            >
              <option value="">Cualquier acción</option>
              <option value="MOVE">Movimientos</option>
              <option value="COMMENT">Comentarios</option>
              <option value="ATTACHMENT">Adjuntos</option>
              <option value="MEMBER">Miembros</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
          </div>
        </div>

        {isMobile && (
          <div className="pt-2">
            <button 
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full py-4 bg-[#6C5DD3] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#6C5DD3]/20 active:scale-95 transition-transform"
            >
              Aplicar Filtros
            </button>
            <button 
              onClick={() => {
                setFilterBoard('');
                setFilterUser('');
                setFilterType('');
                setIsMobileFiltersOpen(false);
              }}
              className="w-full py-3 mt-2 text-zinc-500 dark:text-zinc-400 font-bold text-xs hover:underline"
            >
              Limpiar y cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#13151A] p-4 sm:p-8 font-sans relative">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#6C5DD3] mb-1">
              <Activity size={18} strokeWidth={2.5} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Workspace Audit Log</span>
            </div>
            {isLoading && activity.length === 0 ? (
              <>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Actividad del Espacio</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Registro en tiempo real de todos los tableros.</p>
              </>
            )}
          </div>

          {/* Mobile Filter Trigger */}
          <button 
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-xl shadow-sm text-zinc-700 dark:text-zinc-300 font-bold text-sm active:scale-95 transition-all"
          >
            <Filter size={16} className="text-[#6C5DD3]" />
            Filtros
            {(filterBoard || filterUser || filterType) && (
              <span className="w-2 h-2 rounded-full bg-[#6C5DD3] animate-pulse ml-1" />
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Feed Column */}
          <div className="flex-1 lg:w-[70%] w-full">
            {isLoading && activity.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200 dark:border-white/10 p-4 flex items-start gap-4 shadow-sm">
                    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 p-12 sm:p-20 text-center flex flex-col items-center shadow-soft">
                 <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4">
                    <Clock size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin actividad</h3>
                 <p className="text-zinc-500 dark:text-zinc-400">No se han encontrado eventos con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedActivity).map(([date, events]) => (
                  <div key={date}>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-3 py-1 rounded-full">{date}</span>
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                    </div>
                    <div className="space-y-3">
                      {events.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => setSelectedCard({ cardId: event.card.id, boardId: event.card.board.id })}
                          className="bg-white dark:bg-[#1C1F26] rounded-xl shadow-[0_2px_10px_rgba(108,93,211,0.03)] border border-zinc-200 dark:border-white/10 p-4 flex items-start gap-4 transition-all hover:shadow-md cursor-pointer group hover:border-[#6C5DD3]/30"
                        >
                          <div className="shrink-0">
                            <UserAvatar 
                              name={event.user.name} 
                              avatarUrl={event.user.avatarUrl} 
                              size="sm"
                              className="ring-1 ring-zinc-100 dark:ring-white/5 shadow-sm"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-snug">
                              {getEventText(event)}
                            </p>
                            
                            <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center p-1 rounded-md border ${getEventIconStyles(event.type)} shadow-sm`}>
                                  {getEventIcon(event.type)}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
                                  <Clock size={10} />
                                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })}
                                </div>
                              </div>
                              
                              <div className="h-3 w-px bg-zinc-200 dark:bg-white/10 hidden xs:block" />
                              
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-md border border-zinc-200 dark:border-white/10 group-hover:border-[#6C5DD3]/20 transition-colors">
                                <Layout size={10} className="text-zinc-400 group-hover:text-[#6C5DD3] transition-colors" />
                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-[#6C5DD3] transition-colors truncate max-w-[120px]">{event.card.board.name}</span>
                              </div>
                            </div>

                            {event.type === 'COMMENT' && event.comment && (
                               <div className="mt-3 p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 text-xs text-zinc-500 dark:text-zinc-400 italic line-clamp-2 relative overflow-hidden group-hover:bg-white dark:group-hover:bg-[#252a33] transition-colors">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6C5DD3]/40" />
                                  "{event.comment.body.replace(/<[^>]*>/g, '')}"
                               </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Pagination UI */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#1C1F26] p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm mt-8 gap-4">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Mostrando <span className="font-bold text-zinc-900 dark:text-zinc-100">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-zinc-900 dark:text-zinc-100">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalItems}</span> eventos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] sm:max-w-none scrollbar-hide">
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 flex-shrink-0 rounded-lg text-xs font-bold transition-all ${
                                  currentPage === pageNum 
                                    ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/20' 
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === currentPage - 2 || 
                            pageNum === currentPage + 2
                          ) {
                            return <span key={pageNum} className="text-zinc-400 text-xs px-1">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isLoading}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block lg:w-[30%] sticky top-24 z-10">
            <FiltersContent />
          </aside>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[101] p-4 lg:hidden"
            >
              <FiltersContent isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal 
            cardId={selectedCard.cardId} 
            boardId={selectedCard.boardId}
            isOpen={!!selectedCard} 
            onClose={() => setSelectedCard(null)} 
            onUpdate={fetchActivity}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceActivityPage;
