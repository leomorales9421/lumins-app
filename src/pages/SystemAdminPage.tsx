import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Layout, 
  Activity, 
  Shield, 
  Search, 
  ChevronRight,
  ExternalLink,
  Lock,
  Globe,
  Database
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';

interface Stats {
  users: number;
  workspaces: number;
  boards: number;
  cards: number;
}

interface Workspace {
  id: string;
  name: string;
  owner: {
    name: string;
    email: string;
  };
  _count: {
    members: number;
    boards: number;
  };
  createdAt: string;
}

const SystemAdminPage: React.FC = () => {
  const { user } = useAuth();
  const { isGodMode, setGodMode } = usePermission();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.globalRole !== 'SYSTEM_ADMIN') {
      navigate('/app');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsRes, wsRes] = await Promise.all([
          apiClient.get<{ data: Stats }>('/api/system/stats'),
          apiClient.get<{ data: { workspaces: Workspace[] } }>('/api/system/workspaces')
        ]);
        setStats(statsRes.data);
        setWorkspaces(wsRes.data.workspaces);
      } catch (err) {
        console.error('Failed to fetch system data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const filteredWorkspaces = workspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ws.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ws.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnterWorkspace = (wsId: string) => {
    // 1. Enable God Mode if not active
    if (!isGodMode) setGodMode(true);
    // 2. Redirect to that workspace
    navigate(`/w/${wsId}/dashboard`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-10 bg-[#09090B] min-h-screen">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#09090B] min-h-screen text-zinc-100 p-6 sm:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <Shield size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">System Administration</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Infraestructura Global</h1>
          </div>

          <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
             <div className={`px-4 py-2 rounded-xl flex items-center gap-3 transition-all ${isGodMode ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                <Activity size={18} className={isGodMode ? 'animate-pulse' : ''} />
                <span className="text-sm font-bold">{isGodMode ? 'MODO DIOS ACTIVO' : 'MODO DIOS INACTIVO'}</span>
             </div>
             <button 
              onClick={() => setGodMode(!isGodMode)}
              className="px-6 py-2 bg-white text-black rounded-xl text-sm font-black hover:bg-zinc-200 transition-all active:scale-95"
             >
               Toggle God Mode
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Usuarios Totales" value={stats?.users || 0} icon={<Users size={20} />} color="text-blue-400" />
          <StatCard title="Espacios" value={stats?.workspaces || 0} icon={<Globe size={20} />} color="text-purple-400" />
          <StatCard title="Tableros" value={stats?.boards || 0} icon={<Layout size={20} />} color="text-emerald-400" />
          <StatCard title="Tarjetas" value={stats?.cards || 0} icon={<Database size={20} />} color="text-orange-400" />
        </div>

        {/* Workspaces Table */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-3">
              Directorio de Espacios
              <span className="text-xs font-normal text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
                {workspaces.length} total
              </span>
            </h2>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, dueño o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white/10 focus:border-red-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                  <th className="px-8 py-5">Espacio de Trabajo</th>
                  <th className="px-6 py-5">Propietario</th>
                  <th className="px-6 py-5">Métricas</th>
                  <th className="px-6 py-5">Creado</th>
                  <th className="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredWorkspaces.map((ws, index) => (
                  <motion.tr 
                    key={ws.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center font-black text-sm border border-white/10">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[15px]">{ws.name}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">{ws.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{ws.owner.name}</span>
                        <span className="text-xs text-zinc-500">{ws.owner.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black">{ws._count.members}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">Miembros</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black">{ws._count.boards}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">Tableros</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-zinc-500">
                      {new Date(ws.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleEnterWorkspace(ws.id)}
                        className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 ml-auto"
                      >
                        Entrar como Dios
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col justify-between h-32 hover:border-white/10 transition-all group">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-xl bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="text-3xl font-black tracking-tighter">{value.toLocaleString()}</div>
  </div>
);

export default SystemAdminPage;
