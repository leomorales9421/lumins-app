import React, { useState, useEffect, useMemo } from 'react';
import { X, Shield, ChevronLeft, ChevronRight, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorkspaceMember, WorkspaceRole } from '../types/workspace';
import apiClient from '../lib/api-client';
import UserAvatar from './ui/UserAvatar';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import LuminsLogoLoader from './ui/LuminsLogoLoader';
import WorkspaceRolesHelpPopover from './WorkspaceRolesHelpPopover';
import { BoardRolesHelpPopover } from './BoardRolesHelpPopover';
import { LuminsBoardIcon, LuminsLockIcon, LuminsSuccessIcon, LuminsTrashIcon } from './icons/LuminsIcons';
import { WORKSPACE_ROLE_META } from '../lib/workspace-roles';
import ConfirmActionModal from './ConfirmActionModal';
import { toast } from 'sonner';

export type BoardPermissionRole = 'admin' | 'editor' | 'viewer' | 'none';
type BoardFilterTab = 'all' | 'access' | 'private' | 'custom';

interface BoardPermissionEntry {
  effectiveRole: BoardPermissionRole;
  explicitRole?: BoardPermissionRole;
  isBoardOwner: boolean;
  source: 'ws_owner' | 'board_owner' | 'custom' | 'excluded' | 'inherited' | 'none';
}

interface MemberSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  member: WorkspaceMember | null;
  workspaceId: string;
  currentUserId?: string;
  currentUserRole?: WorkspaceRole;
  onUpdate: () => void;
}

