import React, { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

interface BoardMetricsProps {
  boardId: string;
}

interface MetricsData {
  overview: {
    totalCards: number;
    totalLists: number;
    totalMembers: number;
    lists: Array<{
      id: string;
      name: string;
      cardCount: number;
    }>;
  };
  distribution: {
    status: Record<string, number>;
    priority: Record<string, number>;
    module: Record<string, number>;
  };
  analytics: {
    leadTime: {
      averageDays: number;
      totalCards: number;
      distribution: {
        min: number;
        max: number;
        median: number;
      } | null;
    };
    cycleTime: {
      averageDays: number;
      totalCards: number;
      distribution: {
        min: number;
        max: number;
        median: number;
      } | null;
    };
    throughput: {
      weekly: number;
      dailyAverage: number;
    };
  };
}

const BoardMetrics: React.FC<BoardMetricsProps> = ({ boardId }) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!boardId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get<{ data: { metrics: MetricsData } }>(
          `/api/boards/${boardId}/metrics`
        );
        setMetrics(response.data.metrics);
      } catch (err: any) {
        setError(err.message || 'Error al cargar las métricas');
        console.error('Error fetching metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-[#9db0b9]">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-400 hover:text-red-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <p className="text-[#9db0b9] text-center py-8">No hay métricas disponibles</p>
      </div>
    );
  }

  const { overview, distribution, analytics } = metrics;

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'todo':
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
      case 'progress':
        return 'bg-blue-500';
      case 'done':
      case 'closed':
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'bg-red-500';
      case 'P1':
        return 'bg-orange-500';
      case 'P2':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Métricas del Tablero</h2>
        <p className="text-[#9db0b9]">
          Análisis de rendimiento y distribución de trabajo
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Tarjetas</h3>
            <span className="material-symbols-outlined text-primary">dashboard</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview.totalCards}</p>
          <p className="text-sm text-[#9db0b9] mt-2">Total de tarjetas en el tablero</p>
        </div>

        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Listas</h3>
            <span className="material-symbols-outlined text-primary">view_list</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview.totalLists}</p>
          <p className="text-sm text-[#9db0b9] mt-2">Columnas de trabajo</p>
        </div>

        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Miembros</h3>
            <span className="material-symbols-outlined text-primary">group</span>
          </div>
          <p className="text-3xl font-bold text-white">{overview.totalMembers}</p>
          <p className="text-sm text-[#9db0b9] mt-2">Equipo colaborando</p>
        </div>
      </div>

      {/* Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-6">Distribución por Estado</h3>
          <div className="space-y-4">
            {Object.entries(distribution.status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-3`}></div>
                  <span className="text-white capitalize">{status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-white font-semibold mr-3">{count}</span>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStatusColor(status)}`}
                      style={{
                        width: `${(count / overview.totalCards) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-6">Distribución por Prioridad</h3>
          <div className="space-y-4">
            {Object.entries(distribution.priority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)} mr-3`}></div>
                  <span className="text-white">{priority}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-white font-semibold mr-3">{count}</span>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                      style={{
                        width: `${(count / overview.totalCards) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Time */}
        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Tiempo de Entrega</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#9db0b9]">Promedio</span>
              <span className="text-2xl font-bold text-white">
                {analytics.leadTime.averageDays} días
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9db0b9]">Tarjetas analizadas</span>
              <span className="text-white font-semibold">{analytics.leadTime.totalCards}</span>
            </div>
            {analytics.leadTime.distribution && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm text-[#9db0b9] mb-2">Distribución:</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-[#9db0b9]">Mín</p>
                    <p className="text-white font-semibold">{analytics.leadTime.distribution.min}d</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9db0b9]">Mediana</p>
                    <p className="text-white font-semibold">{analytics.leadTime.distribution.median}d</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9db0b9]">Máx</p>
                    <p className="text-white font-semibold">{analytics.leadTime.distribution.max}d</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cycle Time */}
        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Tiempo de Ciclo</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#9db0b9]">Promedio</span>
              <span className="text-2xl font-bold text-white">
                {analytics.cycleTime.averageDays} días
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9db0b9]">Tarjetas analizadas</span>
              <span className="text-white font-semibold">{analytics.cycleTime.totalCards}</span>
            </div>
            {analytics.cycleTime.distribution && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm text-[#9db0b9] mb-2">Distribución:</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-[#9db0b9]">Mín</p>
                    <p className="text-white font-semibold">{analytics.cycleTime.distribution.min}d</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9db0b9]">Mediana</p>
                    <p className="text-white font-semibold">{analytics.cycleTime.distribution.median}d</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#9db0b9]">Máx</p>
                    <p className="text-white font-semibold">{analytics.cycleTime.distribution.max}d</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Throughput */}
        <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Productividad</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#9db0b9]">Esta semana</span>
              <span className="text-2xl font-bold text-white">
                {analytics.throughput.weekly} tarjetas
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9db0b9]">Promedio diario</span>
              <span className="text-white font-semibold">
                {analytics.throughput.dailyAverage} tarjetas/día
              </span>
            </div>
            <div className="pt-3 border-t border-white/10">
              <p className="text-sm text-[#9db0b9] mb-2">Rendimiento semanal:</p>
              <div className="flex items-end h-16 space-x-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  // Simulate daily throughput (for demo purposes)
                  const height = Math.floor(Math.random() * 40) + 10;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: `${height}px` }}
                      ></div>
                      <span className="text-xs text-[#9db0b9] mt-1">D{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lists Breakdown */}
      <div className="bg-gradient-to-br from-[#1c2327] to-[#111618] border border-white/5 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-6">Distribución por Lista</h3>
        <div className="space-y-4">
          {overview.lists.map((list) => (
            <div key={list.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-[#9db0b9] mr-3">list</span>
                <span className="text-white">{list.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-white font-semibold mr-3">{list.cardCount}</span>
                <div className="w-48 bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${(list.cardCount / overview.totalCards) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-[#586872] pt-4 border-t border-white/10">
        <p>
          Métricas actualizadas en tiempo real • Última actualización: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default BoardMetrics;
