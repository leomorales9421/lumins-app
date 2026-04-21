import React, { useState, useEffect } from 'react';
import { X, Shield, Layout, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorkspaceMember, WorkspaceRole } from '../types/workspace';
import apiClient from '../lib/api-client';
import UserAvatar from './ui/UserAvatar';

interface MemberSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  member: WorkspaceMember | null;
  workspaceId: string;
  onUpdate: () => void;
}

const MemberSlideOver: React.FC<MemberSlideOverProps> = ({ 
  isOpen, 
  onClose, 
  member, 
  workspaceId,
  onUpdate 
}) => {
  const [activeBoards, setActiveBoards] = useState<string[]>([]);
  const [workspaceBoards, setWorkspaceBoards] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      fetchData();
    }
  }, [isOpen, member]);

  const fetchData = async () => {
    setIsLoadingBoards(true);
    try {
      // 1. Fetch all boards in workspace
      const boardsRes = await apiClient.get<{ data: { boards: any[] } }>(`/api/boards?workspaceId=${workspaceId}`);
      const boards = boardsRes.data.boards;
      setWorkspaceBoards(boards);

      // 2. For each board, check if user is a member
      const memberBoards: string[] = [];
      // Fetch details for each board to see members list
      const detailsPromises = boards.map(board => apiClient.get<{ data: { board: any } }>(`/api/boards/${board.id}`));
      const detailsResponses = await Promise.all(detailsPromises);
      
      detailsResponses.forEach((res, index) => {
        const boardDetail = res.data.board;
        const isMember = boardDetail.members.some((m: any) => m.userId === member?.userId);
        const isOwner = boardDetail.ownerId === member?.userId;
        if (isMember || isOwner) {
          memberBoards.push(boards[index].id);
        }
      });
      
      setActiveBoards(memberBoards);
    } catch (err) {
      console.error('Error fetching member board access', err);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const handleRoleChange = async (newRole: WorkspaceRole) => {
    if (!member) return;
    setIsUpdating(true);
    try {
      await apiClient.patch(`/api/workspaces/${workspaceId}/members/${member.userId}`, { role: newRole });
      onUpdate();
    } catch (err) {
      console.error('Error updating role', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleBoardAccess = async (boardId: string, currentlyHasAccess: boolean) => {
    if (!member) return;
    try {
      if (!currentlyHasAccess) {
        // Add access
        await apiClient.post(`/api/boards/${boardId}/members`, { userId: member.userId, role: 'editor' });
        setActiveBoards(prev => [...prev, boardId]);
      } else {
        // Remove access
        await apiClient.delete(`/api/boards/${boardId}/members/${member.userId}`);
        setActiveBoards(prev => prev.filter(id => id !== boardId));
      }
    } catch (err) {
      console.error('Error toggling board access', err);
    }
  };

  const handleRemoveMember = async () => {
    if (!member || !window.confirm('¿Estás seguro de que deseas eliminar a este miembro del espacio de trabajo?')) return;
    setIsRemoving(true);
    try {
      await apiClient.delete(`/api/workspaces/${workspaceId}/members/${member.userId}`);
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
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[400px] bg-white dark:bg-[#1C1F26] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] border-l border-zinc-200 dark:border-white/10 z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded overflow-hidden shadow-sm border border-zinc-200 dark:border-white/10">
                  <UserAvatar 
                    user={member?.user} 
                    size="lg" 
                    className="w-full h-full rounded" 
                  />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{member?.user.name}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{member?.user.email}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-white/10 rounded text-zinc-400 dark:text-zinc-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Role Section */}
              <section>
                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-1">Rol en el Espacio</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(['ADMIN', 'MEMBER', 'GUEST'] as WorkspaceRole[]).map((role) => (
                    <button
                      key={role}
                      disabled={isUpdating || member?.role === 'OWNER'}
                      onClick={() => handleRoleChange(role)}
                      className={`
                        flex items-center justify-between p-4 rounded border transition-all text-left
                        ${member?.role === role 
                          ? 'bg-[#6C5DD3]/5 border-[#6C5DD3] text-[#6C5DD3] dark:text-zinc-100' 
                          : 'bg-zinc-50/50 dark:bg-[#13151A] border-zinc-100 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}
                        ${(isUpdating || member?.role === 'OWNER') && 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold capitalize">{role.toLowerCase()}</span>
                        <span className="text-[11px] opacity-70">
                          {role === 'ADMIN' ? 'Control total sobre el espacio' : 
                           role === 'MEMBER' ? 'Puede crear tableros y editar' : 
                           'Acceso limitado a tableros específicos'}
                        </span>
                      </div>
                      {member?.role === role && <CheckCircle2 size={18} className="text-[#6C5DD3]" />}
                    </button>
                  ))}
                  {member?.role === 'OWNER' && (
                    <div className="flex items-center justify-between p-4 rounded border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold capitalize">Owner</span>
                        <span className="text-[11px] opacity-70">Propietario principal del espacio</span>
                      </div>
                      <Shield size={18} />
                    </div>
                  )}
                </div>
              </section>

              {/* Boards Access Section */}
              <section>
                <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-1">Acceso a Tableros</h3>
                {isLoadingBoards ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-500 gap-3">
                    <Loader2 className="animate-spin text-[#6C5DD3]" size={24} />
                    <span className="text-xs font-bold uppercase tracking-wider">Cargando tableros...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {workspaceBoards.map((board) => {
                      const hasAccess = activeBoards.includes(board.id);
                      return (
                        <div 
                          key={board.id}
                          className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-white/5 rounded transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-[#6C5DD3]/10 group-hover:text-[#6C5DD3] transition-all">
                              <Layout size={18} />
                            </div>
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{board.name}</span>
                          </div>
                          
                          <button
                            disabled={member?.role === 'OWNER'}
                            onClick={() => toggleBoardAccess(board.id, hasAccess)}
                            className={`
                              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                              ${hasAccess ? 'bg-[#6C5DD3]' : 'bg-zinc-200 dark:bg-zinc-800'}
                              ${member?.role === 'OWNER' && 'opacity-50 cursor-not-allowed'}
                            `}
                          >
                            <span
                              className={`
                                pointer-events-none inline-block h-5 w-5 transform rounded bg-white shadow ring-0 transition duration-200 ease-in-out
                                ${hasAccess ? 'translate-x-5' : 'translate-x-0'}
                              `}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Danger Zone */}
            <div className="p-6 border-t border-zinc-200 dark:border-white/10 bg-rose-50/30 dark:bg-rose-500/5 mt-auto">
              <h3 className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-[0.2em] mb-4 px-1">Zona de Peligro</h3>
              <button
                disabled={isRemoving || member?.role === 'OWNER'}
                onClick={handleRemoveMember}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded border-2 border-rose-100 dark:border-rose-500/20 bg-white dark:bg-[#13151A] text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
                {isRemoving ? 'Eliminando...' : 'Eliminar del espacio'}
              </button>
              {member?.role === 'OWNER' && (
                <p className="text-[10px] text-rose-400 dark:text-rose-500 mt-2 text-center italic font-medium">No puedes eliminar al propietario principal.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberSlideOver;
