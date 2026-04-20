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
  User,
  Info
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { Skeleton } from '../components/ui/Skeleton';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import CardDetailModal from '../components/CardDetailModal';

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
  
  const [boards, setBoards] = useState<{id: string, name: string}[]>([]);
  const [members, setMembers] = useState<{id: string, name: string}[]>([]);

  const fetchActivity = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBoard) params.append('boardId', filterBoard);
      if (filterUser) params.append('userId', filterUser);
      if (filterType) params.append('type', filterType);
      
      const response = await apiClient.get<{ data: { activity: CardEvent[] } }>(
        `/api/workspaces/${workspaceId}/activity?${params.toString()}`
      );
      setActivity(response.data.activity);
    } catch (err) {
      console.error('Failed to fetch activity', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, filterBoard, filterUser, filterType]);

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
      case 'COMMENT': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'MOVE': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'ATTACHMENT': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'MEMBER': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };

  const getEventText = (event: CardEvent) => {
    const userName = <span className="font-bold text-zinc-900">{event.user.name}</span>;
    const cardTitle = <span className="font-bold text-zinc-900">{event.card.title}</span>;

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

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-4 sm:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-1 mb-10">
          <div className="flex items-center gap-2 text-[#7A5AF8] mb-1">
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
              <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Actividad del Espacio</h1>
              <p className="text-sm text-zinc-500 font-medium">Registro en tiempo real de todos los tableros.</p>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Feed Column */}
          <div className="flex-1 lg:w-[70%] w-full">
            {isLoading && activity.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-zinc-100 p-4 flex items-start gap-4 shadow-sm">
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
              <div className="bg-white rounded-2xl border border-zinc-100 p-20 text-center flex flex-col items-center shadow-soft">
                 <div className="w-16 h-16 bg-[#F4F5F7] rounded-2xl flex items-center justify-center text-[#9CA3AF] mb-4">
                    <Clock size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-[#1A1A2E]">Sin actividad</h3>
                 <p className="text-[#6B7280]">No se han encontrado eventos con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedActivity).map(([date, events]) => (
                  <div key={date}>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full">{date}</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                    <div className="space-y-3">
                      {events.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => setSelectedCard({ cardId: event.card.id, boardId: event.card.board.id })}
                          className="bg-white rounded-xl shadow-[0_2px_10px_rgba(108,93,211,0.03)] border border-zinc-100 p-4 flex items-start gap-4 transition-all hover:shadow-md cursor-pointer group hover:border-[#7A5AF8]/30"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-50 to-white border border-zinc-100 flex items-center justify-center text-[#7A5AF8] font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                            {event.user.avatarUrl ? (
                              <img src={event.user.avatarUrl} alt={event.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-600 leading-snug">
                              {getEventText(event)}
                            </p>
                            
                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center p-1 rounded-md border ${getEventIconStyles(event.type)} shadow-sm`}>
                                  {getEventIcon(event.type)}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-tight">
                                  <Clock size={10} />
                                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })}
                                </div>
                              </div>
                              
                              <div className="h-3 w-px bg-zinc-200" />
                              
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#F4F6F9] rounded-md border border-zinc-100 group-hover:border-[#7A5AF8]/20 transition-colors">
                                <Layout size={10} className="text-zinc-400 group-hover:text-[#7A5AF8] transition-colors" />
                                <span className="text-[10px] font-bold text-zinc-500 group-hover:text-[#7A5AF8] transition-colors">{event.card.board.name}</span>
                              </div>
                            </div>

                            {event.type === 'COMMENT' && event.comment && (
                               <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-500 italic line-clamp-2 relative overflow-hidden group-hover:bg-white transition-colors">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7A5AF8]/40" />
                                  "{event.comment.body.replace(/<[^>]*>/g, '')}"
                               </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters Sidebar */}
          <div className="lg:w-[30%] w-full">
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 sticky top-24 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#F4F5F7] rounded-lg flex items-center justify-center text-[#7A5AF8]">
                  <Filter size={16} />
                </div>
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Filtros</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2 block">Tablero</label>
                  <div className="relative">
                    <select 
                      value={filterBoard}
                      onChange={(e) => setFilterBoard(e.target.value)}
                      className="w-full bg-[#F4F6F9] border-none rounded-xl py-3 px-4 text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-[#7A5AF8]/20 appearance-none outline-none transition-all cursor-pointer"
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
                      className="w-full bg-[#F4F6F9] border-none rounded-xl py-3 px-4 text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-[#7A5AF8]/20 appearance-none outline-none transition-all cursor-pointer"
                    >
                      <option value="">Todos los miembros</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2 block">Tipo de Acción</label>
                  <div className="relative">
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full bg-[#F4F6F9] border-none rounded-xl py-3 px-4 text-sm font-bold text-zinc-700 focus:ring-2 focus:ring-[#7A5AF8]/20 appearance-none outline-none transition-all cursor-pointer"
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

                <div className="pt-4 border-t border-zinc-50">
                  <button 
                    onClick={() => {
                      setFilterBoard('');
                      setFilterUser('');
                      setFilterType('');
                    }}
                    className="w-full py-3 bg-[#F8F9FB] hover:bg-red-50 text-[11px] font-bold text-zinc-400 hover:text-red-500 rounded-xl transition-all uppercase tracking-widest border border-zinc-100"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
