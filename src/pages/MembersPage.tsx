import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Search, Mail, Shield, Layout, MoreHorizontal, UserPlus, ChevronRight, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '../lib/api-client';
import type { Workspace } from '../types/workspace';
import Button from '../components/ui/Button';
import InviteMembersModal from '../components/InviteMembersModal';
import MemberSlideOver from '../components/MemberSlideOver';
import { motion } from 'framer-motion';
import type { WorkspaceMember, WorkspaceRole } from '../types/workspace';
import { Skeleton } from '../components/ui/Skeleton';
import UserAvatar from '../components/ui/UserAvatar';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';

const MembersPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);
  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    if (!workspaceRef.current) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await apiClient.get<{ data: { workspace: Workspace } }>(`/api/workspaces/${workspaceId}`);
      setWorkspace(response.data.workspace);
      
      // Update selectedMember if it's currently open to reflect any role/access changes
      setSelectedMember(prev => {
        if (!prev) return null;
        return response.data.workspace.members.find(m => m.userId === prev.userId) || null;
      });
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [workspaceId]); // Removed workspace from dependencies

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const currentUserRole = workspace?.members.find(m => m.userId === user?.id)?.role;
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const handleRoleChange = async (targetUserId: string, newRole: WorkspaceRole) => {
    if (!workspaceId) return;
    setIsUpdating(targetUserId);
    try {
      await apiClient.patch(`/api/workspaces/${workspaceId}/members/${targetUserId}`, { role: newRole });
      toast.success('Rol actualizado correctamente');
      fetchWorkspace();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo actualizar el rol' });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!workspaceId || !window.confirm(`¿Estás seguro de que deseas eliminar a ${name} del espacio de trabajo?`)) return;
    try {
      await apiClient.delete(`/api/workspaces/${workspaceId}/members/${targetUserId}`);
      toast.success('Miembro eliminado');
      fetchWorkspace();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo eliminar al miembro' });
    }
  };

  const filteredMembers = workspace?.members.filter(member => 
    member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-10 font-sans max-w-[1600px] mx-auto w-full">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-10">
           <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-64" />
           </div>
           <div className="flex gap-3">
              <Skeleton className="h-10 w-64 rounded" />
              <Skeleton className="h-10 w-24 rounded" />
           </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded border border-zinc-100 shadow-xl overflow-hidden">
           <div className="bg-[#F8F9FB] border-b border-zinc-100 px-6 py-4 flex gap-8">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-32" />
           </div>
           <div className="divide-y divide-zinc-50">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="px-6 py-5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded" />
                      <div className="space-y-1.5">
                         <Skeleton className="h-4 w-32" />
                         <Skeleton className="h-3 w-48" />
                      </div>
                   </div>
                   <Skeleton className="h-6 w-20 rounded" />
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-10">
        <WorkspaceEmptyState 
          onCreateClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))} 
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex-1 p-4 sm:p-6 lg:p-10 font-sans max-w-[1600px] mx-auto w-full transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#6C5DD3] mb-1">
            <Users size={18} strokeWidth={2.5} />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">Gestión de Equipo</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Miembros del Equipo</h1>
            {isRefreshing && (
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6C5DD3]/5 border border-[#6C5DD3]/10 text-[#6C5DD3] animate-in fade-in zoom-in duration-300">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Actualizando</span>
               </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
            <input 
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#6C5DD3] transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>
           <Button 
            onClick={() => setShowInviteModal(true)}
            className="bg-[#6C5DD3] hover:bg-[#312e81] text-white rounded px-5 py-2.5 flex items-center gap-2 shadow-md shadow-[#6C5DD3]/20 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Invitar</span>
          </Button>
        </div>
      </div>

      {/* Members List Container */}
      <div className="bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        
        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rol en Espacio</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acciones</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {filteredMembers.map((member, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  key={member.id} 
                  className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4" onClick={() => setSelectedMember(member)}>
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className="w-10 h-10">
                        <UserAvatar 
                          user={member.user} 
                          size="md" 
                          className="w-full h-full" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{member.user.name}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <Mail size={12} />
                          {member.user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {canManage && member.role !== 'OWNER' && member.userId !== user?.id ? (
                      <select 
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                        disabled={isUpdating === member.userId}
                        className="bg-white dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 outline-none focus:border-[#6C5DD3] transition-all"
                      >
                        <option value="ADMIN">Administrador</option>
                        <option value="MEMBER">Miembro</option>
                        <option value="GUEST">Invitado</option>
                      </select>
                    ) : (
                      <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                        ${member.role === 'OWNER' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          member.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          'bg-slate-50 text-slate-600 border border-slate-100'}
                      `}>
                        <Shield size={10} />
                        {member.role === 'OWNER' ? 'Propietario' : member.role === 'ADMIN' ? 'Administrador' : member.role === 'MEMBER' ? 'Miembro' : 'Invitado'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      onClick={() => setSelectedMember(member)}
                      className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 group-hover:text-[#6C5DD3] dark:group-hover:text-[#6C5DD3] transition-colors cursor-pointer"
                    >
                      <Layout size={14} />
                      <span className="text-xs font-bold">Ver accesos</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {canManage && member.role !== 'OWNER' && member.userId !== user?.id && (
                        <button 
                          onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          className="p-2 text-rose-400/60 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all"
                          title="Eliminar del espacio"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-all"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Native-like List) */}
        <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/5">
          {filteredMembers.map((member, index) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              key={member.id}
              className="p-4 active:bg-zinc-100 dark:active:bg-white/5 transition-colors flex items-center gap-4"
            >
              <div className="cursor-pointer flex items-center gap-4 flex-1 min-w-0" onClick={() => setSelectedMember(member)}>
                <UserAvatar user={member.user} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {member.user.name}
                    </p>
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter
                      ${member.role === 'OWNER' ? 'bg-amber-100 text-amber-700' : 
                        member.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'}
                    `}>
                      {member.role === 'OWNER' ? 'Propietario' : member.role === 'ADMIN' ? 'Administrador' : member.role === 'MEMBER' ? 'Miembro' : 'Invitado'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                    <Mail size={10} />
                    {member.user.email}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-300" />
            </motion.div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-12 md:p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4 shadow-inner">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No hay miembros</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-[240px] mx-auto">Ajusta tu búsqueda o invita a nuevas personas al equipo.</p>
          </div>
        )}
      </div>

      <InviteMembersModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId!}
        workspaceName={workspace.name}
      />

      <MemberSlideOver 
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        workspaceId={workspaceId!}
        onUpdate={fetchWorkspace}
      />
    </motion.div>
  );
};

export default MembersPage;
