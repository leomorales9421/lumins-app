import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api-client';
import { 
  BarChart2, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import WorkloadDirectory from './WorkloadDirectory';


export default function InsightsDashboard({ workspaceId }: { workspaceId?: string }) {
  const [boards, setBoards] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const openBoardCards = useCallback((id: string) => {
    navigate(`/w/${workspaceId}/insights/boards/${id}`);
  }, [navigate, workspaceId]);

  useEffect(() => {
    fetchData();
  }, [selectedBoardId, workspaceId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const wsParam = workspaceId ? `workspaceId=${workspaceId}` : '';
      const boardParam = selectedBoardId ? `boardId=${selectedBoardId}` : '';
      const params = [wsParam, boardParam].filter(Boolean).join('&');
      const [boardsRes, summaryRes] = await Promise.all<any>([
        apiClient.get<any>(`/api/analytics/boards${wsParam ? `?${wsParam}` : ''}`),
        apiClient.get<any>(`/api/analytics/summary${params ? `?${params}` : ''}`)
      ]);
      setBoards(boardsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching insights data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-zinc-900 p-4 md:p-5 rounded-2xl md:rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <BarChart2 className="text-[#6C5DD3]" />
            Insights y Desempeño
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1">Supervisa el progreso y el rendimiento del equipo de forma segura.</p>
        </div>
        <div className="w-full md:w-auto">
          <select 
            value={selectedBoardId} 
            onChange={e => setSelectedBoardId(e.target.value)}
            className="w-full md:w-auto p-3 md:p-2 border rounded-xl md:rounded-lg bg-[#F4F6F9] dark:bg-zinc-800 dark:border-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] appearance-none"
          >
            <option value="">Todos mis proyectos</option>
            {boards.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[1,2,3,4].map(i => <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>)}
          </div>
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        </div>
      ) : (
        <>
          <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-3 md:gap-4 pb-2 md:pb-0 snap-x snap-mandatory md:snap-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 md:mx-0 md:px-0">
            <SummaryCard title="Tareas Totales" value={summary?.totalTasks || 0} icon={<BarChart2 />} color="bg-blue-500/10 text-blue-500" />
            <SummaryCard title="Completadas" value={summary?.completedTasks || 0} icon={<CheckCircle2 />} color="bg-green-500/10 text-green-500" />
            <SummaryCard title="Atrasadas" value={summary?.overdueTasks || 0} icon={<AlertCircle />} color="bg-rose-500/10 text-rose-500" />
            <SummaryCard title="Nuevas esta Sem." value={summary?.newTasksThisWeek || 0} icon={<TrendingUp />} color="bg-purple-500/10 text-purple-500" />
          </div>

          {!selectedBoardId && boards.length > 0 && (
             <div className="bg-white dark:bg-zinc-900 rounded-2xl md:rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-6 shadow-sm">
               <h3 className="text-base md:text-lg font-bold mb-4 md:mb-5 flex items-center gap-2">
                 <Activity className="text-[#6C5DD3]" size={18} /> Salud de Proyectos
               </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                  {boards.map(board => (
                    <div
                      key={board.id}
                      onClick={() => openBoardCards(board.id)}
                      className="cursor-pointer group bg-zinc-50/50 dark:bg-white/[0.02] md:bg-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.02] rounded-xl md:rounded-lg p-3 md:p-2 md:-mx-2 transition-all active:scale-[0.98] touch-manipulation border border-zinc-100 dark:border-zinc-800/50 md:border-transparent"
                    >
                      <div className="flex justify-between items-center text-sm mb-3 md:mb-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate pr-4 group-hover:text-[#6C5DD3] transition-colors">{board.name}</span>
                        <span className="text-xs font-bold text-zinc-500 whitespace-nowrap bg-zinc-200/50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-full">{board.progress}% ({board.completedCards}/{board.totalCards})</span>
                      </div>
                      <div className="w-full bg-zinc-200/60 dark:bg-zinc-800 rounded-full h-2 md:h-2.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${
                            board.progress > 80 ? 'bg-green-500' : board.progress > 40 ? 'bg-yellow-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${board.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          <WorkloadDirectory selectedBoardId={selectedBoardId} workspaceId={workspaceId} />
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: any) {
  return (
    <div className="min-w-[70vw] sm:min-w-[40vw] md:min-w-0 snap-center snap-always bg-white dark:bg-zinc-900 rounded-2xl md:rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02] cursor-default active:scale-95 touch-manipulation">
      <div className={`p-3 rounded-xl md:rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] md:text-xs text-zinc-500 font-bold uppercase tracking-wider line-clamp-1">{title}</p>
        <p className="text-xl md:text-2xl font-black mt-0.5 md:mt-1">{value}</p>
      </div>
    </div>
  );
}
