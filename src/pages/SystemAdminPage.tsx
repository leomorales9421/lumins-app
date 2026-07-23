import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, Layout, Shield, Search, ChevronRight, ExternalLink, Globe, Database, HardDrive, CheckCircle,
  XCircle, Copy, Check, RefreshCw, AlertTriangle, Layers3, Building2, BadgeInfo, Clock3, UserRound,
  UsersRound, CircleGauge, FileText, Activity, Settings, BarChart3
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/ui/Skeleton';

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

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  globalRole: string;
  boardsOwned: number;
  workspacesJoined: number;
  workspaceRoles: Record<string, number>;
  boardRoles: Record<string, number>;
  createdAt: string;
}

interface DriveStatus {
  configured: boolean;
  connected: boolean;
  variables: Record<string, boolean>;
  redirectUri: string | null;
}

type Tab = 'dashboard' | 'users' | 'workspaces' | 'activity' | 'settings';

// Mock global activities since endpoint might not exist yet
const generateMockActivities = () => {
  const acts = [];
  const types = ['workspace', 'user', 'system', 'board'];
  const actions = ['creó un nuevo', 'invitó a', 'eliminó', 'actualizó'];
  for(let i=0; i<120; i++) {
    acts.push({
      id: i,
      user: `Usuario ${Math.floor(Math.random() * 50)}`,
      action: actions[i % actions.length],
      target: `Elemento ${i}`,
      time: `hace ${i+1} horas`,
      type: types[i % types.length]
    });
  }
  return acts;
};
const globalActivities = generateMockActivities();

const getMockUserDetails = (user: UserSummary) => {
  return {
    boards: Array.from({ length: user.boardsOwned || 5 }).map((_, i) => ({
      id: `b${i}`,
      name: `Tablero ${i + 1}`,
      workspaceName: `Espacio de prueba ${i % 3 + 1}`,
      role: i === 0 ? 'ADMIN' : 'MEMBER',
      membersCount: Math.floor(Math.random() * 10) + 1
    })),
    guests: Array.from({ length: 4 }).map((_, i) => ({
      id: `g${i}`,
      name: `Invitado ${i + 1}`,
      email: `invitado${i+1}@externo.com`,
      boardName: `Tablero ${i % 2 + 1}`,
      role: 'VIEWER'
    }))
  };
};

const Pagination = ({ 
  total, page, perPage, onPageChange, onPerPageChange 
}: { 
  total: number, page: number, perPage: number, onPageChange: (p: number) => void, onPerPageChange: (p: number) => void 
}) => {
  const totalPages = Math.ceil(total / perPage);
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-cu-border dark:border-dark-border gap-4">
      <div className="flex items-center gap-3 text-sm text-cu-muted dark:text-zinc-500">
        <span>Mostrar</span>
        <select 
          value={perPage} 
          onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
          className="bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-lg px-2 py-1 outline-none text-cu-text dark:text-zinc-100 focus:border-cyan-500"
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={50}>50</option>
          <option value={500}>500</option>
        </select>
        <span>registros por página</span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          disabled={page === 1} 
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          Anterior
        </button>
        <span className="text-sm text-cu-muted dark:text-zinc-500">
          Página {page} de {totalPages || 1}
        </span>
        <button 
          disabled={page >= totalPages || total === 0} 
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

const SimpleChart = () => {
  const data = [
    { day: 'Lun', users: 12, boards: 5 },
    { day: 'Mar', users: 19, boards: 8 },
    { day: 'Mie', users: 15, boards: 12 },
    { day: 'Jue', users: 22, boards: 15 },
    { day: 'Vie', users: 28, boards: 20 },
    { day: 'Sab', users: 35, boards: 25 },
    { day: 'Dom', users: 40, boards: 30 }
  ];
  
  const maxVal = Math.max(...data.map(d => Math.max(d.users, d.boards)));

  return (
    <div className="h-64 flex items-end justify-between gap-2 mt-6 pt-4 border-t border-cu-border dark:border-dark-border relative">
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
        {[4,3,2,1,0].map(i => (
          <div key={i} className="border-t border-cu-border dark:border-white/5 w-full flex items-center">
            <span className="text-[10px] text-cu-muted dark:text-zinc-600 -mt-2.5 bg-cu-surface dark:bg-dark-surface pr-2">
              {Math.round((maxVal * i) / 4)}
            </span>
          </div>
        ))}
      </div>

      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1 z-10">
          <div className="flex gap-1 items-end h-48 w-full justify-center">
            <div 
              className="w-1/3 max-w-[20px] bg-cyan-400 rounded-t-sm transition-all duration-500 hover:brightness-110" 
              style={{ height: `${(d.users / maxVal) * 100}%` }}
              title={`Usuarios: ${d.users}`}
            />
            <div 
              className="w-1/3 max-w-[20px] bg-emerald-400 rounded-t-sm transition-all duration-500 hover:brightness-110" 
              style={{ height: `${(d.boards / maxVal) * 100}%` }}
              title={`Tableros: ${d.boards}`}
            />
          </div>
          <span className="text-xs font-bold text-cu-muted dark:text-zinc-500">{d.day}</span>
        </div>
      ))}
      <div className="absolute top-0 right-0 flex gap-4 text-xs font-bold text-cu-muted dark:text-zinc-400">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-400"></div> Usuarios</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> Tableros</div>
      </div>
    </div>
  );
};

const SystemAdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [userPerPage, setUserPerPage] = useState(10);
  const [wsPage, setWsPage] = useState(1);
  const [wsPerPage, setWsPerPage] = useState(10);
  const [actPage, setActPage] = useState(1);
  const [actPerPage, setActPerPage] = useState(10);

  // Drive state
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveAuthUrl, setDriveAuthUrl] = useState<string | null>(null);
  const [driveAuthUrlLoading, setDriveAuthUrlLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.globalRole !== 'SYSTEM_ADMIN') {
      navigate('/app');
      return;
    }

    const token = searchParams.get('token');
    const connected = searchParams.get('drive');
    if (token && connected === 'connected') {
      setPendingToken(token);
      setActiveTab('settings');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('token');
      newParams.delete('drive');
      setSearchParams(newParams, { replace: true });
    }

    const fetchData = async () => {
      try {
        const [statsRes, wsRes, driveRes] = await Promise.all([
          apiClient.get<{ data: Stats }>('/api/system/stats'),
          apiClient.get<{ data: { workspaces: Workspace[] } }>('/api/system/workspaces'),
          apiClient.get<{ data: DriveStatus }>('/api/system/drive/status')
        ]);
        setStats(statsRes.data);
        setWorkspaces(wsRes.data.workspaces);
        setDriveStatus(driveRes.data);

        try {
          const usersRes = await apiClient.get<{ data: { users: UserSummary[] } }>('/api/system/users');
          setUsers(usersRes.data.users);
        } catch (usersErr) {
          console.error('Failed to fetch users', usersErr);
        }
      } catch (err) {
        console.error('Failed to fetch system data', err);
      } finally {
        setIsLoading(false);
        setDriveLoading(false);
      }
    };

    fetchData();
  }, [user, navigate, searchParams, setSearchParams]);

  // Reset pagination when search changes
  useEffect(() => {
    setUserPage(1);
    setWsPage(1);
    setActPage(1);
    if (activeTab !== 'users') setSelectedUser(null);
  }, [searchTerm, activeTab]);

  const handleGetAuthUrl = useCallback(async () => {
    setDriveAuthUrlLoading(true);
    try {
      const res = await apiClient.get<{ data: { url: string } }>('/api/system/drive/auth-url');
      const url = new URL(res.data.url);
      url.searchParams.set('redirect', window.location.href);
      setDriveAuthUrl(url.toString());
      window.open(url.toString(), '_blank');
    } catch (err: any) {
      console.error('Failed to get Drive auth URL', err);
    } finally {
      setDriveAuthUrlLoading(false);
    }
  }, []);

  const handleCopyToken = useCallback(async () => {
    if (pendingToken) {
      try {
        await navigator.clipboard.writeText(pendingToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = pendingToken;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [pendingToken]);

  // Derived state for Users
  const filteredUsers = useMemo(() => {
    return users.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPerPage;
    return filteredUsers.slice(start, start + userPerPage);
  }, [filteredUsers, userPage, userPerPage]);

  // Derived state for Workspaces
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(ws => 
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workspaces, searchTerm]);

  const paginatedWorkspaces = useMemo(() => {
    const start = (wsPage - 1) * wsPerPage;
    return filteredWorkspaces.slice(start, start + wsPerPage);
  }, [filteredWorkspaces, wsPage, wsPerPage]);

  // Derived state for Activities
  const filteredActivities = useMemo(() => {
    return globalActivities.filter(a => 
      a.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.target.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const paginatedActivities = useMemo(() => {
    const start = (actPage - 1) * actPerPage;
    return filteredActivities.slice(start, start + actPerPage);
  }, [filteredActivities, actPage, actPerPage]);

  const handleEnterWorkspace = (wsId: string) => {
    navigate(`/w/${wsId}/dashboard`);
  };

  const tabsMenu = [
    { id: 'dashboard', label: 'Resumen', icon: <BarChart3 size={18} /> },
    { id: 'users', label: 'Usuarios', icon: <Users size={18} /> },
    { id: 'workspaces', label: 'Espacios', icon: <Building2 size={18} /> },
    { id: 'activity', label: 'Actividad', icon: <Activity size={18} /> },
    { id: 'settings', label: 'Configuraciones', icon: <Settings size={18} /> },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 p-10 bg-cu-bg dark:bg-dark-bg min-h-screen">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-cu-bg dark:bg-dark-bg min-h-screen text-cu-text dark:text-zinc-100 p-6 sm:p-10 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <Shield size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Super Admin Panel</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Centro de Control Global</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Gestión avanzada de plataforma, usuarios, espacios de trabajo y configuraciones del sistema.
            </p>
          </div>
        </div>

        {/* Top Menu Navigation */}
        <div className="flex overflow-x-auto gap-2 border-b border-cu-border dark:border-dark-border pb-px mb-8 scrollbar-hide">
          {tabsMenu.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id as Tab); setSearchTerm(''); setSelectedUser(null); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id 
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Usuarios Totales" value={stats?.users || 0} icon={<Users size={20} />} color="text-blue-400" />
                <StatCard title="Espacios" value={stats?.workspaces || 0} icon={<Globe size={20} />} color="text-purple-400" />
                <StatCard title="Tableros" value={stats?.boards || 0} icon={<Layout size={20} />} color="text-emerald-400" />
                <StatCard title="Tarjetas" value={stats?.cards || 0} icon={<Database size={20} />} color="text-orange-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-3">
                        <Activity size={20} className="text-cyan-400" />
                        Crecimiento de la plataforma
                      </h2>
                      <p className="text-sm text-cu-muted dark:text-zinc-500 mt-2">Usuarios y tableros creados en los últimos 7 días.</p>
                    </div>
                  </div>
                  <SimpleChart />
                </div>

                <div className="space-y-6">
                  <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                    <h2 className="text-lg font-bold flex items-center gap-3 mb-4">
                      <CircleGauge size={18} className="text-emerald-400" />
                      Resumen rápido
                    </h2>
                    <div className="space-y-3 text-sm">
                      <SummaryLine label="Usuarios Activos" value={String(stats?.users || 0)} icon={<UserRound size={14} />} />
                      <SummaryLine label="Espacios Activos" value={String(stats?.workspaces || 0)} icon={<Building2 size={14} />} />
                      <SummaryLine label="Total Tableros" value={String(stats?.boards || 0)} icon={<Layers3 size={14} />} />
                      <SummaryLine label="Google Drive" value={driveStatus?.connected ? 'Conectado' : 'Pendiente'} icon={<BadgeInfo size={14} />} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
              {!selectedUser ? (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-3">
                        <UsersRound size={20} className="text-cyan-400" />
                        Gestión de Usuarios
                      </h2>
                      <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">Directorio completo de cuentas registradas.</p>
                    </div>
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cu-muted dark:text-zinc-500" size={18} />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-slate-200 dark:bg-white/10 focus:border-cyan-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-cu-border dark:border-dark-border">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-100 dark:bg-white/5 text-[11px] uppercase tracking-[0.25em] text-cu-muted dark:text-zinc-500 font-black">
                      <div className="col-span-4">Usuario</div>
                      <div className="col-span-2">Rol global</div>
                      <div className="col-span-2">Tableros</div>
                      <div className="col-span-2">Espacios</div>
                      <div className="col-span-2">Registro</div>
                    </div>
                    <div className="divide-y divide-white/5 min-h-[300px]">
                      {paginatedUsers.length > 0 ? paginatedUsers.map((item) => (
                        <div key={item.id} onClick={() => setSelectedUser(item)} className="cursor-pointer grid grid-cols-12 gap-3 px-4 py-4 items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <div className="col-span-4 min-w-0">
                            <div className="font-bold text-cu-text dark:text-zinc-100 truncate">{item.name}</div>
                            <div className="text-xs text-cu-muted dark:text-zinc-500 truncate">{item.email}</div>
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.globalRole === 'SYSTEM_ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                              {item.globalRole}
                            </span>
                          </div>
                          <div className="col-span-2 text-sm text-slate-700 dark:text-zinc-300 font-bold">
                            {item.boardsOwned}
                          </div>
                          <div className="col-span-2 text-sm text-slate-700 dark:text-zinc-300 font-bold">
                            {item.workspacesJoined}
                          </div>
                          <div className="col-span-2 text-xs text-cu-muted dark:text-zinc-500">
                            {new Date(item.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      )) : (
                        <div className="px-4 py-16 flex flex-col items-center justify-center text-center text-sm text-cu-muted dark:text-zinc-500">
                          <Users size={32} className="opacity-20 mb-3" />
                          <p>No hay usuarios que coincidan con la búsqueda.</p>
                        </div>
                      )}
                    </div>
                    <Pagination 
                      total={filteredUsers.length} 
                      page={userPage} 
                      perPage={userPerPage} 
                      onPageChange={setUserPage} 
                      onPerPageChange={setUserPerPage} 
                    />
                  </div>
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="flex items-center gap-2 text-sm font-bold text-cu-muted dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors mb-6"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Volver al directorio
                  </button>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-cyan-500/20">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-cu-text dark:text-zinc-100 flex items-center gap-2">
                          {selectedUser.name}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest ${selectedUser.globalRole === 'SYSTEM_ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                            {selectedUser.globalRole}
                          </span>
                        </h2>
                        <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">{selectedUser.email} • ID: {selectedUser.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard title="Tableros Totales" value={selectedUser.boardsOwned} icon={<Layout size={18} />} color="text-cyan-400" />
                    <StatCard title="Espacios Totales" value={selectedUser.workspacesJoined} icon={<Building2 size={18} />} color="text-purple-400" />
                    <StatCard title="Invitados" value={getMockUserDetails(selectedUser).guests.length} icon={<Users size={18} />} color="text-amber-400" />
                    <StatCard title="Almacenamiento" value={0} icon={<HardDrive size={18} />} color="text-emerald-400" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-dark-border rounded-2xl p-5">
                      <h3 className="font-bold flex items-center gap-2 mb-4 text-sm">
                        <Layers3 size={16} className="text-cyan-500" />
                        Tableros (Propiedad / Acceso)
                      </h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {getMockUserDetails(selectedUser).boards.map(b => (
                          <div key={b.id} className="flex justify-between items-center p-3 bg-white dark:bg-black/20 border border-cu-border dark:border-white/10 rounded-xl">
                            <div>
                              <div className="font-bold text-sm">{b.name}</div>
                              <div className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase">{b.workspaceName}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-[10px] font-black uppercase ${b.role === 'ADMIN' ? 'text-cyan-500' : 'text-slate-500 dark:text-zinc-400'}`}>
                                {b.role}
                              </div>
                              <div className="text-[10px] text-cu-muted dark:text-zinc-500">{b.membersCount} miembros</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-dark-border rounded-2xl p-5">
                      <h3 className="font-bold flex items-center gap-2 mb-4 text-sm">
                        <Users size={16} className="text-amber-500" />
                        Invitados (Externos / Miembros)
                      </h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {getMockUserDetails(selectedUser).guests.map(g => (
                          <div key={g.id} className="flex justify-between items-center p-3 bg-white dark:bg-black/20 border border-cu-border dark:border-white/10 rounded-xl">
                            <div>
                              <div className="font-bold text-sm">{g.name}</div>
                              <div className="text-[10px] text-cu-muted dark:text-zinc-500">{g.email}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black text-amber-500 uppercase">{g.role}</div>
                              <div className="text-[10px] text-cu-muted dark:text-zinc-500">{g.boardName}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WORKSPACES TAB */}
          {activeTab === 'workspaces' && (
            <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Building2 size={20} className="text-purple-400" />
                    Directorio de Espacios
                  </h2>
                  <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">Gestión global de espacios de trabajo.</p>
                </div>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cu-muted dark:text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre, dueño o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-slate-200 dark:bg-white/10 focus:border-purple-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-cu-border dark:border-dark-border">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-white/5 text-[11px] font-black uppercase tracking-widest text-cu-muted dark:text-zinc-500 border-b border-cu-border dark:border-dark-border">
                      <th className="px-6 py-4">Espacio de Trabajo</th>
                      <th className="px-6 py-4">Propietario</th>
                      <th className="px-6 py-4">Métricas</th>
                      <th className="px-6 py-4">Creado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedWorkspaces.length > 0 ? paginatedWorkspaces.map((ws) => (
                      <tr key={ws.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-zinc-700 dark:to-zinc-900 text-slate-700 dark:text-white flex items-center justify-center font-black text-sm border border-cu-border dark:border-white/10">
                              {ws.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[14px]">{ws.name}</div>
                              <div className="text-[10px] text-cu-muted dark:text-zinc-500 font-mono mt-0.5">{ws.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{ws.owner.name}</span>
                            <span className="text-xs text-cu-muted dark:text-zinc-500">{ws.owner.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-black">{ws._count.members}</span>
                              <span className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase">Miembros</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black">{ws._count.boards}</span>
                              <span className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase">Tableros</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-cu-muted dark:text-zinc-500">
                          {new Date(ws.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleEnterWorkspace(ws.id)}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold hover:bg-purple-500 hover:text-white transition-all inline-flex items-center gap-2"
                          >
                            Ingresar
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5}>
                          <div className="px-4 py-16 flex flex-col items-center justify-center text-center text-sm text-cu-muted dark:text-zinc-500">
                            <Building2 size={32} className="opacity-20 mb-3" />
                            <p>No se encontraron espacios de trabajo.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination 
                  total={filteredWorkspaces.length} 
                  page={wsPage} 
                  perPage={wsPerPage} 
                  onPageChange={setWsPage} 
                  onPerPageChange={setWsPerPage} 
                />
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Activity size={20} className="text-orange-400" />
                    Actividad Global
                  </h2>
                  <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">Registro de acciones de todos los usuarios en la plataforma.</p>
                </div>
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cu-muted dark:text-zinc-500" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar actividad, usuario o elemento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-slate-200 dark:bg-white/10 focus:border-orange-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-cu-border dark:border-dark-border">
                <div className="divide-y divide-white/5">
                  {paginatedActivities.length > 0 ? paginatedActivities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${
                          act.type === 'workspace' ? 'bg-purple-500/20 text-purple-500' :
                          act.type === 'user' ? 'bg-blue-500/20 text-blue-500' :
                          act.type === 'board' ? 'bg-emerald-500/20 text-emerald-500' :
                          'bg-amber-500/20 text-amber-500'
                        }`}>
                          {act.type === 'workspace' && <Building2 size={16} />}
                          {act.type === 'user' && <Users size={16} />}
                          {act.type === 'board' && <Layout size={16} />}
                          {act.type === 'system' && <Settings size={16} />}
                        </div>
                        <div className="text-sm">
                          <span className="font-bold text-cu-text dark:text-zinc-100">{act.user}</span>
                          <span className="text-slate-500 dark:text-zinc-400 mx-1">{act.action}</span>
                          <span className="font-semibold text-cu-text dark:text-zinc-200">{act.target}</span>
                        </div>
                      </div>
                      <div className="text-xs text-cu-muted dark:text-zinc-500">
                        {act.time}
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-16 flex flex-col items-center justify-center text-center text-sm text-cu-muted dark:text-zinc-500">
                      <Activity size={32} className="opacity-20 mb-3" />
                      <p>No se encontraron registros de actividad.</p>
                    </div>
                  )}
                </div>
                <Pagination 
                  total={filteredActivities.length} 
                  page={actPage} 
                  perPage={actPerPage} 
                  onPageChange={setActPage} 
                  onPerPageChange={setActPerPage} 
                />
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                <h2 className="text-xl font-bold flex items-center gap-3 mb-2">
                  <Settings size={20} className="text-slate-400" />
                  Configuraciones Globales
                </h2>
                <p className="text-sm text-cu-muted dark:text-zinc-500 mb-6">
                  Administra las integraciones de la plataforma y otras configuraciones técnicas a nivel de sistema.
                </p>

                {/* Google Drive Config Section */}
                <div className="border border-cu-border dark:border-dark-border rounded-2xl overflow-hidden">
                  <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border-b border-cu-border dark:border-dark-border">
                    <h3 className="font-bold flex items-center gap-2">
                      <HardDrive size={18} className="text-emerald-400" />
                      Integración con Google Drive
                    </h3>
                  </div>
                  <div className="p-6">
                    {driveLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                      </div>
                    ) : driveStatus ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <DriveStatusCard
                            title="Configurado (.env)"
                            ok={driveStatus.configured}
                            description={driveStatus.configured ? 'Variables presentes' : 'Faltan variables'}
                          />
                          <DriveStatusCard
                            title="Conectado"
                            ok={driveStatus.connected}
                            description={driveStatus.connected ? 'Refresh token activo' : 'Sin autenticar'}
                          />
                          <DriveStatusCard
                            title="Folder ID"
                            ok={driveStatus.variables.GOOGLE_DRIVE_FOLDER_ID}
                            description={driveStatus.variables.GOOGLE_DRIVE_FOLDER_ID ? 'Asignado' : 'Falta en .env'}
                          />
                        </div>

                        {pendingToken && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-6 mb-6"
                          >
                            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
                              <CheckCircle size={20} />
                              <span className="font-bold">Refresh Token obtenido exitosamente</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-zinc-400 mb-3">
                              Cópialo y pégalo en tu archivo <code className="bg-black/10 dark:bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> como <code className="bg-black/10 dark:bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono">GOOGLE_REFRESH_TOKEN</code>, luego reinicia el servidor.
                            </p>
                            <div className="relative">
                              <pre className="bg-white dark:bg-black/40 border border-emerald-200 dark:border-white/10 rounded-xl p-4 text-xs font-mono text-slate-800 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all pr-12">
                                {pendingToken}
                              </pre>
                              <button
                                onClick={handleCopyToken}
                                className="absolute top-2 right-2 p-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-lg transition-all"
                                title="Copiar"
                              >
                                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-500" />}
                              </button>
                            </div>
                            <button
                              onClick={() => setPendingToken(null)}
                              className="mt-3 text-xs text-emerald-700 dark:text-emerald-400 hover:opacity-70 transition-opacity font-medium"
                            >
                              Descartar mensaje
                            </button>
                          </motion.div>
                        )}

                        {!driveStatus.configured ? (
                          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Configuración incompleta</p>
                              <p className="text-xs text-slate-700 dark:text-zinc-400">
                                Faltan variables clave en el archivo .env necesarias para activar Drive.
                              </p>
                            </div>
                          </div>
                        ) : driveStatus.connected ? (
                          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                            <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Sistema conectado a Google Drive</p>
                              <p className="text-xs text-slate-700 dark:text-zinc-400">El sistema de archivos en la nube está operando correctamente.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <button
                              onClick={handleGetAuthUrl}
                              disabled={driveAuthUrlLoading}
                              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-cu-muted dark:text-zinc-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm shadow-emerald-500/20"
                            >
                              {driveAuthUrlLoading ? (
                                <RefreshCw size={18} className="animate-spin" />
                              ) : (
                                <ExternalLink size={18} />
                              )}
                              {driveAuthUrlLoading ? 'Generando...' : 'Conectar con Google Drive'}
                            </button>
                            <p className="text-xs text-cu-muted dark:text-zinc-500 max-w-sm">
                              Se abrirá una nueva pestaña para autenticarte con la cuenta de servicio de Google.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <XCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Error al cargar estado de Google Drive.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 flex flex-col justify-between h-32 hover:border-cu-border dark:border-white/10 transition-all group">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-[11px] font-black text-cu-muted dark:text-zinc-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="text-3xl font-black tracking-tighter">{value.toLocaleString()}</div>
  </div>
);

const DriveStatusCard: React.FC<{ title: string; ok: boolean; description: string }> = ({ title, ok, description }) => (
  <div className="bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-dark-border rounded-2xl p-5 flex items-center gap-4">
    <div className={`p-2.5 rounded-xl ${ok ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
      {ok ? <CheckCircle size={20} /> : <XCircle size={20} />}
    </div>
    <div>
      <div className="font-bold text-sm text-cu-text dark:text-zinc-100">{title}</div>
      <div className="text-xs text-cu-muted dark:text-zinc-500 mt-0.5">{description}</div>
    </div>
  </div>
);

const SummaryLine: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-cu-border dark:border-dark-border bg-slate-100 dark:bg-white/5 px-4 py-3">
    <div className="flex items-center gap-3 text-slate-600 dark:text-zinc-400">
      <span className="text-cyan-500 bg-cyan-500/10 p-1.5 rounded-lg">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </div>
    <span className="font-black text-cu-text dark:text-zinc-100">{value}</span>
  </div>
);

export default SystemAdminPage;
