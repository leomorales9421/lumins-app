import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api-client';
import {
  BarChart2,
  TrendingUp,
  RotateCcw,
  ChevronDown,
  Layout,
  ArrowUpRight,
} from 'lucide-react';
import WorkloadDirectory from './WorkloadDirectory';
import { useModuleLoading } from '../../contexts/NavigationLoaderContext';
import {
  LuminsInsightsIcon,
  LuminsActivityIcon,
  LuminsSuccessIcon,
  LuminsErrorIcon,
  LuminsBoardIcon,
} from '../icons/LuminsIcons';
import Select from '../ui/Select';


export default function InsightsDashboard({ workspaceId }: { workspaceId?: string }) {
  const [boards, setBoards] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  useModuleLoading(isLoading, 'insights-dashboard');
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
      setBoards(Array.isArray(boardsRes?.data) ? boardsRes.data : []);
      setSummary(summaryRes?.data ?? null);
    } catch (error) {
      console.error('Error fetching insights data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalTasks = summary?.totalTasks || 0;
  const completedTasks = summary?.completedTasks || 0;
  const overdueTasks = summary?.overdueTasks || 0;
  const newTasksThisWeek = summary?.newTasksThisWeek || 0;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-[1440px] mx-auto space-y-4">
      {/* Compact Calendar-style Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex w-8 h-8 rounded-lg bg-gradient-to-br from-[#12A9A8]/12 via-[#FFCC40]/12 to-[#FF665E]/12 border border-[#12A9A8]/20 text-zinc-800 dark:text-zinc-100 items-center justify-center shrink-0">
            <LuminsInsightsIcon size={17} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                Insights y Desempeño
              </h1>
              {!isLoading && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#12A9A8]/[0.10] text-[#0E8786] dark:bg-[#12A9A8]/15 dark:text-[#4ED4D2]">
                  {completionPct}% completado
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              Supervisa el progreso, cuellos de botella y rendimiento del equipo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Select
            uiSize="sm"
            leftIcon={<LuminsBoardIcon size={13} />}
            value={selectedBoardId}
            onChange={e => setSelectedBoardId(e.target.value)}
            containerClassName="flex-1 sm:w-56"
          >
            <option value="">Todos mis proyectos</option>
            {boards.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>

          <button
            type="button"
            onClick={fetchData}
            title="Actualizar métricas"
            className="p-1.5 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-zinc-500 hover:text-[#12A9A8] hover:border-[#12A9A8]/40 transition-colors shadow-2xs shrink-0"
          >
            <RotateCcw size={14} className={isLoading ? 'animate-spin text-[#12A9A8]' : ''} />
          </button>
        </div>
      </header>

      {isLoading ? null : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              title="Tareas Totales"
              value={totalTasks}
              sublabel={`${boards.length} ${boards.length === 1 ? 'proyecto' : 'proyectos'}`}
              icon={<BarChart2 size={18} />}
              iconBg="bg-[#12A9A8]/12 text-[#0E8786] dark:text-[#4ED4D2]"
              accentBorder="border-t-2 border-t-[#12A9A8]"
            />
            <SummaryCard
              title="Completadas"
              value={completedTasks}
              sublabel={`${completionPct}% del total`}
              icon={<LuminsSuccessIcon size={18} />}
              iconBg="bg-[#12A9A8]/12 text-[#0E8786] dark:text-[#4ED4D2]"
              accentBorder="border-t-2 border-t-[#0E8786]"
            />
            <SummaryCard
              title="Atrasadas"
              value={overdueTasks}
              sublabel={overdueTasks > 0 ? 'Requieren atención' : 'Todo al día'}
              icon={<LuminsErrorIcon size={18} />}
              iconBg="bg-[#FF665E]/12 text-[#D94841] dark:text-[#FF857E]"
              accentBorder="border-t-2 border-t-[#FF665E]"
            />
            <SummaryCard
              title="Nuevas esta Sem."
              value={newTasksThisWeek}
              sublabel="Últimos 7 días"
              icon={<TrendingUp size={18} />}
              iconBg="bg-[#FFCC40]/20 text-amber-800 dark:text-[#FFCC40]"
              accentBorder="border-t-2 border-t-[#FFCC40]"
            />
          </div>

          {!selectedBoardId && boards.length > 0 && (
             <div className="bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 shadow-2xs">
               <div className="flex items-center justify-between mb-3.5">
                 <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                   <LuminsActivityIcon size={17} />
                   <span>Salud de Proyectos</span>
                 </h3>
                 <span className="text-[11px] font-bold text-zinc-400">
                   Haz clic en un tablero para ver detalle
                 </span>
               </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {boards.map(board => {
                    const barColor =
                      board.progress >= 75
                        ? 'bg-[#12A9A8]'
                        : board.progress >= 40
                        ? 'bg-[#FFCC40]'
                        : 'bg-[#FF665E]';
                    const badgeTone =
                      board.progress >= 75
                        ? 'bg-[#12A9A8]/[0.10] text-[#0E8786] dark:bg-[#12A9A8]/15 dark:text-[#4ED4D2]'
                        : board.progress >= 40
                        ? 'bg-[#FFCC40]/[0.20] text-amber-900 dark:bg-[#FFCC40]/15 dark:text-[#FFCC40]'
                        : 'bg-[#FF665E]/[0.10] text-[#D94841] dark:bg-[#FF665E]/15 dark:text-[#FF857E]';
                    return (
                      <div
                        key={board.id}
                        onClick={() => openBoardCards(board.id)}
                        className="cursor-pointer group bg-zinc-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04] rounded-xl p-3.5 transition-all active:scale-[0.99] border border-zinc-200/70 dark:border-white/[0.07] hover:border-[#12A9A8]/40 hover:shadow-sm"
                      >
                        <div className="flex justify-between items-center gap-2 mb-2.5">
                          <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-[#0E8786] dark:group-hover:text-[#4ED4D2] transition-colors flex items-center gap-1">
                            {board.name}
                            <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </span>
                          <span className={`text-[11px] font-bold whitespace-nowrap px-2 py-0.5 rounded-md ${badgeTone}`}>
                            {board.progress}% ({board.completedCards}/{board.totalCards})
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200/70 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                            style={{ width: `${board.progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          )}

          <WorkloadDirectory selectedBoardId={selectedBoardId} workspaceId={workspaceId} />
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, sublabel, icon, iconBg, accentBorder }: any) {
  return (
    <div className={`bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/80 dark:border-white/10 ${accentBorder} p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5 transition-all hover:shadow-sm`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider truncate">{title}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{value}</p>
          {sublabel && <span className="text-[11px] font-medium text-zinc-400 truncate hidden sm:inline">{sublabel}</span>}
        </div>
      </div>
    </div>
  );
}
