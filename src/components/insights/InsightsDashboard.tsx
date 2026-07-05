import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import BoardCardsModal from './BoardCardsModal';

export default function InsightsDashboard({ workspaceId }: { workspaceId?: string }) {
  const [boards, setBoards] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const boardCardsId = searchParams.get('boardCards');
  const boardCardsBoard = boardCardsId ? boards.find(b => b.id === boardCardsId) : null;

  const openBoardCards = useCallback((id: string) => {
    setSearchParams({ boardCards: id }, { replace: true });
  }, [setSearchParams]);

  const closeBoardCards = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('boardCards');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchData();
  }, [selectedBoardId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [boardsRes, summaryRes] = await Promise.all<any>([
        apiClient.get<any>('/api/analytics/boards'),
        apiClient.get<any>(`/api/analytics/summary${selectedBoardId ? `?boardId=${selectedBoardId}` : ''}`)
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <BarChart2 className="text-[#6C5DD3]" />
            Insights y Desempeño
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Supervisa el progreso y el rendimiento del equipo de forma segura.</p>
        </div>
        <div>
          <select 
            value={selectedBoardId} 
            onChange={e => setSelectedBoardId(e.target.value)}
            className="p-2 border rounded-lg bg-[#F4F6F9] dark:bg-zinc-800 dark:border-zinc-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Tareas Totales" value={summary?.totalTasks || 0} icon={<BarChart2 />} color="bg-blue-500/10 text-blue-500" />
            <SummaryCard title="Completadas" value={summary?.completedTasks || 0} icon={<CheckCircle2 />} color="bg-green-500/10 text-green-500" />
            <SummaryCard title="Atrasadas" value={summary?.overdueTasks || 0} icon={<AlertCircle />} color="bg-rose-500/10 text-rose-500" />
            <SummaryCard title="Nuevas esta Sem." value={summary?.newTasksThisWeek || 0} icon={<TrendingUp />} color="bg-purple-500/10 text-purple-500" />
          </div>

          {!selectedBoardId && boards.length > 0 && (
             <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
               <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                 <Activity className="text-[#6C5DD3]" size={18} /> Salud de Proyectos
               </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {boards.map(board => (
                    <div
                      key={board.id}
                      onClick={() => openBoardCards(board.id)}
                      className="cursor-pointer group hover:bg-zinc-50 dark:hover:bg-white/[0.02] rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-zinc-700 dark:text-zinc-200 truncate pr-4 group-hover:text-[#6C5DD3] transition-colors">{board.name}</span>
                        <span className="text-zinc-500 whitespace-nowrap">{board.progress}% ({board.completedCards}/{board.totalCards})</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
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
                {boardCardsBoard && (
                  <BoardCardsModal
                    boardId={boardCardsBoard.id}
                    boardName={boardCardsBoard.name}
                    onClose={closeBoardCards}
                  />
                )}
             </div>
          )}

          <WorkloadDirectory selectedBoardId={selectedBoardId} />
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02] cursor-default">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black mt-1">{value}</p>
      </div>
    </div>
  );
}
