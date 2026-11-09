import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, Layout, Shield, Search, ChevronRight, ExternalLink, Globe, Database, HardDrive, CheckCircle,
  XCircle, Copy, Check, RefreshCw, AlertTriangle, Layers3, Building2, BadgeInfo, Clock3, UserRound,
  UsersRound, CircleGauge, FileText, Activity, Settings, BarChart3, Zap, AlertOctagon, Sparkles,
  Filter, CheckSquare, MessageSquare, ShieldAlert, UserCheck, HelpCircle, MousePointerClick, Flame, Bug, Compass
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../components/ui/Skeleton';
import SupportTicketsAdmin from '../components/admin/SupportTicketsAdmin';

interface Stats {
  users: number;
  activeUsers: number;
  workspaces: number;
  boards: number;
  cards: number;
  cardsDone: number;
  cardsOpen: number;
  attachments: number;
  storageBytes: number;
  comments: number;
  growth: Array<{
    day: string;
    date: string;
    users: number;
    boards: number;
    cards: number;
  }>;
}

interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  totalCards?: number;
  _count: {
    members: number;
    boards: number;
  };
  boardsPreview?: Array<{ id: string; name: string; cardsCount: number }>;
  membersPreview?: Array<{ role: string; name: string; email: string }>;
  createdAt: string;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  globalRole: string;
  avatarUrl?: string | null;
  phone?: string | null;
  country?: string | null;
  boardsOwned: number;
  workspacesOwned: number;
  workspacesJoined: number;
  boardMemberships: number;
  attachmentsCount?: number;
  assignedCardsCount?: number;
  workspaceRoles: Record<string, number>;
  boardRoles: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface UserDetails {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    globalRole: string;
    avatarUrl?: string | null;
    phone?: string | null;
    country?: string | null;
    theme?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  boards: Array<{
    id: string;
    name: string;
    workspaceName: string;
    workspaceId: string;
    role: string;
    membersCount: number;
    cardsCount: number;
    updatedAt: string;
  }>;
  workspaces: Array<{
    id: string;
    name: string;
    role: string;
    membersCount: number;
    boardsCount: number;
  }>;
  guests: Array<{
    id: string;
    name: string;
    email: string;
    boardName: string;
    role: string;
    status: string;
  }>;
  storageBytes: number;
  attachmentsCount: number;
  assignedCardsCount: number;
  completedAssignedCards: number;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: string;
    metadata?: any;
  }>;
}

interface SystemActivityItem {
  id: string;
  action: string;
  actionLabel: string;
  type: 'user' | 'board' | 'workspace' | 'card' | 'system';
  resource: string;
  resourceId?: string | null;
  user: string;
  userEmail?: string | null;
  target: string;
  ipAddress?: string | null;
  createdAt: string;
  metadata?: any;
}

interface DriveStatus {
  configured: boolean;
  connected: boolean;
  variables: Record<string, boolean>;
  redirectUri: string | null;
}

interface TelemetryBoardStat {
  boardId: string;
  boardName: string;
  workspaceId?: string;
  health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  reasons: string[];
  samplesCount: number;
  avgLoadTimeMs: number;
  maxLoadTimeMs: number;
  avgFps: number;
  minFps: number;
  avgPayloadKb: number;
  maxPayloadKb: number;
  cardCount: number;
  listCount: number;
  avgSocketPingMs: number;
  lastSeen: string;
  lastUser?: { id: string; name: string; email: string };
  recentLogs?: any[];
}

interface TelemetrySummary {
  totalSamples: number;
  monitoredBoardsCount: number;
  globalAvgLoadMs: number;
  globalAvgFps: number;
  criticalBoardsCount: number;
  warningBoardsCount: number;
  healthyBoardsCount: number;
}

interface ClarityInsightsData {
  configured: boolean;
  cached: boolean;
  lastUpdated: string;
  canRefresh: boolean;
  nextAllowedRefreshMinutes: number;
  timeframeDays: number;
  traffic: {
    totalSessions: number;
    distinctUsers: number;
    botSessions: number;
    pagesPerSession: number;
  };
  frustration: {
    deadClicks: { count: number; percentage: number };
    rageClicks: { count: number; percentage: number };
    excessiveScroll: { count: number; percentage: number };
    quickBacks: { count: number; percentage: number };
  };
  errors: {
    scriptErrors: { count: number; percentage: number };
    errorClicks: { count: number; percentage: number };
  };
  engagement: {
    averageScrollDepth: number;
    totalTimeSeconds: number;
    activeTimeSeconds: number;
  };
  devices: Array<{ name: string; sessionsCount: number }>;
  browsers: Array<{ name: string; sessionsCount: number }>;
  operatingSystems: Array<{ name: string; sessionsCount: number }>;
  countries: Array<{ name: string; sessionsCount: number }>;
  popularPages: Array<{ url: string; visitsCount: number }>;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  healthScore: number;
}

type Tab = 'dashboard' | 'users' | 'workspaces' | 'support' | 'activity' | 'telemetry' | 'settings';

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
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
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
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

