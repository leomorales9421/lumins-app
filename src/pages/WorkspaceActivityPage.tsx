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
  ChevronRight,
  Loader2
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { useModuleLoading } from '../contexts/NavigationLoaderContext';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import CardDetailModal from '../components/CardDetailModal';
import UserAvatar from '../components/ui/UserAvatar';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import {
  LuminsActivityIcon,
  LuminsFilterIcon,
  LuminsClockIcon,
  LuminsBoardIcon,
} from '../components/icons/LuminsIcons';
import Select from '../components/ui/Select';

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
  useModuleLoading(isLoading && activity.length === 0, 'workspace-activity');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    if (activity.length === 0) setIsLoading(true);
    else setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, [workspaceId, filterBoard, filterUser, filterType, currentPage]);

  const fetchFiltersData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const workspaceRes = await apiClient.get<{ data: { workspace: any } }>(`/api/workspaces/${workspaceId}`);
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
      case 'COMMENT': return 'bg-[#0EA5E9]/[0.10] text-[#0284C7] dark:bg-[#0EA5E9]/15 dark:text-[#38BDF8] border-transparent';
      case 'MOVE': return 'bg-[#12A9A8]/[0.10] text-[#0E8786] dark:bg-[#12A9A8]/15 dark:text-[#4ED4D2] border-transparent';
      case 'ATTACHMENT': return 'bg-[#FFCC40]/[0.20] text-amber-900 dark:bg-[#FFCC40]/15 dark:text-[#FFCC40] border-transparent';
      case 'MEMBER': return 'bg-[#FF665E]/[0.10] text-[#D94841] dark:bg-[#FF665E]/15 dark:text-[#FF857E] border-transparent';
      default: return 'bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-zinc-300 border-transparent';
    }
  };

  const getEventText = (event: CardEvent) => {
    const userName = <span className="font-bold text-zinc-900 dark:text-zinc-100">{event.user.name}</span>;
    const cardTitle = <span className="font-bold text-zinc-900 dark:text-zinc-100 break-words [overflow-wrap:anywhere]">{event.card.title}</span>;

    switch (event.type) {
      case 'MOVE':
        return <>{userName} movió la tarjeta {cardTitle} de <span className="font-medium break-words [overflow-wrap:anywhere]">{event.fromList?.name}</span> a <span className="font-medium break-words [overflow-wrap:anywhere]">{event.toList?.name}</span></>;
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
    <div className={`bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 ${!isMobile ? 'shadow-sm' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#12A9A8]/12 via-[#FFCC40]/12 to-[#FF665E]/12 border border-[#12A9A8]/20 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-200">
            <LuminsFilterIcon size={15} />
          </div>
          <h2 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Filtros</h2>
        </div>
        
        {isMobile && (
          <button 
            onClick={() => setIsMobileFiltersOpen(false)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronDown size={18} className="text-zinc-400" />
          </button>
        )}

        {!isMobile && (
           <button 
            onClick={() => {
              setFilterBoard('');
              setFilterUser('');
              setFilterType('');
            }}
            className="text-[10px] font-bold text-[#FF665E] uppercase tracking-tight hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        <Select
          label="Tablero"
          uiSize="sm"
          value={filterBoard}
          onChange={(e) => setFilterBoard(e.target.value)}
        >
          <option value="">Todos los tableros</option>
          {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>

        <Select
          label="Miembro"
          uiSize="sm"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        >
          <option value="">Todos los miembros</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>

        <Select
          label="Acción"
          uiSize="sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Cualquier acción</option>
          <option value="MOVE">Movimientos</option>
          <option value="COMMENT">Comentarios</option>
          <option value="ATTACHMENT">Adjuntos</option>
          <option value="MEMBER">Miembros</option>
        </Select>

        {isMobile && (
          <div className="pt-2">
            <button 
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full py-2.5 bg-[#12A9A8] hover:bg-[#0E8786] text-white rounded-lg font-bold text-xs shadow-sm shadow-[#12A9A8]/20 active:scale-95 transition-all"
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

  if (!workspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-10 min-h-[60vh]">
        <WorkspaceEmptyState 
          onCreateClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))} 
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-[#F4F6F9] dark:bg-[#13151A] p-4 sm:p-8 font-sans relative"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#0E8786] dark:text-[#4ED4D2] mb-1">
              <LuminsActivityIcon size={18} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Workspace Audit Log</span>
            </div>
            {isLoading && activity.length === 0 ? null : (
              <>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Actividad del Espacio</h1>
                  {isRefreshing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12A9A8]/10 text-[#0E8786] dark:text-[#4ED4D2] animate-in fade-in zoom-in duration-300">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Actualizando</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Registro en tiempo real de todos los tableros.</p>
              </>
            )}
          </div>

          {/* Mobile Filter Trigger */}
          <button 
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-lg shadow-2xs text-zinc-700 dark:text-zinc-300 font-bold text-xs active:scale-95 transition-all"
          >
            <LuminsFilterIcon size={15} />
            Filtros
            {(filterBoard || filterUser || filterType) && (
              <span className="w-2 h-2 rounded-full bg-[#FF665E] animate-pulse ml-1" />
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Feed Column */}
          <div className="flex-1 min-w-0 lg:w-[70%] w-full">
            {isLoading && activity.length === 0 ? null : activity.length === 0 ? (
              <div className="bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/80 dark:border-white/10 p-10 sm:p-16 text-center flex flex-col items-center shadow-2xs">
                 <div className="w-14 h-14 bg-gradient-to-br from-[#12A9A8]/10 via-[#FFCC40]/10 to-[#FF665E]/10 border border-[#12A9A8]/20 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 mb-3.5">
                    <LuminsClockIcon size={28} />
                 </div>
                 <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Sin actividad</h3>
                 <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">No se han encontrado eventos con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedActivity).map(([date, events]) => (
                  <div key={date}>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-3 py-1 rounded">{date}</span>
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
                          className="bg-white dark:bg-[#1C1F26] rounded-xl shadow-[0_2px_10px_rgba(18,169,168,0.04)] border border-zinc-200 dark:border-white/10 p-4 flex items-start gap-4 transition-all hover:shadow-md cursor-pointer group hover:border-[#12A9A8]/35"
                        >
                          <div className="shrink-0">
                            <UserAvatar 
                              name={event.user.name} 
                              avatarUrl={event.user.avatarUrl} 
                              size="sm"
                              className="ring-1 ring-zinc-100 dark:ring-white/5 shadow-sm"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-snug break-words [overflow-wrap:anywhere]">
                              {getEventText(event)}
                            </p>
                            
                            <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center p-1 rounded border ${getEventIconStyles(event.type)}`}>
                                  {getEventIcon(event.type)}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
                                  <Clock size={10} />
                                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })}
                                </div>
                              </div>
                              
                              <div className="h-3 w-px bg-zinc-200 dark:bg-white/10 hidden xs:block" />
                              
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-white/5 rounded-md group-hover:bg-[#12A9A8]/[0.08] transition-colors">
                                <LuminsBoardIcon size={12} />
                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-[#0E8786] dark:group-hover:text-[#4ED4D2] transition-colors truncate max-w-[120px]">{event.card.board.name}</span>
                              </div>
                            </div>

                            {event.type === 'COMMENT' && event.comment && (
                               <div className="mt-3 p-3 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-white/5 text-xs text-zinc-500 dark:text-zinc-400 italic line-clamp-2 break-words [overflow-wrap:anywhere] relative overflow-hidden group-hover:bg-white dark:group-hover:bg-[#252a33] transition-colors">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#12A9A8]/50" />
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
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#1C1F26] p-4 rounded border border-zinc-200 dark:border-white/10 shadow-sm mt-8 gap-4">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Mostrando <span className="font-bold text-zinc-900 dark:text-zinc-100">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-zinc-900 dark:text-zinc-100">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalItems}</span> eventos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="p-2 rounded border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                className={`w-8 h-8 flex-shrink-0 rounded text-xs font-bold transition-all ${
                                  currentPage === pageNum 
                                    ? 'bg-[#12A9A8] text-white shadow-md shadow-[#12A9A8]/20' 
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
                        className="p-2 rounded border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          <aside className="hidden lg:block lg:w-[30%] shrink-0 sticky top-24 z-10">
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
    </motion.div>
  );
};

export default WorkspaceActivityPage;