const MemberSlideOver: React.FC<MemberSlideOverProps> = ({ 
  isOpen, 
  onClose, 
  member, 
  workspaceId,
  currentUserId,
  currentUserRole,
  onUpdate 
}) => {
  const [boardPermissions, setBoardPermissions] = useState<Record<string, BoardPermissionEntry>>({});
  const [workspaceBoards, setWorkspaceBoards] = useState<{ id: string; name: string; visibility?: string; ownerId?: string; createdAt?: string }[]>([]);
  const [boardSearch, setBoardSearch] = useState('');
  const [boardFilter, setBoardFilter] = useState<BoardFilterTab>('all');
  const [updatingBoardId, setUpdatingBoardId] = useState<string | null>(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<WorkspaceRole | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isWsOwner = member?.role === 'OWNER';
  const isWsAdmin = member?.role === 'ADMIN';
  const isWsMember = member?.role === 'MEMBER';
  const isSelf = !!member && member.userId === currentUserId;
  const canManageRole = (targetRole: string) => {
    if (currentUserRole === 'OWNER') return true;
    if (currentUserRole === 'ADMIN') return targetRole !== 'OWNER' && targetRole !== 'ADMIN';
    return false;
  };
  const canManage = !isSelf && canManageRole(member?.role || '') && member?.userId !== undefined;
  const memberRoleMeta = member ? WORKSPACE_ROLE_META[member.role] : null;

  const filteredBoards = useMemo(() => {
    const q = boardSearch.trim().toLowerCase();
    return [...workspaceBoards]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .filter((board) => {
        if (q && !board.name.toLowerCase().includes(q)) return false;
        const perm = boardPermissions[board.id];
        if (boardFilter === 'access') return perm && perm.effectiveRole !== 'none';
        if (boardFilter === 'private') return board.visibility === 'PRIVATE';
        if (boardFilter === 'custom') return perm?.source === 'custom' || perm?.source === 'excluded';
        return true;
      });
  }, [workspaceBoards, boardSearch, boardFilter, boardPermissions]);

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(filteredBoards.length / pageSize));
  const displayBoards = pageSize === 0 ? filteredBoards : filteredBoards.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (isOpen && member) {
      setBoardSearch('');
      setBoardFilter('all');
      fetchData();
    }
  }, [isOpen, member]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, boardSearch, boardFilter, workspaceBoards]);

  const computeBoardEntry = (
    boardDetail: any,
    explicitRole?: BoardPermissionRole
  ): BoardPermissionEntry => {
    const isBoardOwner = boardDetail.ownerId === member?.userId;
    const isPrivate = boardDetail.visibility === 'PRIVATE';

    if (isWsOwner) {
      return { effectiveRole: 'admin', explicitRole, isBoardOwner, source: 'ws_owner' };
    }
    if (isBoardOwner) {
      return { effectiveRole: 'admin', explicitRole, isBoardOwner: true, source: 'board_owner' };
    }
    if (explicitRole === 'none') {
      return { effectiveRole: 'none', explicitRole: 'none', isBoardOwner: false, source: 'excluded' };
    }
    if (explicitRole) {
      return { effectiveRole: explicitRole, explicitRole, isBoardOwner: false, source: 'custom' };
    }
    if (!isPrivate) {
      if (isWsAdmin) {
        return { effectiveRole: 'admin', isBoardOwner: false, source: 'inherited' };
      }
      if (isWsMember) {
        return { effectiveRole: 'editor', isBoardOwner: false, source: 'inherited' };
      }
    }
    return { effectiveRole: 'none', isBoardOwner: false, source: 'none' };
  };

  const fetchData = async () => {
    setIsLoadingBoards(true);
    try {
      const boardsRes = await apiClient.get<{ data: { boards: any[] } }>(`/api/boards?workspaceId=${workspaceId}`);
      const boards = boardsRes.data.boards;
      setWorkspaceBoards(boards);

      const detailsPromises = boards.map(board => apiClient.get<{ data: { board: any } }>(`/api/boards/${board.id}`));
      const detailsResponses = await Promise.all(detailsPromises);

      const nextPermissions: Record<string, BoardPermissionEntry> = {};
      detailsResponses.forEach((res, index) => {
        const boardDetail = res.data.board;
        const explicitMember = boardDetail.members.find((m: any) => m.userId === member?.userId);
        nextPermissions[boards[index].id] = computeBoardEntry(
          boardDetail,
          explicitMember?.role as BoardPermissionRole | undefined
        );
      });

      setBoardPermissions(nextPermissions);
    } catch (err) {
      console.error('Error fetching member board access', err);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const handleRoleChange = (newRole: WorkspaceRole) => {
    if (!member || newRole === member.role) return;
    setPendingRoleChange(newRole);
  };

  const handleConfirmRoleChange = async () => {
    if (!member || !pendingRoleChange) return;
    const targetRole = pendingRoleChange;
    setIsUpdating(true);
    try {
      await apiClient.patch(`/api/workspaces/${workspaceId}/members/${member.userId}`, { role: targetRole });
      toast.success('Rol actualizado y permisos sincronizados');
      setPendingRoleChange(null);
      onUpdate();
      await fetchData();
    } catch (err: any) {
      console.error('Error updating role', err);
      toast.error('No se pudo actualizar el rol', {
        description: err.response?.data?.message || 'Verifica tus permisos jerárquicos',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBoardRoleChange = async (board: { id: string; visibility?: string; ownerId?: string }, newRole: BoardPermissionRole) => {
    if (!member) return;
    setUpdatingBoardId(board.id);
    const isPrivate = board.visibility === 'PRIVATE';
    const current = boardPermissions[board.id];

    try {
      // For GUEST or PRIVATE boards, setting 'none' removes the BoardMember row cleanly if one existed
      if (newRole === 'none' && (isPrivate || member.role === 'GUEST')) {
        if (current?.explicitRole) {
          await apiClient.delete(`/api/boards/${board.id}/members/${member.userId}`);
        }
        setBoardPermissions(prev => ({
          ...prev,
          [board.id]: computeBoardEntry(board, undefined),
        }));
      } else {
        await apiClient.patch(`/api/boards/${board.id}/members/${member.userId}`, { role: newRole });
        setBoardPermissions(prev => ({
          ...prev,
          [board.id]: computeBoardEntry(board, newRole),
        }));
      }
      toast.success('Permiso del tablero actualizado');
    } catch (err: any) {
      console.error('Error updating board role', err);
      toast.error('Error al actualizar tablero', {
        description: err.response?.data?.message || 'No tienes jerarquía suficiente para esta acción',
      });
    } finally {
      setUpdatingBoardId(null);
    }
  };

  const handleRemoveMember = () => {
    if (!member) return;
    setIsConfirmRemoveOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!member) return;
    setIsRemoving(true);
    try {
      await apiClient.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`);
      setIsConfirmRemoveOpen(false);
      onClose();
      onUpdate();
    } catch (err) {
      console.error('Error removing member', err);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/60 z-[100] backdrop-blur-[2px]"
          />

          {/* Slide Over */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-[580px] bg-white dark:bg-[#1C1F26] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] border-l border-zinc-200 dark:border-white/10 z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-slate-50/70 dark:bg-white/5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs border border-zinc-200 dark:border-white/10 shrink-0">
                  <UserAvatar 
                    user={member?.user} 
                    size="lg" 
                    className="w-full h-full" 
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">{member?.user.name}</h2>
                    {isSelf && (
                      <Badge tone="teal" variant="inline" size="xs">
                        Tú
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{member?.user.email}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white dark:hover:bg-white/5 hover:shadow-xs border border-transparent hover:border-zinc-200 dark:hover:border-white/10 rounded-lg text-zinc-400 dark:text-zinc-500 transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {/* Role Section */}
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                      Rol en el Espacio
                    </h3>
                    <WorkspaceRolesHelpPopover currentUserRole={currentUserRole} align="start" compact />
                  </div>
                  {memberRoleMeta && (
                    <Badge tone={memberRoleMeta.tone} variant="dot" size="xs">
                      Nivel {memberRoleMeta.level}
                    </Badge>
                  )}
                </div>

                <div className={member?.role === 'OWNER' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-2'}>
                  {member?.role !== 'OWNER' && (['ADMIN', 'MEMBER', 'GUEST'] as WorkspaceRole[]).map((role) => {
                    const meta = WORKSPACE_ROLE_META[role];
                    const isSelected = member?.role === role;
                    const roleOptionDisabled =
                      isUpdating ||
                      !canManage ||
                      (role === 'ADMIN' && currentUserRole !== 'OWNER');

                    return (
                      <button
                        key={role}
                        disabled={roleOptionDisabled}
                        onClick={() => handleRoleChange(role)}
                        className={`
                          flex items-start justify-between gap-2 p-3 rounded-xl border transition-all text-left
                          ${isSelected
                            ? 'bg-white dark:bg-[#1C1F26] border-[#12A9A8] ring-1 ring-[#12A9A8]/25 text-zinc-900 dark:text-zinc-100' 
                            : 'bg-slate-50/60 dark:bg-[#13151A] border-zinc-200/70 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}
                          ${roleOptionDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                          ${roleOptionDisabled && isSelected ? 'cursor-default' : ''}
                        `}
                      >
                        <div className="flex flex-col items-start min-w-0">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#0E8786] dark:text-[#4CD4D3]' : ''}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10.5px] opacity-75 mt-0.5 leading-snug">
                            {meta.shortDesc}
                          </span>
                        </div>
                        {isSelected && <LuminsSuccessIcon size={16} className="shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                  {member?.role === 'OWNER' && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-l-[3px] border-l-[#FFCC40] bg-white dark:bg-[#1C1F26] border-slate-200 dark:border-white/10">
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">Propietario</span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Autoridad máxima y dueño del espacio</span>
                      </div>
                      <Shield size={18} className="text-[#D99B00] dark:text-[#FFCC40]" />
                    </div>
                  )}
                </div>

                {memberRoleMeta && (
                  <div className="mt-2.5 px-3 py-2 rounded-lg bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex flex-wrap gap-x-4 gap-y-1">
                    {memberRoleMeta.capabilities.map((cap) => (
                      <span key={cap} className="text-[10.5px] text-slate-600 dark:text-zinc-300 inline-flex items-center gap-1">
                        <Check size={11} className="text-[#12A9A8] shrink-0" />
                        <span>{cap}</span>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* Boards Access Section */}
              <section>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                      Permisos por Tablero ({filteredBoards.length})
                    </h3>
                    <BoardRolesHelpPopover align="start" />
                  </div>
                  {!isLoadingBoards && workspaceBoards.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                      {[10, 30, 50].map(size => (
                        <button key={size} onClick={() => setPageSize(size)}
                          className={`px-1.5 py-0.5 rounded transition-colors ${pageSize === size ? 'text-[#12A9A8] bg-[#12A9A8]/10' : 'hover:text-zinc-600 dark:hover:text-zinc-300'}`}>{size}</button>
                      ))}
                      <span className="text-zinc-300 mx-0.5">|</span>
                      <button onClick={() => setPageSize(0)}
                        className={`px-1.5 py-0.5 rounded transition-colors ${pageSize === 0 ? 'text-[#12A9A8] bg-[#12A9A8]/10' : 'hover:text-zinc-600 dark:hover:text-zinc-300'}`}>Todas</button>
                    </div>
                  )}
                </div>

                {/* Board Search & Filter Tabs */}
                {!isLoadingBoards && workspaceBoards.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={boardSearch}
                        onChange={(e) => setBoardSearch(e.target.value)}
                        placeholder="Filtrar tablero por nombre..."
                        className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-50/80 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8]"
                      />
                    </div>
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 shrink-0">
                      {([
                        { id: 'all', label: 'Todos' },
                        { id: 'access', label: 'Con acceso' },
                        { id: 'private', label: 'Privados' },
                        { id: 'custom', label: 'Ajustados' },
                      ] as { id: BoardFilterTab; label: string }[]).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setBoardFilter(tab.id)}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                            boardFilter === tab.id
                              ? 'bg-white dark:bg-[#1C1F26] text-[#0E8786] dark:text-[#4CD4D3] shadow-xs'
                              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isLoadingBoards ? (
                  <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500 gap-2.5">
                    <LuminsLogoLoader size="xs" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Cargando tableros...</span>
                  </div>
                ) : displayBoards.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                    No hay tableros que coincidan con este filtro.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {displayBoards.map((board) => {
                      const isPrivate = board.visibility === 'PRIVATE';
                      const perm = boardPermissions[board.id] || {
                        effectiveRole: 'none',
                        isBoardOwner: false,
                        source: 'none',
                      };
                      const isLockedRole =
                        perm.source === 'ws_owner' || perm.source === 'board_owner' || !canManage;

                      return (
                        <div 
                          key={board.id}
                          className="flex items-center justify-between gap-3 p-2.5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] rounded-xl transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center shrink-0">
                              {isPrivate ? <LuminsLockIcon size={15} /> : <LuminsBoardIcon size={15} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                  {board.name}
                                </span>
                                {isPrivate && (
                                  <Badge tone="amber" variant="inline" size="xs">
                                    Privado
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {perm.source === 'ws_owner' && (
                                  <span className="text-[10.5px] text-[#9A6700] dark:text-[#FFCC40] font-medium">
                                    Acceso total como propietario del espacio
                                  </span>
                                )}
                                {perm.source === 'board_owner' && (
                                  <span className="text-[10.5px] text-[#0E8786] dark:text-[#4CD4D3] font-medium">
                                    Creador del tablero
                                  </span>
                                )}
                                {perm.source === 'custom' && (
                                  <Badge tone="teal" variant="inline" size="xs">
                                    Rol personalizado
                                  </Badge>
                                )}
                                {perm.source === 'excluded' && (
                                  <Badge tone="coral" variant="inline" size="xs">
                                    Excluido manualmente
                                  </Badge>
                                )}
                                {perm.source === 'inherited' && (
                                  <span className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                                    Heredado del espacio
                                  </span>
                                )}
                                {perm.source === 'none' && (
                                  <span className="text-[10.5px] text-slate-400 dark:text-zinc-500">
                                    Sin acceso asignado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {perm.source === 'ws_owner' || perm.source === 'board_owner' ? (
                              <div className="flex justify-end w-36">
                                <Badge tone="amber" variant="dot" size="xs">
                                  Admin total
                                </Badge>
                              </div>
                            ) : (
                              <>
                                <div className="w-32">
                                  <Select
                                    uiSize="sm"
                                    value={perm.effectiveRole}
                                    disabled={isLockedRole || updatingBoardId === board.id}
                                    onChange={(e) =>
                                      handleBoardRoleChange(board, e.target.value as BoardPermissionRole)
                                    }
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Lector</option>
                                    <option value="none">Sin acceso</option>
                                  </Select>
                                </div>
                                {!isLockedRole && perm.effectiveRole !== 'none' && (
                                  <button
                                    type="button"
                                    disabled={updatingBoardId === board.id}
                                    onClick={() => handleBoardRoleChange(board, 'none')}
                                    title="Remover del tablero"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#D94841] hover:bg-[#FF665E]/10 transition-colors disabled:opacity-40"
                                  >
                                    <LuminsTrashIcon size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!isLoadingBoards && filteredBoards.length > 10 && pageSize > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 px-1">
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {filteredBoards.length > 0
                        ? `Mostrando ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, filteredBoards.length)} de ${filteredBoards.length}`
                        : '0 tableros'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft size={14} />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                        const p = start + i;
                        return p <= totalPages ? (
                          <button key={p} onClick={() => setPage(p)}
                            className={`w-6 h-6 rounded text-[11px] font-bold transition-colors ${p === page ? 'bg-[#12A9A8] text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'}`}>{p}</button>
                        ) : null;
                      })}
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Danger Zone */}
            <div className="p-5 border-t border-zinc-200 dark:border-white/10 bg-[#FF665E]/[0.04] dark:bg-[#FF665E]/[0.08] mt-auto">
              <h3 className="text-[10px] font-bold text-[#FF665E] dark:text-[#FF857E] uppercase tracking-[0.2em] mb-3 px-1">Zona de Peligro</h3>
              <button
                disabled={isRemoving || member?.role === 'OWNER' || !canManage}
                onClick={handleRemoveMember}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#FF665E]/35 bg-white dark:bg-[#212632] text-[#D94841] dark:text-[#FF857E] enabled:hover:bg-[#FF665E] dark:enabled:hover:bg-[#FF665E] enabled:hover:text-white enabled:cursor-pointer transition-all font-bold text-xs disabled:bg-zinc-100 dark:disabled:bg-[#262B38]/70 disabled:border-zinc-200 dark:disabled:border-[#FF665E]/25 disabled:text-zinc-400 dark:disabled:text-[#FFA39E]/75 disabled:cursor-not-allowed"
              >
                <LuminsTrashIcon size={16} />
                {isRemoving ? 'Eliminando...' : 'Eliminar del espacio'}
              </button>
              {(member?.role === 'OWNER' || !canManage) && (
                <p className="text-[10.5px] text-[#D94841]/85 dark:text-[#FFA39E]/90 mt-2 text-center font-medium">
                  {member?.role === 'OWNER'
                    ? 'No puedes eliminar al propietario principal.'
                    : isSelf
                      ? 'No puedes eliminarte a ti mismo desde aquí.'
                      : 'No tienes permisos para eliminar a este miembro.'}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}

      <ConfirmActionModal
        isOpen={isConfirmRemoveOpen}
        title="Eliminar miembro del espacio"
        description={`¿Estás seguro de que deseas eliminar a "${member?.user?.name || 'este miembro'}" del espacio de trabajo? Perderá el acceso a todos los tableros vinculados.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isRemoving}
        onClose={() => {
          if (!isRemoving) setIsConfirmRemoveOpen(false);
        }}
        onConfirm={handleConfirmRemoveMember}
      />

      <ConfirmActionModal
        isOpen={!!pendingRoleChange}
        title={`Cambiar rol a ${pendingRoleChange ? WORKSPACE_ROLE_META[pendingRoleChange].label : ''}`}
        description={
          pendingRoleChange === 'GUEST'
            ? `Al cambiar a "${member?.user?.name || 'este miembro'}" a Invitado, todos sus permisos en los tableros donde participa se establecerán en Lector (solo lectura) y no podrá crear tableros nuevos.`
            : pendingRoleChange === 'MEMBER'
            ? `Al cambiar a "${member?.user?.name || 'este miembro'}" a Miembro, todos sus tableros pasarán al permiso por defecto Editor.`
            : `Al cambiar a "${member?.user?.name || 'este miembro'}" a Administrador, todos sus tableros pasarán al permiso por defecto Admin.`
        }
        confirmLabel="Confirmar cambio"
        cancelLabel="Cancelar"
        variant="info"
        isLoading={isUpdating}
        onClose={() => {
          if (!isUpdating) setPendingRoleChange(null);
        }}
        onConfirm={handleConfirmRoleChange}
      />
    </AnimatePresence>
  );
};

export default MemberSlideOver;
