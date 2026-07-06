import React, { useState, useEffect, useMemo } from 'react';
import { X, PieChart, Clock, CheckSquare, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/api-client';

export default function UserProfileModal({ userId, boardId, workspaceId, onClose }: { userId: string; boardId?: string; workspaceId?: string; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId, boardId, workspaceId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const wsParam = workspaceId ? `workspaceId=${workspaceId}` : '';
      const boardParam = boardId ? `boardId=${boardId}` : '';
      const params = [wsParam, boardParam].filter(Boolean).join('&');
      const res = await apiClient.get<any>(`/api/analytics/users/${userId}${params ? `?${params}` : ''}`);
      setProfile(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedTasks = useMemo(() => {
    if (!profile?.currentTasks) return [];
    return [...profile.currentTasks].sort((a: any, b: any) => {
      const now = new Date();
      const aOverdue = a.dueDate && !a.isDone && new Date(a.dueDate) < now;
      const bOverdue = b.dueDate && !b.isDone && new Date(b.dueDate) < now;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [profile?.currentTasks]);

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-8 sm:pt-16">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            {!isLoading && profile?.user && (
              <img 
                src={profile.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.name)}&background=6C5DD3&color=fff`} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-sm"
              />
            )}
            <h2 className="text-xl font-black">
              Perfil de Desempeño {!isLoading && profile?.user ? `- ${profile.user.name}` : ''}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50/50 dark:bg-[#13151A]">
          {isLoading ? (
            <div className="animate-pulse space-y-6">
               <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
               <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Board Distribution */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 mb-4"><PieChart size={18} className="text-[#6C5DD3]" /> Distribución por Proyectos</h3>
                  <div className="space-y-4">
                    {profile.boardDistribution.map((b: any, idx: number) => {
                       const total = profile.boardDistribution.reduce((acc: number, curr: any) => acc + curr.count, 0);
                       const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                       return (
                         <div key={idx}>
                           <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                             <span className="truncate pr-2">{b.boardName}</span>
                             <span className="whitespace-nowrap">{pct}% ({b.count})</span>
                           </div>
                           <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                             <div className="bg-[#6C5DD3] h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                           </div>
                         </div>
                       )
                    })}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                  <h3 className="font-bold flex items-center gap-2 mb-4"><Clock size={18} className="text-[#6C5DD3]" /> Actividad Reciente</h3>
                  <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {profile.timeline.length === 0 ? (
                      <p className="text-sm text-zinc-500">Sin actividad reciente.</p>
                    ) : (
                      profile.timeline.map((event: any) => (
                        <div key={event.id} className="flex gap-3 text-sm border-l-2 border-[#6C5DD3]/30 pl-3 py-1">
                           <div className="flex-1 overflow-hidden">
                             <p className="text-zinc-800 dark:text-zinc-200 font-medium capitalize">{event.type.toLowerCase()} en tarjeta</p>
                             <p className="text-zinc-500 text-xs truncate" title={event.card?.title}>{event.card?.title}</p>
                           </div>
                           <span className="text-xs text-zinc-400 whitespace-nowrap">{new Date(event.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Current Tasks */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <h3 className="font-bold flex items-center gap-2 mb-4"><CheckSquare size={18} className="text-[#6C5DD3]" /> Matriz de Tareas Pendientes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {profile.currentTasks.length === 0 ? (
                     <p className="text-sm text-zinc-500 col-span-full">El usuario no tiene tareas pendientes en estos proyectos.</p>
                   ) : (
                     sortedTasks.map((task: any) => {
                       const isOverdue = task.dueDate && !task.isDone && new Date(task.dueDate) < new Date();
                       return (
                         <a 
                           key={task.id}
                           href={`/boards/${task.boardId}?cardId=${task.id}`}
                           target="_blank"
                           rel="noreferrer"
                           className={`block p-3 rounded-lg border transition-all bg-[#F8FAFC] dark:bg-zinc-800/50 group ${isOverdue ? 'border-red-200 dark:border-red-500/20 hover:border-red-400 dark:hover:border-red-400' : 'border-zinc-200 dark:border-zinc-800 hover:border-[#6C5DD3] hover:shadow-md'}`}
                         >
                           <div className="flex items-start justify-between gap-2">
                             <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 group-hover:text-[#6C5DD3] transition-colors">{task.title}</p>
                             {isOverdue && (
                               <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                                 <AlertCircle size={10} />
                                 Atrasada
                               </span>
                             )}
                           </div>
                           <div className="mt-2 flex justify-between text-xs text-zinc-500 font-medium">
                             <span className="truncate max-w-[120px]">{task.board.name}</span>
                             <span className="truncate ml-2">{task.list.name}</span>
                           </div>
                         </a>
                       );
                     })
                   )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
