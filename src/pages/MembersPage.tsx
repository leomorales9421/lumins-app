import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Mail, Shield, MoreHorizontal, UserPlus, ChevronRight, Loader2 } from 'lucide-react';
import apiClient from '../lib/api-client';
import type { Workspace } from '../types/workspace';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import MembersModal from '../components/MembersModal';
import MemberSlideOver from '../components/MemberSlideOver';
import WorkspaceRolesHelpPopover from '../components/WorkspaceRolesHelpPopover';
import { LuminsMembersIcon, LuminsTrashIcon, LuminsBoardIcon } from '../components/icons/LuminsIcons';
import { WORKSPACE_ROLE_META, getRoleRank } from '../lib/workspace-roles';
import { motion } from 'framer-motion';
import type { WorkspaceMember, WorkspaceRole } from '../types/workspace';
import UserAvatar from '../components/ui/UserAvatar';
import { useModuleLoading } from '../contexts/NavigationLoaderContext';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import WorkspaceEmptyState from '../components/WorkspaceEmptyState';
import ConfirmActionModal from '../components/ConfirmActionModal';

const MembersPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);
  useEffect(() => { workspaceRef.current = workspace; }, [workspace]);
  const [isLoading, setIsLoading] = useState(true);
  useModuleLoading(isLoading, 'members-page');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [removeMemberCandidate, setRemoveMemberCandidate] = useState<{ targetUserId: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    targetUserId: string;
    name: string;
    newRole: WorkspaceRole;
  } | null>(null);

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
  const canManageRole = (targetRole: WorkspaceRole) => {
    if (currentUserRole === 'OWNER') return true;
    if (currentUserRole === 'ADMIN') return targetRole !== 'OWNER' && targetRole !== 'ADMIN';
    return false;
  };

  const handleRoleChange = (targetUserId: string, newRole: WorkspaceRole) => {
    const target = workspace?.members.find((m) => m.userId === targetUserId);
    if (!target || target.role === newRole) return;
    setPendingRoleChange({
      targetUserId,
      name: target.user.name || target.user.email,
      newRole,
    });
  };

  const handleConfirmRoleChange = async () => {
    if (!workspaceId || !pendingRoleChange) return;
    const { targetUserId, newRole } = pendingRoleChange;
    setIsUpdating(targetUserId);
    try {
      await apiClient.patch(`/api/workspaces/${workspaceId}/members/${targetUserId}`, { role: newRole });
      toast.success('Rol actualizado y permisos sincronizados');
      setPendingRoleChange(null);
      fetchWorkspace();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo actualizar el rol' });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = (targetUserId: string, name: string) => {
    if (!workspaceId) return;
    setRemoveMemberCandidate({ targetUserId, name });
  };

  const handleConfirmRemoveMember = async () => {
    if (!workspaceId || !removeMemberCandidate) return;
    setIsRemoving(true);
    try {
      await apiClient.delete(`/api/workspaces/${workspaceId}/members/${removeMemberCandidate.targetUserId}`);
      toast.success('Miembro eliminado');
      fetchWorkspace();
      setRemoveMemberCandidate(null);
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo eliminar al miembro' });
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return (workspace?.members || [])
      .filter(
        (member) =>
          member.user.name.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const rankDiff = getRoleRank(a.role) - getRoleRank(b.role);
        if (rankDiff !== 0) return rankDiff;
        return a.user.name.localeCompare(b.user.name);
      });
  }, [workspace?.members, searchTerm]);

  const currentRoleMeta = currentUserRole ? WORKSPACE_ROLE_META[currentUserRole] : null;

  if (isLoading) {
    return null;
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[var(--lumins-accent-fg)] mb-0.5">
            <LuminsMembersIcon size={17} />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em]">Gestión de Equipo</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Miembros del Equipo
            </h1>
            {currentRoleMeta && (
              <Badge
                tone={currentRoleMeta.tone}
                variant="dot"
                size="sm"
              >
                Tu rol: {currentRoleMeta.label}
              </Badge>
            )}
            <WorkspaceRolesHelpPopover
              currentUserRole={currentUserRole}
              align="start"
              triggerLabel="Roles y permisos"
            />
            {isRefreshing && (
               <div className="inline-flex items-center gap-1.5 text-[var(--lumins-accent-fg)] animate-in fade-in zoom-in duration-300">
                  <Loader2 size={13} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Actualizando</span>
               </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={15} />
            <input 
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3.5 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-lg text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)] transition-all shadow-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>
          {canManage && (
            <Button 
              onClick={() => setShowInviteModal(true)}
              className="h-9 bg-[var(--lumins-accent)] hover:bg-[var(--lumins-accent-hover)] text-[var(--lumins-accent-on)] rounded-lg px-4 flex items-center gap-2 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Invitar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Members List Container */}
      <div className="bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/90 dark:border-white/10 shadow-sm overflow-hidden">
        
        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/5 border-b border-zinc-200/80 dark:border-white/10">
                <th className="px-6 py-3.5 text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3.5 text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <div className="inline-flex items-center gap-1.5">
                    <span>Rol en Espacio</span>
                    <WorkspaceRolesHelpPopover currentUserRole={currentUserRole} align="start" compact />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acciones</th>
                <th className="px-6 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {filteredMembers.map((member, index) => {
                const isSelf = member.userId === user?.id;
                const roleMeta = WORKSPACE_ROLE_META[member.role];
                const canEditTargetRole = canManage && member.role !== 'OWNER' && !isSelf && canManageRole(member.role);

                return (
                <motion.tr 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025 }}
                  key={member.id || member.userId} 
                  className={`transition-colors group ${
                    isSelf
                      ? 'bg-[var(--lumins-accent-soft)]/50 hover:bg-[var(--lumins-accent-soft)]'
                      : 'hover:bg-slate-50/70 dark:hover:bg-white/5'
                  }`}
                >
                  <td className="px-6 py-3.5" onClick={() => setSelectedMember(member)}>
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className="w-9 h-9 shrink-0">
                        <UserAvatar 
                          user={member.user} 
                          size="md" 
                          className="w-full h-full" 
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {member.user.name}
                          </span>
                          {isSelf && (
                            <Badge tone="teal" variant="inline" size="xs">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
                          <Mail size={11} />
                          {member.user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    {canEditTargetRole ? (
                      <div className="w-40">
                        <Select
                          uiSize="sm"
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                          disabled={isUpdating === member.userId}
                        >
                          {currentUserRole === 'OWNER' && <option value="ADMIN">Administrador</option>}
                          <option value="MEMBER">Miembro</option>
                          <option value="GUEST">Invitado</option>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={roleMeta.tone}
                          variant="dot"
                          size="sm"
                        >
                          {roleMeta.label}
                        </Badge>
                        <span className="hidden xl:inline text-[11px] text-slate-400 dark:text-zinc-500">
                          {roleMeta.shortDesc}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[var(--lumins-accent-fg)] transition-colors cursor-pointer"
                    >
                      <LuminsBoardIcon size={14} />
                      <span>Ver accesos y permisos</span>
                    </button>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                       {canEditTargetRole && (
                        <button 
                          onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          className="p-2 text-zinc-400 hover:text-[#FF665E] hover:bg-[#FF665E]/10 rounded-lg transition-all"
                          title="Eliminar del espacio"
                        >
                          <LuminsTrashIcon size={17} />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="p-2 text-zinc-400 hover:text-[var(--lumins-accent-fg)] hover:bg-[var(--lumins-accent-soft)] rounded-lg transition-all"
                        title="Detalles del miembro"
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Native-like List) */}
        <div className="md:hidden divide-y divide-zinc-100 dark:divide-white/5">
          {filteredMembers.map((member, index) => {
            const isSelf = member.userId === user?.id;
            const roleMeta = WORKSPACE_ROLE_META[member.role];

            return (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.025 }}
              key={member.id || member.userId}
              className={`p-4 active:bg-zinc-100 dark:active:bg-white/5 transition-colors flex items-center gap-3.5 ${
                isSelf ? 'bg-[var(--lumins-accent-soft)]/50' : ''
              }`}
            >
              <div className="cursor-pointer flex items-center gap-3.5 flex-1 min-w-0" onClick={() => setSelectedMember(member)}>
                <UserAvatar user={member.user} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {member.user.name}
                      </p>
                      {isSelf && (
                        <Badge tone="teal" variant="inline" size="xs">
                          Tú
                        </Badge>
                      )}
                    </div>
                    <Badge tone={roleMeta.tone} variant="dot" size="xs">
                      {roleMeta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                    <Mail size={10} />
                    {member.user.email}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-300 shrink-0" />
            </motion.div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-12 md:p-20 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[var(--lumins-accent-soft)] rounded-2xl flex items-center justify-center text-[var(--lumins-accent-fg)] mb-4">
              <LuminsMembersIcon size={28} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No hay miembros</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs max-w-[240px] mx-auto mt-1">Ajusta tu búsqueda o invita a nuevas personas al equipo.</p>
          </div>
        )}
      </div>

      <MembersModal 
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
        currentUserId={user?.id}
        currentUserRole={currentUserRole}
        onUpdate={fetchWorkspace}
      />

      <ConfirmActionModal
        isOpen={!!removeMemberCandidate}
        title="Eliminar miembro del espacio"
        description={`¿Estás seguro de que deseas eliminar a "${removeMemberCandidate?.name}" del espacio de trabajo?`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isRemoving}
        onClose={() => {
          if (!isRemoving) setRemoveMemberCandidate(null);
        }}
        onConfirm={handleConfirmRemoveMember}
      />

      <ConfirmActionModal
        isOpen={!!pendingRoleChange}
        title={`Cambiar rol a ${
          pendingRoleChange?.newRole === 'ADMIN'
            ? 'Administrador'
            : pendingRoleChange?.newRole === 'MEMBER'
            ? 'Miembro'
            : 'Invitado'
        }`}
        description={
          pendingRoleChange?.newRole === 'GUEST'
            ? `Al cambiar a "${pendingRoleChange.name}" a Invitado, todos sus permisos en los tableros donde participa se establecerán en Lector (solo lectura) y no podrá crear tableros nuevos.`
            : pendingRoleChange?.newRole === 'MEMBER'
            ? `Al cambiar a "${pendingRoleChange?.name}" a Miembro, todos sus tableros pasarán al permiso por defecto Editor.`
            : `Al cambiar a "${pendingRoleChange?.name}" a Administrador, todos sus tableros pasarán al permiso por defecto Admin.`
        }
        confirmLabel="Confirmar cambio"
        cancelLabel="Cancelar"
        variant="info"
        isLoading={!!pendingRoleChange && isUpdating === pendingRoleChange.targetUserId}
        onClose={() => {
          if (!isUpdating) setPendingRoleChange(null);
        }}
        onConfirm={handleConfirmRoleChange}
      />
    </motion.div>
  );
};

export default MembersPage;
