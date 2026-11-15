import React from 'react';
import {
  Users,
  Globe,
  Layout,
  Database,
  Activity,
  CircleGauge,
  UserRound,
  Clock3,
  CheckCircle,
  FileText,
  HardDrive,
} from 'lucide-react';
import { formatBytes, type AdminStats } from './types';

interface AdminOverviewTabProps {
  stats: AdminStats | null;
}

const StatCard: React.FC<{
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 flex flex-col justify-between h-36 hover:border-[#12A9A8]/35 transition-all group">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-cu-muted dark:text-zinc-500">
        {title}
      </span>
    </div>
    <div>
      <div className="text-3xl font-black tracking-tight">{value.toLocaleString()}</div>
      <div className="text-xs text-cu-muted dark:text-zinc-500 font-medium mt-0.5">{subtitle}</div>
    </div>
  </div>
);

const SummaryLine: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-cu-border dark:border-white/5">
    <div className="flex items-center gap-2.5 text-cu-muted dark:text-zinc-400">
      <span className="text-[#12A9A8] bg-[#12A9A8]/10 p-1.5 rounded-lg">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
    <span className="font-bold text-cu-text dark:text-zinc-100">{value}</span>
  </div>
);

const PlatformGrowthChart: React.FC<{ growth?: AdminStats['growth'] }> = ({ growth }) => {
  const data =
    growth && growth.length > 0
      ? growth
      : [
          { day: 'Lun', date: '', users: 0, boards: 0, cards: 0 },
          { day: 'Mar', date: '', users: 0, boards: 0, cards: 0 },
          { day: 'Mié', date: '', users: 0, boards: 0, cards: 0 },
          { day: 'Jue', date: '', users: 0, boards: 0, cards: 0 },
          { day: 'Vie', date: '', users: 0, boards: 0, cards: 0 },
          { day: 'Sáb', date: '', users: 0, boards: 0, cards: 0 },
          { day: 'Dom', date: '', users: 0, boards: 0, cards: 0 },
        ];

  const rawMax = Math.max(...data.flatMap((d) => [d.users, d.boards, d.cards]), 1);
  const maxVal = Math.max(4, Math.ceil(rawMax * 1.2));

  return (
    <div className="h-64 flex items-end justify-between gap-2 pt-8 pb-2 px-4 relative mt-4">
      <div className="absolute inset-x-4 top-8 bottom-8 flex flex-col justify-between pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-b border-black/5 dark:border-white/5 flex items-center">
            <span className="text-[10px] text-cu-muted dark:text-zinc-600 -ml-4 -mt-3">
              {Math.round(maxVal - i * (maxVal / 4))}
            </span>
          </div>
        ))}
      </div>

      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1 z-10">
          <div className="flex gap-1 items-end h-48 w-full justify-center">
            <div
              className="w-1/4 max-w-[16px] bg-[#12A9A8] rounded-t-sm transition-all duration-500 hover:brightness-110 min-h-[3px]"
              style={{ height: `${Math.max(3, (d.users / maxVal) * 100)}%` }}
              title={`Nuevos Usuarios: ${d.users} (${d.date || d.day})`}
            />
            <div
              className="w-1/4 max-w-[16px] bg-[#FFCC40] rounded-t-sm transition-all duration-500 hover:brightness-110 min-h-[3px]"
              style={{ height: `${Math.max(3, (d.boards / maxVal) * 100)}%` }}
              title={`Nuevos Tableros: ${d.boards} (${d.date || d.day})`}
            />
            <div
              className="w-1/4 max-w-[16px] bg-[#FF665E] rounded-t-sm transition-all duration-500 hover:brightness-110 min-h-[3px]"
              style={{ height: `${Math.max(3, (d.cards / maxVal) * 100)}%` }}
              title={`Nuevas Tarjetas: ${d.cards} (${d.date || d.day})`}
            />
          </div>
          <span className="text-xs font-bold text-cu-muted dark:text-zinc-500">{d.day}</span>
        </div>
      ))}
      <div className="absolute top-0 right-0 flex flex-wrap gap-4 text-xs font-bold text-cu-muted dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#12A9A8]" /> Usuarios
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#FFCC40]" /> Tableros
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#FF665E]" /> Tarjetas
        </div>
      </div>
    </div>
  );
};

const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ stats }) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Usuarios Totales"
          value={stats?.users || 0}
          subtitle={`${stats?.activeUsers || 0} activos en 30 días`}
          icon={<Users size={20} />}
          color="text-[#12A9A8]"
        />
        <StatCard
          title="Espacios de Trabajo"
          value={stats?.workspaces || 0}
          subtitle="Entornos activos"
          icon={<Globe size={20} />}
          color="text-[#FF665E]"
        />
        <StatCard
          title="Tableros Totales"
          value={stats?.boards || 0}
          subtitle="Proyectos y flujos"
          icon={<Layout size={20} />}
          color="text-[#12A9A8]"
        />
        <StatCard
          title="Tarjetas Totales"
          value={stats?.cards || 0}
          subtitle={`${stats?.cardsDone || 0} finalizadas`}
          icon={<Database size={20} />}
          color="text-[#FFCC40]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Activity size={20} className="text-[#12A9A8]" />
              Crecimiento de la plataforma
            </h2>
            <p className="text-sm text-cu-muted dark:text-zinc-500 mt-1">
              Usuarios, tableros y tarjetas creados en los últimos 7 días (datos reales).
            </p>
          </div>
          <PlatformGrowthChart growth={stats?.growth} />
        </div>

        <div className="space-y-6">
          <div className="bg-cu-surface dark:bg-dark-surface shadow-sm border border-cu-border dark:border-dark-border rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold flex items-center gap-3 mb-4">
              <CircleGauge size={18} className="text-[#12A9A8]" />
              Métricas de Operación
            </h2>
            <div className="space-y-3 text-sm">
              <SummaryLine
                label="Usuarios Activos (30d)"
                value={String(stats?.activeUsers || 0)}
                icon={<UserRound size={14} />}
              />
              <SummaryLine
                label="Tarjetas Pendientes"
                value={String(stats?.cardsOpen || 0)}
                icon={<Clock3 size={14} />}
              />
              <SummaryLine
                label="Tarjetas Finalizadas"
                value={String(stats?.cardsDone || 0)}
                icon={<CheckCircle size={14} />}
              />
              <SummaryLine
                label="Archivos y Adjuntos"
                value={String(stats?.attachments || 0)}
                icon={<FileText size={14} />}
              />
              <SummaryLine
                label="Almacenamiento Total"
                value={formatBytes(stats?.storageBytes || 0)}
                icon={<HardDrive size={14} />}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOverviewTab;
