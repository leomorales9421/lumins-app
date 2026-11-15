import React, { useState, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Clock3,
  Zap,
  Sparkles,
  MousePointerClick,
  Compass,
  Bug,
  Search,
  AlertOctagon,
} from 'lucide-react';
import type { AdminClarityData, AdminTelemetryData } from './types';

interface AdminTelemetryTabProps {
  telemetryData: AdminTelemetryData | null;
  telemetryLoading: boolean;
  clarityData: AdminClarityData | null;
  clarityLoading: boolean;
  onRefreshTelemetry: () => void;
  onRefreshClarity: (force?: boolean) => void;
}

const AdminTelemetryTab: React.FC<AdminTelemetryTabProps> = ({
  telemetryData,
  telemetryLoading,
  clarityData,
  clarityLoading,
  onRefreshTelemetry,
  onRefreshClarity,
}) => {
  const [search, setSearch] = useState('');

  const filteredBoards = useMemo(() => {
    const boards = telemetryData?.boards || [];
    const q = search.trim().toLowerCase();
    if (!q) return boards;
    return boards.filter(
      (b) =>
        b.boardName.toLowerCase().includes(q) ||
        b.workspaceName.toLowerCase().includes(q)
    );
  }, [telemetryData?.boards, search]);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#12A9A8]/10 via-[#FFCC40]/5 to-[#FF665E]/10 border border-[#12A9A8]/25 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#12A9A8] font-black text-xs uppercase tracking-widest mb-1">
            <Activity size={16} /> Vigilante de Rendimiento Lumins
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Telemetría Real de Fluidez (FPS y Latencia de Interacción)
          </h2>
          <p className="text-sm text-cu-muted dark:text-zinc-400 mt-1 max-w-2xl">
            Monitoreo en vivo de cada tablero para detectar cuellos de botella antes de que afecten al equipo.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefreshTelemetry}
          disabled={telemetryLoading}
          className="px-5 py-2.5 bg-[#12A9A8] hover:bg-[#0e8f8e] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm shadow-[#12A9A8]/25 cursor-pointer"
        >
          <RefreshCw size={15} className={telemetryLoading ? 'animate-spin' : ''} />
          Actualizar Telemetría
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl p-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cu-muted mb-2">
            <span>Muestras</span>
            <Clock3 size={16} className="text-[#12A9A8]" />
          </div>
          <div className="text-3xl font-black">{telemetryData?.summary.totalSamples || 0}</div>
          <div className="text-xs text-cu-muted mt-1">
            {telemetryData?.summary.uniqueBoardsCount || 0} tableros analizados
          </div>
        </div>

        <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl p-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cu-muted mb-2">
            <span>FPS Globales</span>
            <Zap size={16} className="text-[#12A9A8]" />
          </div>
          <div className="text-3xl font-black text-[#12A9A8]">
            {telemetryData?.summary.globalAvgFps || 60} <span className="text-sm font-bold">FPS</span>
          </div>
          <div className="text-xs text-cu-muted mt-1">Meta saludable: 55–60 FPS</div>
        </div>

        <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl p-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cu-muted mb-2">
            <span>Latencia Media</span>
            <Activity size={16} className="text-[#FFCC40]" />
          </div>
          <div className="text-3xl font-black">
            {telemetryData?.summary.globalAvgInteractionMs || 0}{' '}
            <span className="text-sm font-bold">ms</span>
          </div>
          <div className="text-xs text-cu-muted mt-1">Tiempo por interacción</div>
        </div>

        <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl p-6">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cu-muted mb-2">
            <span>Slow Frames</span>
            <AlertOctagon size={16} className="text-[#FF665E]" />
          </div>
          <div className="text-3xl font-black text-[#FF665E]">
            {telemetryData?.summary.totalSlowFrames || 0}
          </div>
          <div className="text-xs text-cu-muted mt-1">Bloqueos mayores a 50ms</div>
        </div>
      </div>

      {/* Microsoft Clarity */}
      <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#12A9A8]/12 text-[#12A9A8]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black">Microsoft Clarity · Experiencia UX</h3>
              <p className="text-xs text-cu-muted">
                Sesiones, rage clicks, dead clicks y errores JS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRefreshClarity(true)}
            disabled={clarityLoading}
            className="px-4 py-2 bg-[#12A9A8]/10 hover:bg-[#12A9A8]/20 text-[#12A9A8] border border-[#12A9A8]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={clarityLoading ? 'animate-spin' : ''} />
            Sincronizar Clarity
          </button>
        </div>

        {clarityLoading && !clarityData ? (
          <div className="py-10 text-center text-sm text-cu-muted">
            <RefreshCw size={22} className="animate-spin mx-auto mb-2 text-[#12A9A8]" />
            Consultando Clarity...
          </div>
        ) : !clarityData?.isConfigured ? (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border text-xs text-cu-muted">
            {clarityData?.error || 'Agrega CLARITY_API_TOKEN en el servidor para habilitar métricas UX.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border">
              <div className="flex items-center justify-between text-xs font-bold text-cu-muted mb-1">
                <span>Sesiones</span>
                <MousePointerClick size={15} className="text-[#12A9A8]" />
              </div>
              <div className="text-2xl font-black">{clarityData.summary.totalSessions}</div>
              <div className="text-xs text-cu-muted">
                {clarityData.summary.distinctUsers} usuarios únicos
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border">
              <div className="flex items-center justify-between text-xs font-bold text-cu-muted mb-1">
                <span>Scroll & Profundidad</span>
                <Compass size={15} className="text-[#FFCC40]" />
              </div>
              <div className="text-2xl font-black">{clarityData.summary.avgScrollDepth}%</div>
              <div className="text-xs text-cu-muted">
                {clarityData.summary.pagesPerSession} pág/sesión
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border">
              <div className="flex items-center justify-between text-xs font-bold text-cu-muted mb-1">
                <span>Errores de Script</span>
                <Bug size={15} className="text-[#FF665E]" />
              </div>
              <div className="text-2xl font-black">{clarityData.errors.scriptErrors.count}</div>
              <div className="text-xs text-cu-muted">
                Rage clicks: {clarityData.frustrations.rageClicks.count}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de tableros */}
      <div className="bg-cu-surface dark:bg-dark-surface border border-cu-border dark:border-dark-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-cu-border dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold">Salud por Tablero ({filteredBoards.length})</h3>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cu-muted" />
            <input
              type="text"
              placeholder="Filtrar tablero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-[#12A9A8]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cu-border text-[11px] font-black uppercase tracking-widest text-cu-muted bg-slate-50 dark:bg-white/[0.02]">
                <th className="px-6 py-3.5">Tablero</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-center">FPS</th>
                <th className="px-6 py-3.5 text-center">Latencia</th>
                <th className="px-6 py-3.5 text-center">Tarjetas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cu-border">
              {filteredBoards.map((b) => (
                <tr key={b.boardId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-3.5">
                    <div className="font-bold">{b.boardName}</div>
                    <div className="text-xs text-cu-muted">{b.workspaceName}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        b.status === 'critical'
                          ? 'bg-[#FF665E]/15 text-[#FF665E]'
                          : b.status === 'warning'
                            ? 'bg-[#FFCC40]/20 text-[#9c6f00] dark:text-[#FFCC40]'
                            : 'bg-[#12A9A8]/15 text-[#12A9A8]'
                      }`}
                    >
                      {b.status === 'critical'
                        ? 'Lento'
                        : b.status === 'warning'
                          ? 'Moderado'
                          : 'Óptimo'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center font-bold">{b.avgFps}</td>
                  <td className="px-6 py-3.5 text-center font-mono text-xs">
                    {b.avgInteractionMs} ms
                  </td>
                  <td className="px-6 py-3.5 text-center">{b.avgCardsCount}</td>
                </tr>
              ))}
              {filteredBoards.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-cu-muted">
                    Sin muestras de telemetría todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTelemetryTab;
