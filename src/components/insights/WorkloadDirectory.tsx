import React, { useState, useEffect } from 'react';
import apiClient from '../../lib/api-client';
import { Users, ArrowUpDown } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

export default function WorkloadDirectory({ selectedBoardId, workspaceId }: { selectedBoardId?: string; workspaceId?: string }) {
  const [workload, setWorkload] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkload();
  }, [selectedBoardId, workspaceId]);

  const fetchWorkload = async () => {
    setIsLoading(true);
    try {
      const wsParam = workspaceId ? `workspaceId=${workspaceId}` : '';
      const boardParam = selectedBoardId ? `boardId=${selectedBoardId}` : '';
      const params = [wsParam, boardParam].filter(Boolean).join('&');
      const res = await apiClient.get<any>(`/api/analytics/workload${params ? `?${params}` : ''}`);
      setWorkload(res.data);
    } catch (error) {
      console.error('Error fetching workload:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    const sorted = [...workload].sort((a, b) => b[field] - a[field]);
    setWorkload(sorted);
  };

  if (isLoading) return <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl md:rounded-xl animate-pulse"></div>;

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl md:rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-[#F8FAFC] dark:bg-zinc-900">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Users className="text-[#6C5DD3]" size={18} /> Directorio de Carga de Trabajo
          </h3>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Miembro</th>
                <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" onClick={() => handleSort('activeLoad')}>
                  <div className="flex items-center gap-1">Carga Activa <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" onClick={() => handleSort('recentProductivity')}>
                  <div className="flex items-center gap-1">Productividad Reciente (30d) <ArrowUpDown size={12} /></div>
                </th>
                <th className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" onClick={() => handleSort('bottlenecks')}>
                  <div className="flex items-center gap-1">Cuellos de Botella <ArrowUpDown size={12} /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {workload.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No hay datos de carga de trabajo para mostrar.
                  </td>
                </tr>
              ) : (
                workload.map((row, idx) => (
                  <tr 
                    key={row.user.id} 
                    className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/50 dark:bg-zinc-900/50'}`}
                    onClick={() => setSelectedUser(row.user.id)}
                  >
                    <td className="p-4 flex items-center gap-3">
                      {row.user.avatarUrl ? (
                         <img src={row.user.avatarUrl} alt={row.user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                         <div className="w-8 h-8 rounded-full bg-[#6C5DD3] text-white flex items-center justify-center font-bold text-xs">
                           {row.user.name.charAt(0).toUpperCase()}
                         </div>
                      )}
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{row.user.name}</p>
                        <p className="text-xs text-zinc-500">{row.user.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md">{row.activeLoad} tareas</span>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md">{row.recentProductivity} tareas</span>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {row.bottlenecks > 0 ? (
                         <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-1 rounded-md flex w-max items-center gap-1">
                           {row.bottlenecks} atrasadas
                         </span>
                      ) : (
                         <span className="text-zinc-400 font-bold">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Native-like Cards View */}
        <div className="md:hidden flex flex-col p-4 gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
          {workload.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No hay datos para mostrar.
            </div>
          ) : (
            workload.map((row) => (
              <div 
                key={row.user.id}
                onClick={() => setSelectedUser(row.user.id)}
                className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-[0.98] touch-manipulation transition-transform"
              >
                <div className="flex items-center gap-3 mb-4">
                  {row.user.avatarUrl ? (
                     <img src={row.user.avatarUrl} alt={row.user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-[#6C5DD3] text-white flex items-center justify-center font-bold text-sm">
                       {row.user.name.charAt(0).toUpperCase()}
                     </div>
                  )}
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px]">{row.user.name}</p>
                    <p className="text-xs text-zinc-500">{row.user.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-1">Activa</span>
                    <span className="text-blue-700 dark:text-blue-400 font-black text-lg">{row.activeLoad}</span>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-green-600/70 dark:text-green-400/70 uppercase tracking-wider mb-1">Prod.</span>
                    <span className="text-green-700 dark:text-green-400 font-black text-lg">{row.recentProductivity}</span>
                  </div>
                  <div className={`p-2 rounded-xl flex flex-col items-center justify-center text-center ${row.bottlenecks > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-zinc-50 dark:bg-zinc-800/50'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${row.bottlenecks > 0 ? 'text-rose-600/70 dark:text-rose-400/70' : 'text-zinc-500'}`}>Atrasos</span>
                    <span className={`font-black text-lg ${row.bottlenecks > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-zinc-400'}`}>{row.bottlenecks}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedUser && (
        <UserProfileModal 
          userId={selectedUser} 
          boardId={selectedBoardId} 
          workspaceId={workspaceId}
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </>
  );
}