const PlatformGrowthChart: React.FC<{ growth?: Stats['growth'] }> = ({ growth }) => {
  const data = growth && growth.length > 0 ? growth : [
    { day: 'Lun', date: '', users: 0, boards: 0, cards: 0 },
    { day: 'Mar', date: '', users: 0, boards: 0, cards: 0 },
    { day: 'Mié', date: '', users: 0, boards: 0, cards: 0 },
    { day: 'Jue', date: '', users: 0, boards: 0, cards: 0 },
    { day: 'Vie', date: '', users: 0, boards: 0, cards: 0 },
    { day: 'Sáb', date: '', users: 0, boards: 0, cards: 0 },
    { day: 'Dom', date: '', users: 0, boards: 0, cards: 0 }
  ];
  
  const rawMax = Math.max(1, ...data.map(d => Math.max(d.users, d.boards, d.cards)));
  const maxVal = Math.max(rawMax, 4);

  return (
    <div className="h-64 flex items-end justify-between gap-2 mt-6 pt-4 border-t border-cu-border dark:border-dark-border relative">
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
        {[4, 3, 2, 1, 0].map(i => (
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
            {/* Users Bar */}
            <div 
              className="w-1/4 max-w-[16px] bg-cyan-400 rounded-t-sm transition-all duration-500 hover:brightness-110 min-h-[3px]" 
              style={{ height: `${Math.max(3, (d.users / maxVal) * 100)}%` }}
              title={`Nuevos Usuarios: ${d.users} (${d.date || d.day})`}
            />
            {/* Boards Bar */}
            <div 
              className="w-1/4 max-w-[16px] bg-emerald-400 rounded-t-sm transition-all duration-500 hover:brightness-110 min-h-[3px]" 
              style={{ height: `${Math.max(3, (d.boards / maxVal) * 100)}%` }}
              title={`Nuevos Tableros: ${d.boards} (${d.date || d.day})`}
            />
            {/* Cards Bar */}
            <div 
              className="w-1/4 max-w-[16px] bg-purple-500 rounded-t-sm transition-all duration-500 hover:brightness-110 min-h-[3px]" 
              style={{ height: `${Math.max(3, (d.cards / maxVal) * 100)}%` }}
              title={`Nuevas Tarjetas: ${d.cards} (${d.date || d.day})`}
            />
          </div>
          <span className="text-xs font-bold text-cu-muted dark:text-zinc-500">{d.day}</span>
        </div>
      ))}
      <div className="absolute top-0 right-0 flex flex-wrap gap-4 text-xs font-bold text-cu-muted dark:text-zinc-400">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></div> Usuarios</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></div> Tableros</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-purple-500"></div> Tarjetas</div>
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
  
  // User detail state
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  // System Activity state
  const [activities, setActivities] = useState<SystemActivityItem[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityCategory, setActivityCategory] = useState<string>('all');
  const [actPage, setActPage] = useState(1);
  const [actPerPage, setActPerPage] = useState(15);

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [userPerPage, setUserPerPage] = useState(10);
  const [wsPage, setWsPage] = useState(1);
  const [wsPerPage, setWsPerPage] = useState(10);

  // Telemetry state
  const [telemetryData, setTelemetryData] = useState<{
    summary: TelemetrySummary;
    boards: TelemetryBoardStat[];
    recentEvents: any[];
  } | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryCopied, setTelemetryCopied] = useState(false);
  const [telemetrySearch, setTelemetrySearch] = useState('');

  // Clarity state
  const [clarityData, setClarityData] = useState<ClarityInsightsData | null>(null);
  const [clarityLoading, setClarityLoading] = useState(false);
  const [clarityRefreshing, setClarityRefreshing] = useState(false);

  // Drive state
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveAuthUrl, setDriveAuthUrl] = useState<string | null>(null);
  const [driveAuthUrlLoading, setDriveAuthUrlLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Primary initial fetch
  useEffect(() => {
    if (user?.globalRole !== 'SYSTEM_ADMIN') {
      navigate('/app');
      return;
    }

    const token = searchParams.get('token');
    const connected = searchParams.get('drive');
    const tabParam = searchParams.get('tab') as Tab;
    if (tabParam && ['dashboard', 'users', 'workspaces', 'support', 'activity', 'telemetry', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
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
    if (activeTab !== 'users') {
      setSelectedUser(null);
      setUserDetails(null);
    }
  }, [searchTerm, activeTab]);

  // Load Real User Details
  const handleSelectUser = useCallback(async (summaryUser: UserSummary) => {
    setSelectedUser(summaryUser);
    setUserDetailsLoading(true);
    try {
      const res = await apiClient.get<{ data: UserDetails }>(`/api/system/users/${summaryUser.id}/details`);
      setUserDetails(res.data);
    } catch (err) {
      console.error('Failed to load user details', err);
    } finally {
      setUserDetailsLoading(false);
    }
  }, []);

  // Toggle user global role
  const handleToggleGlobalRole = useCallback(async () => {
    if (!selectedUser || !userDetails) return;
    const newRole = selectedUser.globalRole === 'SYSTEM_ADMIN' ? 'USER' : 'SYSTEM_ADMIN';
    const confirmMsg = newRole === 'SYSTEM_ADMIN'
      ? `¿Estás seguro de promover a ${selectedUser.name} a SUPER ADMIN? Tendrá acceso total e irrestricto a la plataforma.`
      : `¿Estás seguro de quitar los permisos de Super Admin a ${selectedUser.name}?`;

    if (!window.confirm(confirmMsg)) return;

    setRoleChangeLoading(true);
    try {
      const res = await apiClient.patch<{ data: { user: { id: string; globalRole: string } } }>(
        `/api/system/users/${selectedUser.id}/role`,
        { globalRole: newRole }
      );
      const updatedGlobalRole = res.data.user.globalRole;
      setSelectedUser(prev => prev ? { ...prev, globalRole: updatedGlobalRole } : null);
      setUserDetails(prev => prev ? { ...prev, user: { ...prev.user, globalRole: updatedGlobalRole } } : null);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, globalRole: updatedGlobalRole } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar rol del usuario');
    } finally {
      setRoleChangeLoading(false);
    }
  }, [selectedUser, userDetails]);

  // Fetch Real System Activity
  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await apiClient.get<{ data: { total: number; activities: SystemActivityItem[] } }>(
        '/api/system/activity',
        {
          params: {
            page: actPage,
            limit: actPerPage,
            category: activityCategory,
            search: searchTerm
          }
        }
      );
      setActivities(res.data.activities || []);
      setActivityTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch system activity', err);
    } finally {
      setActivityLoading(false);
    }
  }, [actPage, actPerPage, activityCategory, searchTerm]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [activeTab, fetchActivity]);

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

  // Filtered Users
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

  // Filtered Workspaces
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

  const handleEnterWorkspace = (wsId: string) => {
    localStorage.setItem('lastActiveWorkspaceId', wsId);
    navigate(`/w/${wsId}/dashboard`);
  };

  const fetchTelemetry = useCallback(async () => {
    setTelemetryLoading(true);
    try {
      const res = await apiClient.get<any>('/api/system/telemetry/summary');
      if (res?.data) {
        setTelemetryData(res.data);
      } else if (res?.summary) {
        setTelemetryData(res);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry summary', err);
    } finally {
      setTelemetryLoading(false);
    }
  }, []);

  const fetchClarity = useCallback(async (refresh = false) => {
    if (refresh) setClarityRefreshing(true);
    else setClarityLoading(true);
    try {
      const res = await apiClient.get<any>(`/api/system/clarity/insights${refresh ? '?refresh=true' : ''}`);
      if (res?.data) {
        setClarityData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch clarity insights', err);
    } finally {
      setClarityLoading(false);
      setClarityRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'telemetry') {
      fetchTelemetry();
      fetchClarity();
    }
  }, [activeTab, fetchTelemetry, fetchClarity]);

  const handleExportTelemetryForAI = useCallback(() => {
    if (!telemetryData) return;
    const { summary, boards } = telemetryData;
    const markdownReport = `# INFORME DE TELEMETRÍA Y RENDIMIENTO - LUMINS BOARDS
Fecha de extracción: ${new Date().toLocaleString('es-ES')}
Muestras analizadas: ${summary.totalSamples}
Tableros monitoreados: ${summary.monitoredBoardsCount}

## Resumen Global
- Carga promedio global: ${summary.globalAvgLoadMs} ms
- FPS de arrastre promedio: ${summary.globalAvgFps} FPS
- Tableros Críticos: ${summary.criticalBoardsCount}
- Tableros con Advertencia: ${summary.warningBoardsCount}
- Tableros Óptimos: ${summary.healthyBoardsCount}

## Diagnóstico por Tablero
${boards.map(b => `### Tablero: "${b.boardName}" (ID: ${b.boardId})
- Estado: [${b.health}]
- Problemas detectados: ${b.reasons && b.reasons.length > 0 ? b.reasons.join(', ') : 'Ninguno. Rendimiento óptimo.'}
- Tiempo de carga: Promedio ${b.avgLoadTimeMs}ms | Máximo ${b.maxLoadTimeMs}ms
- Fluidez de arrastre (FPS): Promedio ${b.avgFps} FPS | Mínimo ${b.minFps} FPS
- Volumen de datos: ${b.avgPayloadKb} KB (máx ${b.maxPayloadKb} KB)
- Elementos: ${b.cardCount} tarjetas en ${b.listCount} listas
- Latencia Socket.io: ${b.avgSocketPingMs} ms
- Muestras registradas: ${b.samplesCount}
- Último acceso: ${new Date(b.lastSeen).toLocaleString('es-ES')} por ${b.lastUser ? `${b.lastUser.name} (${b.lastUser.email})` : 'Desconocido'}
`).join('\n')}

---
**Instrucción para el Agente IA:**
Analiza los datos anteriores. Identifica cuellos de botella específicos (por ejemplo si el lag se debe a exceso de tarjetas/payload JSON pesado, imágenes de fondo pesadas, caída de FPS por re-renders innecesarios en dnd-kit, o latencia de red/socket) y sugiere optimizaciones puntuales en el código.
`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(markdownReport);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = markdownReport;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setTelemetryCopied(true);
    setTimeout(() => setTelemetryCopied(false), 3000);
  }, [telemetryData]);

  const filteredTelemetryBoards = useMemo(() => {
    if (!telemetryData) return [];
    if (!telemetrySearch.trim()) return telemetryData.boards;
    const term = telemetrySearch.toLowerCase();
    return telemetryData.boards.filter(b => 
      b.boardName.toLowerCase().includes(term) ||
      b.boardId.toLowerCase().includes(term) ||
      b.reasons.some(r => r.toLowerCase().includes(term))
    );
  }, [telemetryData, telemetrySearch]);

  const tabsMenu = [
    { id: 'dashboard', label: 'Resumen', icon: <BarChart3 size={18} /> },
    { id: 'users', label: 'Usuarios', icon: <Users size={18} /> },
    { id: 'workspaces', label: 'Espacios', icon: <Building2 size={18} /> },
    { id: 'support', label: 'Soporte', icon: <HelpCircle size={18} /> },
    { id: 'activity', label: 'Actividad', icon: <Activity size={18} /> },
    { id: 'telemetry', label: 'Vigilante de Rendimiento', icon: <CircleGauge size={18} /> },
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
      <div className="max-w-[1440px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <Shield size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Super Admin Panel</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Centro de Control Global</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Gestión avanzada de plataforma, usuarios, espacios de trabajo, telemetría y auditoría integral del sistema.
            </p>
          </div>
        </div>

        {/* Top Menu Navigation */}
        <div className="flex overflow-x-auto gap-2 border-b border-cu-border dark:border-dark-border pb-px mb-8 scrollbar-hide">
          {tabsMenu.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id as Tab); setSearchTerm(''); setSelectedUser(null); setUserDetails(null); }}
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
              {/* Primary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                  title="Usuarios Totales" 
                  value={stats?.users || 0} 
                  subtitle={`${stats?.activeUsers || 0} activos en 30 días`} 
                  icon={<Users size={20} />} 
                  color="text-blue-500" 
                />
                <StatCard 
                  title="Espacios de Trabajo" 
                  value={stats?.workspaces || 0} 
                  subtitle="Entornos activos" 
                  icon={<Globe size={20} />} 
                  color="text-purple-500" 
                />
                <StatCard 
                  title="Tableros Totales" 
                  value={stats?.boards || 0} 
                  subtitle="Proyectos y flujos" 
                  icon={<Layout size={20} />} 
                  color="text-emerald-500" 
                />
                <StatCard 
                  title="Tarjetas Totales" 
                  value={stats?.cards || 0} 
                  subtitle={`${stats?.cardsDone || 0} finalizadas`} 
                  icon={<Database size={20} />} 
                  color="text-orange-500" 
                />
              </div>

              {/* Chart & Quick Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-3">
                        <Activity size={20} className="text-cyan-400" />
                        Crecimiento de la plataforma
                      </h2>
                      <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">
                        Usuarios, tableros y tarjetas creados en los últimos 7 días (datos reales).
                      </p>
                    </div>
                  </div>
                  <PlatformGrowthChart growth={stats?.growth} />
                </div>

                <div className="space-y-6">
                  <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                    <h2 className="text-lg font-bold flex items-center gap-3 mb-4">
                      <CircleGauge size={18} className="text-emerald-400" />
                      Métricas de Operación
                    </h2>
                    <div className="space-y-3 text-sm">
                      <SummaryLine label="Usuarios Activos (30d)" value={String(stats?.activeUsers || 0)} icon={<UserRound size={14} />} />
                      <SummaryLine label="Tarjetas Pendientes" value={String(stats?.cardsOpen || 0)} icon={<CheckSquare size={14} />} />
                      <SummaryLine label="Tarjetas Finalizadas" value={String(stats?.cardsDone || 0)} icon={<CheckCircle size={14} />} />
                      <SummaryLine label="Archivos y Adjuntos" value={String(stats?.attachments || 0)} icon={<HardDrive size={14} />} />
                      <SummaryLine label="Almacenamiento Total" value={formatBytes(stats?.storageBytes)} icon={<Database size={14} />} />
                      <SummaryLine label="Comentarios Registrados" value={String(stats?.comments || 0)} icon={<MessageSquare size={14} />} />
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
                      <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">Directorio completo de cuentas registradas en la base de datos.</p>
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
                      <div className="col-span-2">Tableros Propios</div>
                      <div className="col-span-2">Espacios</div>
                      <div className="col-span-2 text-right">Registro</div>
                    </div>
                    <div className="divide-y divide-white/5 min-h-[300px]">
                      {paginatedUsers.length > 0 ? paginatedUsers.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => handleSelectUser(item)} 
                          className="cursor-pointer grid grid-cols-12 gap-3 px-4 py-4 items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                        >
                          <div className="col-span-4 min-w-0 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-cu-text dark:text-zinc-100 truncate group-hover:text-cyan-500 transition-colors">
                                {item.name}
                              </div>
                              <div className="text-xs text-cu-muted dark:text-zinc-500 truncate">{item.email}</div>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              item.globalRole === 'SYSTEM_ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-cyan-500/10 text-cyan-500'
                            }`}>
                              {item.globalRole}
                            </span>
                          </div>
                          <div className="col-span-2 text-sm text-slate-700 dark:text-zinc-300 font-bold">
                            {item.boardsOwned} tableros
                          </div>
                          <div className="col-span-2 text-sm text-slate-700 dark:text-zinc-300 font-bold">
                            {item.workspacesJoined} espacios
                          </div>
                          <div className="col-span-2 text-xs text-cu-muted dark:text-zinc-500 text-right">
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
                    onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                    className="flex items-center gap-2 text-sm font-bold text-cu-muted dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors mb-6"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    Volver al directorio
                  </button>

                  {/* User Profile Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-cyan-500/20">
                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-cu-text dark:text-zinc-100 flex items-center gap-3">
                          {selectedUser.name}
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest font-black ${
                            selectedUser.globalRole === 'SYSTEM_ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-cyan-500/10 text-cyan-500'
                          }`}>
                            {selectedUser.globalRole}
                          </span>
                        </h2>
                        <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">
                          {selectedUser.email} • ID: <span className="font-mono text-xs">{selectedUser.id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleToggleGlobalRole}
                        disabled={roleChangeLoading || selectedUser.id === user?.id}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                          selectedUser.globalRole === 'SYSTEM_ADMIN'
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
                            : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border-cyan-500/20'
                        } disabled:opacity-50`}
                      >
                        <ShieldAlert size={14} />
                        {roleChangeLoading 
                          ? 'Guardando...' 
                          : selectedUser.globalRole === 'SYSTEM_ADMIN' 
                            ? 'Degradar a Usuario Normal' 
                            : 'Promover a Super Admin'}
                      </button>
                    </div>
                  </div>

                  {userDetailsLoading ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                      </div>
                      <Skeleton className="h-64 rounded-2xl" />
                    </div>
                  ) : userDetails ? (
                    <>
                      {/* Real User KPI Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard 
                          title="Tableros Totales" 
                          value={userDetails.boards.length} 
                          subtitle={`${userDetails.boards.filter(b => b.role === 'PROPIETARIO').length} como propietario`}
                          icon={<Layout size={18} />} 
                          color="text-cyan-400" 
                        />
                        <StatCard 
                          title="Espacios de Trabajo" 
                          value={userDetails.workspaces.length} 
                          subtitle="Espacios vinculados"
                          icon={<Building2 size={18} />} 
                          color="text-purple-400" 
                        />
                        <StatCard 
                          title="Colaboradores" 
                          value={userDetails.guests.length} 
                          subtitle="En tableros propios"
                          icon={<Users size={18} />} 
                          color="text-amber-400" 
                        />
                        <StatCard 
                          title="Almacenamiento" 
                          value={0}
                          customValue={formatBytes(userDetails.storageBytes)}
                          subtitle={`${userDetails.attachmentsCount} adjuntos subidos`}
                          icon={<HardDrive size={18} />} 
                          color="text-emerald-400" 
                        />
                      </div>

                      {/* Boards & Collaborators Lists */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Real Boards List */}
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-dark-border rounded-2xl p-5">
                          <h3 className="font-bold flex items-center justify-between mb-4 text-sm">
                            <span className="flex items-center gap-2">
                              <Layers3 size={16} className="text-cyan-500" />
                              Tableros (Propiedad / Acceso Real)
                            </span>
                            <span className="text-xs text-cu-muted dark:text-zinc-500">
                              {userDetails.boards.length} tableros
                            </span>
                          </h3>
                          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-2">
                            {userDetails.boards.length > 0 ? (
                              userDetails.boards.map(b => (
                                <div key={b.id} className="flex justify-between items-center p-3 bg-white dark:bg-black/20 border border-cu-border dark:border-white/10 rounded-xl hover:border-cyan-500/30 transition-all">
                                  <div className="min-w-0 pr-3">
                                    <div className="font-bold text-sm truncate">{b.name}</div>
                                    <div className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase truncate">
                                      {b.workspaceName} • {b.cardsCount} tarjetas
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className={`text-[10px] font-black uppercase ${
                                      b.role === 'PROPIETARIO' || b.role === 'ADMIN' ? 'text-cyan-500' : 'text-slate-500 dark:text-zinc-400'
                                    }`}>
                                      {b.role}
                                    </div>
                                    <div className="text-[10px] text-cu-muted dark:text-zinc-500">{b.membersCount} miembros</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-cu-muted dark:text-zinc-500 py-6 text-center">
                                Este usuario no pertenece a ningún tablero todavía.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Real Guests & Collaborators List */}
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-dark-border rounded-2xl p-5">
                          <h3 className="font-bold flex items-center justify-between mb-4 text-sm">
                            <span className="flex items-center gap-2">
                              <Users size={16} className="text-amber-500" />
                              Colaboradores & Invitados Reales
                            </span>
                            <span className="text-xs text-cu-muted dark:text-zinc-500">
                              {userDetails.guests.length} personas
                            </span>
                          </h3>
                          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-2">
                            {userDetails.guests.length > 0 ? (
                              userDetails.guests.map(g => (
                                <div key={g.id} className="flex justify-between items-center p-3 bg-white dark:bg-black/20 border border-cu-border dark:border-white/10 rounded-xl hover:border-amber-500/30 transition-all">
                                  <div className="min-w-0 pr-3">
                                    <div className="font-bold text-sm truncate">{g.name}</div>
                                    <div className="text-[10px] text-cu-muted dark:text-zinc-500 truncate">{g.email}</div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-[10px] font-black text-amber-500 uppercase">{g.role}</div>
                                    <div className="text-[10px] text-cu-muted dark:text-zinc-500 truncate max-w-[140px]">{g.boardName}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-cu-muted dark:text-zinc-500 py-6 text-center">
                                No hay colaboradores externos o miembros invitados registrados por este usuario.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Workspaces & Recent User Activity */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Workspaces Joined */}
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-dark-border rounded-2xl p-5">
                          <h3 className="font-bold flex items-center gap-2 mb-4 text-sm">
                            <Building2 size={16} className="text-purple-500" />
                            Espacios de Trabajo Vinculados
                          </h3>
                          <div className="space-y-2">
                            {userDetails.workspaces.map(w => (
                              <div key={w.id} className="flex justify-between items-center p-3 bg-white dark:bg-black/20 border border-cu-border dark:border-white/10 rounded-xl">
                                <div>
                                  <div className="font-bold text-sm">{w.name}</div>
                                  <div className="text-[10px] text-cu-muted dark:text-zinc-500">
                                    {w.boardsCount} tableros • {w.membersCount} miembros
                                  </div>
                                </div>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 uppercase">
                                  {w.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent User Audit Logs */}
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-dark-border rounded-2xl p-5">
                          <h3 className="font-bold flex items-center gap-2 mb-4 text-sm">
                            <Activity size={16} className="text-cyan-500" />
                            Última Actividad Registrada
                          </h3>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {userDetails.recentActivity.length > 0 ? (
                              userDetails.recentActivity.map(act => (
                                <div key={act.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-black/20 border border-cu-border dark:border-white/10 rounded-xl text-xs">
                                  <div>
                                    <span className="font-semibold text-slate-700 dark:text-zinc-200">{act.action}</span>
                                    <span className="text-cu-muted dark:text-zinc-500 ml-2">[{act.resource}]</span>
                                  </div>
                                  <span className="text-[10px] text-cu-muted dark:text-zinc-500 font-mono">
                                    {formatRelativeTime(act.createdAt)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-cu-muted dark:text-zinc-500 py-6 text-center">
                                Sin eventos de auditoría registrados recientemente.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
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
                  <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">Gestión global de espacios de trabajo y sus proyectos.</p>
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
                            {ws.totalCards !== undefined && (
                              <div className="flex flex-col">
                                <span className="text-sm font-black">{ws.totalCards}</span>
                                <span className="text-[10px] text-cu-muted dark:text-zinc-500 uppercase">Tarjetas</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-cu-muted dark:text-zinc-500">
                          {new Date(ws.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleEnterWorkspace(ws.id)}
                            className="px-3.5 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 rounded-xl text-xs font-bold hover:bg-purple-600 hover:text-white transition-all inline-flex items-center gap-1.5 shadow-xs"
                            title="Ingresar e impersonar espacio"
                          >
                            <span>Ingresar</span>
                            <ExternalLink size={13} />
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

          {/* ACTIVITY TAB (REAL AUDIT TRAIL) */}
          {activeTab === 'activity' && (
            <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    <Activity size={20} className="text-orange-400" />
                    Actividad Global en Tiempo Real
                  </h2>
                  <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">
                    Auditoría de acciones reales registradas en la base de datos ({activityTotal} eventos).
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  {/* Category Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-cu-border dark:border-white/10 overflow-x-auto text-xs font-bold">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'auth', label: 'Sesiones & Auth' },
                      { id: 'board', label: 'Tableros' },
                      { id: 'card', label: 'Tarjetas' },
                      { id: 'workspace', label: 'Espacios' },
                      { id: 'telemetry', label: 'Telemetría' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setActivityCategory(cat.id); setActPage(1); }}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                          activityCategory === cat.id 
                            ? 'bg-white dark:bg-white/10 text-cu-text dark:text-zinc-100 shadow-sm' 
                            : 'text-cu-muted dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cu-muted dark:text-zinc-500" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por usuario o acción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs focus:bg-slate-200 dark:bg-white/10 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={fetchActivity}
                    disabled={activityLoading}
                    className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-cu-muted dark:text-zinc-400 border border-cu-border dark:border-white/10 transition-all shrink-0"
                    title="Refrescar actividad"
                  >
                    <RefreshCw size={16} className={activityLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-cu-border dark:border-dark-border">
                <div className="divide-y divide-white/5 min-h-[300px]">
                  {activityLoading ? (
                    <div className="p-8 space-y-4">
                      {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
                    </div>
                  ) : activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4 min-w-0 pr-4">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            act.type === 'workspace' ? 'bg-purple-500/20 text-purple-500' :
                            act.type === 'user' ? 'bg-blue-500/20 text-blue-500' :
                            act.type === 'board' ? 'bg-emerald-500/20 text-emerald-500' :
                            act.type === 'card' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-amber-500/20 text-amber-500'
                          }`}>
                            {act.type === 'workspace' && <Building2 size={16} />}
                            {act.type === 'user' && <Users size={16} />}
                            {act.type === 'board' && <Layout size={16} />}
                            {act.type === 'card' && <CheckSquare size={16} />}
                            {act.type === 'system' && <Settings size={16} />}
                          </div>
                          <div className="text-sm min-w-0">
                            <span className="font-bold text-cu-text dark:text-zinc-100">{act.user}</span>
                            <span className="text-slate-500 dark:text-zinc-400 mx-1.5">{act.actionLabel}</span>
                            <span className="font-semibold text-cu-text dark:text-zinc-200 truncate">{act.target}</span>
                            {act.ipAddress && (
                              <span className="ml-2 text-[10px] text-cu-muted dark:text-zinc-500 font-mono hidden sm:inline">
                                ({act.ipAddress})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-cu-muted dark:text-zinc-500 whitespace-nowrap shrink-0">
                          {formatRelativeTime(act.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-16 flex flex-col items-center justify-center text-center text-sm text-cu-muted dark:text-zinc-500">
                      <Activity size={32} className="opacity-20 mb-3" />
                      <p>No se encontraron registros de actividad con los filtros seleccionados.</p>
                    </div>
                  )}
                </div>
                <Pagination 
                  total={activityTotal} 
                  page={actPage} 
                  perPage={actPerPage} 
                  onPageChange={setActPage} 
                  onPerPageChange={setActPerPage} 
                />
              </div>
            </div>
          )}

          {/* SUPPORT TICKETS TAB */}
          {activeTab === 'support' && (
            <SupportTicketsAdmin />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                <h2 className="text-xl font-bold flex items-center gap-3 mb-2">
                  <Settings size={20} className="text-slate-400" />
                  Configuraciones Globales del Sistema
                </h2>
                <p className="text-sm text-cu-muted dark:text-zinc-500 mb-6">
                  Administra las integraciones de la plataforma y el almacenamiento técnico a nivel de servidor.
                </p>

                {/* Google Drive Config Section */}
                <div className="border border-cu-border dark:border-dark-border rounded-2xl overflow-hidden mb-6">
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

                {/* System Storage & Database Summary */}
                <div className="border border-cu-border dark:border-dark-border rounded-2xl overflow-hidden p-6 bg-slate-50 dark:bg-white/[0.02]">
                  <h3 className="font-bold flex items-center gap-2 text-sm mb-4">
                    <Database size={16} className="text-cyan-500" />
                    Resumen de Base de Datos y Almacenamiento
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-cu-border dark:border-white/10">
                      <span className="text-cu-muted dark:text-zinc-500 block mb-1">Almacenamiento Total</span>
                      <span className="font-black text-sm">{formatBytes(stats?.storageBytes)}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-cu-border dark:border-white/10">
                      <span className="text-cu-muted dark:text-zinc-500 block mb-1">Archivos Adjuntos</span>
                      <span className="font-black text-sm">{stats?.attachments || 0} archivos</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-cu-border dark:border-white/10">
                      <span className="text-cu-muted dark:text-zinc-500 block mb-1">Comentarios Guardados</span>
                      <span className="font-black text-sm">{stats?.comments || 0} registros</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TELEMETRY TAB */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Telemetry Header */}
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-500 font-black text-xs uppercase tracking-widest mb-1">
                      <CircleGauge size={18} />
                      Vigilante Activo
                    </div>
                    <h2 className="text-2xl font-black text-cu-text dark:text-zinc-100">
                      Rendimiento & Telemetría en Tiempo Real
                    </h2>
                    <p className="text-sm text-cu-muted dark:text-zinc-400 mt-1 max-w-2xl">
                      Métricas recolectadas de forma silenciosa e imperceptible dentro de los tableros. Diagnostica caídas de FPS al arrastrar, tiempos de carga lentos y sobrecarga de datos.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={fetchTelemetry}
                      disabled={telemetryLoading}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-cu-border dark:border-white/10"
                      title="Actualizar datos"
                    >
                      <RefreshCw size={14} className={telemetryLoading ? 'animate-spin' : ''} />
                      {telemetryLoading ? 'Actualizando...' : 'Refrescar'}
                    </button>
                    <button
                      onClick={handleExportTelemetryForAI}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm shadow-cyan-500/25 active:scale-95"
                      title="Copiar diagnóstico listo para ser analizado por un Agente IA"
                    >
                      {telemetryCopied ? (
                        <>
                          <Check size={16} className="text-white" />
                          ¡Informe Copiado!
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="text-amber-300" />
                          Exportar para Agente IA
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-cu-muted dark:text-zinc-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Carga Promedio</span>
                      <Clock3 size={16} className="text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-cu-text dark:text-zinc-100">
                      {telemetryData ? `${telemetryData.summary.globalAvgLoadMs} ms` : '—'}
                    </div>
                    <p className="text-[11px] text-cu-muted dark:text-zinc-500 mt-1">Tiempo de montaje del tablero</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-cu-muted dark:text-zinc-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">FPS Arrastre (DnD)</span>
                      <Zap size={16} className="text-emerald-400" />
                    </div>
                    <div className={`text-2xl font-black ${
                      (telemetryData?.summary.globalAvgFps || 60) >= 50 ? 'text-emerald-500' :
                      (telemetryData?.summary.globalAvgFps || 60) >= 30 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {telemetryData ? `${telemetryData.summary.globalAvgFps} FPS` : '—'}
                    </div>
                    <p className="text-[11px] text-cu-muted dark:text-zinc-500 mt-1">Fluidez en drag-and-drop</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-cu-muted dark:text-zinc-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Tableros con Alerta</span>
                      <AlertTriangle size={16} className="text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-cu-text dark:text-zinc-100">
                      {telemetryData ? (
                        <span>
                          {telemetryData.summary.criticalBoardsCount + telemetryData.summary.warningBoardsCount}
                          <span className="text-xs font-normal text-cu-muted dark:text-zinc-500 ml-1.5">
                            de {telemetryData.summary.monitoredBoardsCount}
                          </span>
                        </span>
                      ) : '—'}
                    </div>
                    <p className="text-[11px] text-cu-muted dark:text-zinc-500 mt-1">
                      {telemetryData?.summary.criticalBoardsCount || 0} críticos · {telemetryData?.summary.warningBoardsCount || 0} advertencias
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-cu-muted dark:text-zinc-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Muestras Totales</span>
                      <Activity size={16} className="text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-cu-text dark:text-zinc-100">
                      {telemetryData ? telemetryData.summary.totalSamples : '—'}
                    </div>
                    <p className="text-[11px] text-cu-muted dark:text-zinc-500 mt-1">
                      Eventos registrados en auditoría
                    </p>
                  </div>
                </div>
              </div>

              {/* MICROSOFT CLARITY UX & FRUSTRATION METRICS */}
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Activity size={12} />
                        Microsoft Clarity
                      </span>
                      {clarityData?.configured && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          clarityData.healthStatus === 'HEALTHY'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : clarityData.healthStatus === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {clarityData.healthStatus === 'HEALTHY' ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                          Salud UX: {clarityData.healthScore}/100 · {clarityData.healthStatus === 'HEALTHY' ? 'Óptima' : clarityData.healthStatus === 'WARNING' ? 'Fricción Moderada' : 'Atención Requerida'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-cu-text dark:text-zinc-100">
                      Experiencia de Usuario & Fricción en Vivo (Últimas 24h)
                    </h3>
                    <p className="text-xs text-cu-muted dark:text-zinc-400 mt-1">
                      Métricas reales de interacción y comportamiento analizadas por la Data Export API de Microsoft Clarity.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => fetchClarity(true)}
                      disabled={clarityLoading || clarityRefreshing || !clarityData?.canRefresh}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        clarityData?.canRefresh
                          ? 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 border-cu-border dark:border-white/10'
                          : 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-white/[0.02] text-cu-muted border-transparent'
                      }`}
                      title={clarityData?.canRefresh ? 'Actualizar métricas de Clarity' : `En caché para proteger el límite de 10 peticiones/día de Clarity (Próximo en ${clarityData?.nextAllowedRefreshMinutes || 15} min)`}
                    >
                      <RefreshCw size={13} className={clarityRefreshing ? 'animate-spin' : ''} />
                      {clarityRefreshing ? 'Actualizando...' : 'Sincronizar'}
                    </button>
                    <a
                      href="https://clarity.microsoft.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#6C5DD3]/10 hover:bg-[#6C5DD3]/20 text-[#6C5DD3] dark:text-[#A599F9] border border-[#6C5DD3]/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>Abrir Clarity</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {clarityLoading && !clarityData ? (
                  <div className="py-10 text-center text-cu-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-cyan-500" />
                    <p className="text-xs font-medium">Cargando métricas de Microsoft Clarity...</p>
                  </div>
                ) : !clarityData?.configured ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-300 text-xs">
                    <p className="font-bold mb-1">Clarity API Token no configurado</p>
                    <p className="opacity-90">Añade <code>CLARITY_API_TOKEN</code> en el archivo <code>.env</code> para activar la telemetría de UX en tiempo real.</p>
                  </div>
                ) : (
                  <>
                    {/* 4 Frustration & Reliability Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {/* Rage Clicks */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-cu-muted dark:text-zinc-400">
                            Clics de Rabia (Rage)
                          </span>
                          <Flame size={16} className={clarityData.frustration.rageClicks.count > 10 ? 'text-rose-500' : 'text-amber-500'} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-cu-text dark:text-zinc-100">
                            {clarityData.frustration.rageClicks.count}
                          </span>
                          <span className="text-xs font-bold text-cu-muted dark:text-zinc-400">
                            ({clarityData.frustration.rageClicks.percentage}% sesiones)
                          </span>
                        </div>
                        <p className="text-[10px] text-cu-muted dark:text-zinc-500 mt-1">
                          Clics rápidos cuando un elemento no responde
                        </p>
                      </div>

                      {/* Dead Clicks */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-cu-muted dark:text-zinc-400">
                            Clics Muertos (Dead)
                          </span>
                          <MousePointerClick size={16} className="text-blue-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-cu-text dark:text-zinc-100">
                            {clarityData.frustration.deadClicks.count}
                          </span>
                          <span className="text-xs font-bold text-cu-muted dark:text-zinc-400">
                            ({clarityData.frustration.deadClicks.percentage}% sesiones)
                          </span>
                        </div>
                        <p className="text-[10px] text-cu-muted dark:text-zinc-500 mt-1">
                          Clics en textos o zonas estáticas sin acción
                        </p>
                      </div>

                      {/* Quick Backs */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-cu-muted dark:text-zinc-400">
                            Abandonos Rápidos
                          </span>
                          <Compass size={16} className="text-purple-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-cu-text dark:text-zinc-100">
                            {clarityData.frustration.quickBacks.count}
                          </span>
                          <span className="text-xs font-bold text-cu-muted dark:text-zinc-400">
                            ({clarityData.frustration.quickBacks.percentage}% sesiones)
                          </span>
                        </div>
                        <p className="text-[10px] text-cu-muted dark:text-zinc-500 mt-1">
                          Páginas de donde el usuario retrocede de inmediato
                        </p>
                      </div>

                      {/* Script Errors */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-cu-border dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-cu-muted dark:text-zinc-400">
                            Errores JS en Clientes
                          </span>
                          <Bug size={16} className={clarityData.errors.scriptErrors.count > 0 ? 'text-rose-500' : 'text-emerald-500'} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-cu-text dark:text-zinc-100">
                            {clarityData.errors.scriptErrors.count}
                          </span>
                          <span className="text-xs font-bold text-cu-muted dark:text-zinc-400">
                            ({clarityData.errors.scriptErrors.percentage}% sesiones)
                          </span>
                        </div>
                        <p className="text-[10px] text-cu-muted dark:text-zinc-500 mt-1">
                          Fallos no controlados capturados en navegadores
                        </p>
                      </div>
                    </div>

                    {/* Metadata Strip: Traffic, Devices & Browsers */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-cu-border dark:border-dark-border text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-cu-muted dark:text-zinc-400">
                        <div>
                          <strong className="text-cu-text dark:text-zinc-200 font-extrabold">{clarityData.traffic.totalSessions}</strong> sesiones analizadas
                        </div>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <div>
                          <strong className="text-cu-text dark:text-zinc-200 font-extrabold">{clarityData.traffic.distinctUsers}</strong> usuarios únicos
                        </div>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <div>
                          <strong className="text-cu-text dark:text-zinc-200 font-extrabold">{clarityData.traffic.pagesPerSession}</strong> págs / sesión
                        </div>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <div>
                          Scroll prom: <strong className="text-cu-text dark:text-zinc-200 font-extrabold">{clarityData.engagement.averageScrollDepth}%</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-cu-muted dark:text-zinc-500">
                        <span>Actualizado {formatRelativeTime(clarityData.lastUpdated)}</span>
                        {clarityData.cached && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-semibold text-zinc-500">
                            Caché anti-cuota activo
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Table of Monitored Boards */}
              <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-cu-text dark:text-zinc-100">
                      Diagnóstico de Tableros Monitoreados
                    </h3>
                    <p className="text-xs text-cu-muted dark:text-zinc-500 mt-0.5">
                      Ordenados por prioridad de problemas detectados
                    </p>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cu-muted dark:text-zinc-500" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por tablero o síntoma..."
                      value={telemetrySearch}
                      onChange={(e) => setTelemetrySearch(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-cu-border dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs focus:bg-slate-200 dark:bg-white/10 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-cu-border dark:border-dark-border">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-white/5 text-[10px] uppercase tracking-widest text-cu-muted dark:text-zinc-400 border-b border-cu-border dark:border-dark-border">
                        <th className="py-3 px-4 font-black">Tablero</th>
                        <th className="py-3 px-4 font-black">Estado de Salud</th>
                        <th className="py-3 px-4 font-black">Carga</th>
                        <th className="py-3 px-4 font-black">FPS Arrastre</th>
                        <th className="py-3 px-4 font-black">Peso Datos</th>
                        <th className="py-3 px-4 font-black">Tarjetas / Listas</th>
                        <th className="py-3 px-4 font-black">Ping Socket</th>
                        <th className="py-3 px-4 font-black">Muestras</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {filteredTelemetryBoards.length > 0 ? (
                        filteredTelemetryBoards.map((b) => (
                          <tr key={b.boardId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-cu-text dark:text-zinc-100">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm truncate max-w-[200px]" title={b.boardName}>{b.boardName}</span>
                                <span className="text-[10px] text-cu-muted dark:text-zinc-500 font-mono truncate max-w-[160px]">
                                  {b.boardId}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-start gap-1">
                                {b.health === 'CRITICAL' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Crítico
                                  </span>
                                ) : b.health === 'WARNING' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Advertencia
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Óptimo
                                  </span>
                                )}
                                {b.reasons && b.reasons.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 max-w-[260px]">
                                    {b.reasons.map((r, ri) => (
                                      <span key={ri} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-white/5 text-cu-muted dark:text-zinc-400 font-medium">
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className={`font-bold ${b.avgLoadTimeMs > 2000 ? 'text-rose-400' : b.avgLoadTimeMs > 1200 ? 'text-amber-400' : 'text-cu-text dark:text-zinc-200'}`}>
                                  {b.avgLoadTimeMs} ms
                                </span>
                                <span className="text-[10px] text-cu-muted dark:text-zinc-500">
                                  máx {b.maxLoadTimeMs} ms
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className={`font-bold ${b.avgFps < 30 ? 'text-rose-500' : b.avgFps < 45 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {b.avgFps} FPS
                                </span>
                                <span className="text-[10px] text-cu-muted dark:text-zinc-500">
                                  mín {b.minFps} FPS
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <span className={`font-semibold ${b.avgPayloadKb > 500 ? 'text-amber-500' : 'text-cu-text dark:text-zinc-300'}`}>
                                  {b.avgPayloadKb} KB
                                </span>
                                <span className="text-[10px] text-cu-muted dark:text-zinc-500">
                                  máx {b.maxPayloadKb} KB
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-300">
                              <span className="font-bold">{b.cardCount}</span> cards / <span className="font-medium text-cu-muted dark:text-zinc-400">{b.listCount} listas</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-300 font-mono">
                              {b.avgSocketPingMs > 0 ? `${b.avgSocketPingMs} ms` : '—'}
                            </td>
                            <td className="py-3.5 px-4 text-cu-muted dark:text-zinc-400 font-mono text-center">
                              {b.samplesCount}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-14 text-center text-cu-muted dark:text-zinc-500">
                            <CircleGauge size={32} className="opacity-20 mx-auto mb-3" />
                            <p className="font-medium">
                              {telemetryLoading ? 'Cargando datos del vigilante...' : 'Aún no hay datos de telemetría registrados.'}
                            </p>
                            <p className="text-[11px] opacity-75 mt-1 max-w-sm mx-auto">
                              A medida que los usuarios abran tableros o muevan tarjetas, el vigilante recopilará y catalogará el rendimiento aquí automáticamente.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  customValue?: string;
  subtitle?: string; 
  icon: React.ReactNode; 
  color: string 
}> = ({ title, value, customValue, subtitle, icon, color }) => (
  <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 flex flex-col justify-between h-36 hover:border-cyan-500/30 transition-all group">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-[11px] font-black text-cu-muted dark:text-zinc-500 uppercase tracking-widest">{title}</span>
    </div>
    <div>
      <div className="text-3xl font-black tracking-tighter">
        {customValue !== undefined ? customValue : value.toLocaleString()}
      </div>
      {subtitle && (
        <div className="text-xs text-cu-muted dark:text-zinc-500 mt-1 font-medium truncate">
          {subtitle}
        </div>
      )}
    </div>
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
