import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield,
  ExternalLink,
  BarChart3,
  UsersRound,
  Building2,
  HelpCircle,
  Activity,
  CircleGauge,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';
import SupportTicketsAdmin from '../components/admin/SupportTicketsAdmin';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminWorkspacesTab from '../components/admin/AdminWorkspacesTab';
import AdminActivityTab from '../components/admin/AdminActivityTab';
import AdminTelemetryTab from '../components/admin/AdminTelemetryTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import {
  clearImpersonatedWorkspace,
  setImpersonatedWorkspace,
} from '../lib/superAdminImpersonation';
import type {
  AdminStats,
  AdminWorkspace,
  AdminUserSummary,
  AdminUserDetails,
  AdminTelemetryData,
  AdminClarityData,
} from '../components/admin/types';

type Tab = 'overview' | 'users' | 'workspaces' | 'support' | 'activity' | 'telemetry' | 'settings';

const SystemAdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'overview';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [telemetryData, setTelemetryData] = useState<AdminTelemetryData | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [clarityData, setClarityData] = useState<AdminClarityData | null>(null);
  const [clarityLoading, setClarityLoading] = useState(false);

  const [driveConnected, setDriveConnected] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  const fetchCoreData = useCallback(async () => {
    try {
      const [statsRes, wsRes, usersRes, driveRes] = await Promise.all([
        apiClient.get<{ data: AdminStats }>('/api/system/stats'),
        apiClient.get<{ data: { workspaces: AdminWorkspace[] } }>('/api/system/workspaces'),
        apiClient.get<{ data: { users: AdminUserSummary[] } }>('/api/system/users'),
        apiClient.get<{ data: { connected: boolean; folderId: string } }>('/api/system/drive/status'),
      ]);
      setStats(statsRes.data);
      setWorkspaces(wsRes.data.workspaces || []);
      setUsers(usersRes.data.users || []);
      setDriveConnected(Boolean(driveRes.data?.connected));
      setDriveFolderId(driveRes.data?.folderId || null);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user as any).globalRole !== 'SYSTEM_ADMIN') {
      navigate('/app');
      return;
    }
    void fetchCoreData();
  }, [user, navigate, fetchCoreData]);

  const fetchUserDetailsById = useCallback(async (userId: string) => {
    setLoadingDetails(true);
    try {
      const res = await apiClient.get<{ data: AdminUserDetails }>(
        `/api/system/users/${userId}/details`
      );
      setUserDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch user details', err);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const handleSelectUser = (u: AdminUserSummary) => {
    setSelectedUser(u);
    void fetchUserDetailsById(u.id);
  };

  const handleEnterWorkspace = (ws: AdminWorkspace) => {
    const isOwn = ws.owner?.id === user?.id;
    if (isOwn) {
      clearImpersonatedWorkspace();
      localStorage.setItem('lastActiveWorkspaceId', ws.id);
    } else {
      setImpersonatedWorkspace({
        id: ws.id,
        name: ws.name,
        ownerName: ws.owner?.name,
        ownerEmail: ws.owner?.email,
      });
    }
    navigate(`/w/${ws.id}/dashboard`);
  };

  const fetchTelemetry = useCallback(async () => {
    setTelemetryLoading(true);
    try {
      const res = await apiClient.get<{ data: AdminTelemetryData }>('/api/system/telemetry/summary');
      if (res?.data) setTelemetryData(res.data);
    } catch (err) {
      console.error('Failed to fetch telemetry summary', err);
    } finally {
      setTelemetryLoading(false);
    }
  }, []);

  const fetchClarity = useCallback(async (force = false) => {
    setClarityLoading(true);
    try {
      const res = await apiClient.get<{ data: AdminClarityData }>(
        `/api/system/clarity/insights${force ? '?refresh=true' : ''}`
      );
      if (res?.data) setClarityData(res.data);
    } catch (err) {
      console.error('Failed to fetch clarity insights', err);
    } finally {
      setClarityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'telemetry') {
      void fetchTelemetry();
      void fetchClarity(false);
    }
  }, [activeTab, fetchTelemetry, fetchClarity]);

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const tabsMenu: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Resumen', icon: <BarChart3 size={16} /> },
    { id: 'users', label: 'Usuarios', icon: <UsersRound size={16} /> },
    { id: 'workspaces', label: 'Espacios', icon: <Building2 size={16} /> },
    { id: 'support', label: 'Soporte', icon: <HelpCircle size={16} /> },
    { id: 'activity', label: 'Actividad', icon: <Activity size={16} /> },
    { id: 'telemetry', label: 'Vigilante de Rendimiento', icon: <CircleGauge size={16} /> },
    { id: 'settings', label: 'Configuraciones', icon: <Settings size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex-1 bg-cu-bg dark:bg-dark-bg min-h-screen text-cu-text dark:text-zinc-100 p-6 sm:p-10 font-sans">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-cu-bg dark:bg-dark-bg min-h-screen text-cu-text dark:text-zinc-100 p-6 sm:p-10 font-sans">
      <div className="max-w-[1440px] mx-auto">
        {/* Header Lumins */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 mb-8 shadow-xs">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FF665E] via-[#12A9A8] to-[#FFCC40]" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FF665E]/10 border border-[#FF665E]/25 text-[#FF665E] mb-3">
                <Shield size={14} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                  Super Admin Panel
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Centro de Control Global
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Gestión avanzada de plataforma, usuarios, sesiones, integraciones, notificaciones y auditoría integral del sistema.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                clearImpersonatedWorkspace();
                try {
                  const res = await apiClient.get<{ data: { workspaces: Array<{ id: string; ownerId?: string }> } }>('/api/workspaces');
                  const mySpaces = res?.data?.workspaces || [];
                  const savedId = localStorage.getItem('lastActiveWorkspaceId');
                  const target =
                    mySpaces.find((w) => w.id === savedId) ||
                    mySpaces.find((w) => w.ownerId === user?.id) ||
                    mySpaces[0];
                  if (target) {
                    localStorage.setItem('lastActiveWorkspaceId', target.id);
                    navigate(`/w/${target.id}/dashboard`);
                    return;
                  }
                } catch {
                  // fallback abajo
                }
                const ownFromGlobal = workspaces.find((w) => w.owner?.id === user?.id);
                if (ownFromGlobal) {
                  localStorage.setItem('lastActiveWorkspaceId', ownFromGlobal.id);
                  navigate(`/w/${ownFromGlobal.id}/dashboard`);
                } else {
                  localStorage.removeItem('lastActiveWorkspaceId');
                  navigate('/workspaces');
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-[#12A9A8] hover:bg-[#0e8f8e] text-white text-xs font-bold transition-all shadow-sm shadow-[#12A9A8]/20 inline-flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <ExternalLink size={14} />
              Ir a mi espacio
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-cu-border dark:border-dark-border pb-px mb-8 scrollbar-hide">
          {tabsMenu.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'border-[#12A9A8] text-[#12A9A8]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Active Tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <AdminOverviewTab stats={stats} />}

          {activeTab === 'users' && (
            <AdminUsersTab
              users={users}
              currentUserId={user?.id}
              selectedUser={selectedUser}
              userDetails={userDetails}
              loadingDetails={loadingDetails}
              onSelectUser={handleSelectUser}
              onUsersUpdated={() => void fetchCoreData()}
              onRefreshSelectedUser={(id) => void fetchUserDetailsById(id)}
            />
          )}

          {activeTab === 'workspaces' && (
            <AdminWorkspacesTab
              workspaces={workspaces}
              currentUserId={user?.id}
              onEnterWorkspace={handleEnterWorkspace}
            />
          )}

          {activeTab === 'support' && <SupportTicketsAdmin />}

          {activeTab === 'activity' && (
            <AdminActivityTab users={users} workspaces={workspaces} />
          )}

          {activeTab === 'telemetry' && (
            <AdminTelemetryTab
              telemetryData={telemetryData}
              telemetryLoading={telemetryLoading}
              clarityData={clarityData}
              clarityLoading={clarityLoading}
              onRefreshTelemetry={() => void fetchTelemetry()}
              onRefreshClarity={(force) => void fetchClarity(force)}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              driveConnected={driveConnected}
              driveFolderId={driveFolderId}
              onDriveRefresh={() => void fetchCoreData()}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SystemAdminPage;
