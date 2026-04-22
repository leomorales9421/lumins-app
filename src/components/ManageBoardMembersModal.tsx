import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Trash2, Shield, User, Building2, Crown, Lock } from 'lucide-react';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface BoardMember {
  userId: string;
  role: string;
  inheritedFrom?: 'workspace' | 'owner' | null;
  wsRole?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface WorkspaceMember {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ManageBoardMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  workspaceId: string;
  currentMembers: any[];
  onUpdate: () => void;
}

const roleColors: Record<string, string> = {
  admin: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  editor: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  viewer: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  OWNER: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400',
  ADMIN: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400',
  MEMBER: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400',
};

const ManageBoardMembersModal: React.FC<ManageBoardMembersModalProps> = ({
  isOpen,
  onClose,
  boardId,
  workspaceId,
  currentMembers,
  onUpdate
}) => {
  const { user: me } = useAuth();
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'add'>('manage');

  const fetchBoardMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<{ data: { members: BoardMember[] } }>(`/api/boards/${boardId}/members`);
      setBoardMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to fetch board members', err);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  const fetchWorkspaceMembers = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: { workspace: { members: WorkspaceMember[] } } }>(`/api/workspaces/${workspaceId}`);
      setWorkspaceMembers(res.data.workspace.members || []);
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isOpen) {
      fetchBoardMembers();
      fetchWorkspaceMembers();
    }
  }, [isOpen, fetchBoardMembers, fetchWorkspaceMembers]);

  const handleAddMember = async (userId: string) => {
    try {
      setIsAdding(userId);
      await apiClient.post(`/api/boards/${boardId}/members`, { userId, role: 'editor' });
      toast.success('Miembro añadido al tablero');
      fetchBoardMembers();
      onUpdate();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo añadir al miembro' });
    } finally {
      setIsAdding(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/api/boards/${boardId}/members/${userId}`, { role: newRole });
      toast.success('Rol actualizado');
      fetchBoardMembers();
      onUpdate();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo actualizar el rol' });
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!window.confirm(`¿Eliminar a ${name} del tablero?`)) return;
    try {
      await apiClient.delete(`/api/boards/${boardId}/members/${userId}`);
      toast.success('Miembro eliminado del tablero');
      fetchBoardMembers();
      onUpdate();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo eliminar al miembro' });
    }
  };

  const boardMemberIds = new Set(boardMembers.map(m => m.userId));

  // Addable: WS members not already showing in board members list
  const filteredAddable = workspaceMembers.filter(m =>
    !boardMemberIds.has(m.userId) &&
    (m.user.name.toLowerCase().includes(search.toLowerCase()) ||
     m.user.email.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredBoardMembers = boardMembers.filter(m =>
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Determine current user's role in this board
  const myBoardEntry = boardMembers.find(m => m.userId === me?.id);
  const myRole = myBoardEntry?.wsRole || myBoardEntry?.role || 'viewer';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white dark:bg-[#1C1F26] rounded-[4px] shadow-2xl relative overflow-hidden z-10 border border-zinc-200 dark:border-white/10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[4px] bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Gestionar Miembros</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Controla quién tiene acceso a este tablero</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* My role badge */}
                {myBoardEntry && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${roleColors[myRole] || roleColors.viewer}`}>
                    <Crown size={10} />
                    <span>Tú: {myRole}</span>
                  </div>
                )}
                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4 gap-6 border-b border-zinc-100 dark:border-white/5">
              <button
                onClick={() => { setActiveTab('manage'); setSearch(''); }}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'manage' ? 'text-[#6C5DD3]' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              >
                Miembros ({boardMembers.length})
                {activeTab === 'manage' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C5DD3]" />}
              </button>
              <button
                onClick={() => { setActiveTab('add'); setSearch(''); }}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'add' ? 'text-[#6C5DD3]' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              >
                Añadir Miembros
                {activeTab === 'add' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C5DD3]" />}
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder={activeTab === 'manage' ? 'Buscar miembros...' : 'Buscar en el espacio de trabajo...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-[4px] text-sm text-zinc-900 dark:text-zinc-100 focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium"
                />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {activeTab === 'manage' ? (
                  <div className="space-y-1">
                    {isLoading ? (
                      [1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                          <div className="w-10 h-10 rounded-[4px] bg-zinc-100 dark:bg-white/5" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded w-1/2" />
                            <div className="h-3 bg-zinc-100 dark:bg-white/5 rounded w-3/4" />
                          </div>
                        </div>
                      ))
                    ) : filteredBoardMembers.length > 0 ? (
                      filteredBoardMembers.map((member) => {
                        const isMe = member.userId === me?.id;
                        const isInherited = !!member.inheritedFrom;
                        const displayRole = member.wsRole || member.role;

                        return (
                          <div
                            key={member.userId}
                            className="flex items-center justify-between p-3 rounded-[4px] hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-white/10"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${isInherited ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 'bg-gradient-to-br from-[#6C5DD3] to-[#312e81]'}`}>
                                {member.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{member.user.name}</span>
                                  {isMe && <span className="text-[9px] font-black text-[#6C5DD3] uppercase tracking-tighter bg-[#6C5DD3]/10 px-1.5 py-0.5 rounded">Tú</span>}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">{member.user.email}</div>
                                {isInherited && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Building2 size={9} className="text-zinc-400" />
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">
                                      {member.inheritedFrom === 'owner' ? 'Propietario del tablero' : `Vía Espacio · ${member.wsRole}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              {isInherited ? (
                                // Inherited members: show badge, no edit (their access comes from WS role)
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${roleColors[displayRole] || roleColors.viewer}`}>
                                  <Lock size={9} />
                                  {displayRole}
                                </span>
                              ) : (
                                <>
                                  {!isMe && (
                                    <select
                                      value={member.role}
                                      onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                                      className="bg-transparent text-[11px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 rounded-[4px] px-2 py-1 outline-none focus:border-[#6C5DD3] transition-all hover:bg-white dark:hover:bg-white/5 uppercase tracking-tighter"
                                    >
                                      <option value="admin">Admin</option>
                                      <option value="editor">Editor</option>
                                      <option value="viewer">Viewer</option>
                                    </select>
                                  )}
                                  {isMe && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${roleColors[member.role] || roleColors.viewer}`}>
                                      {member.role}
                                    </span>
                                  )}
                                  {!isMe && (
                                    <button
                                      onClick={() => handleRemoveMember(member.userId, member.user.name)}
                                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all"
                                      title="Eliminar del tablero"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center opacity-50">
                        <User size={32} className="mx-auto mb-3 text-zinc-300" />
                        <p className="text-sm font-bold">No hay miembros que coincidan</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAddable.length > 0 ? (
                      filteredAddable.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-3 rounded-[4px] hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-zinc-100 dark:hover:border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[4px] bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-xs font-bold border border-zinc-200 dark:border-white/10">
                              {member.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{member.user.name}</div>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{member.user.email}</div>
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded border mt-0.5 ${roleColors[member.role] || roleColors.viewer}`}>
                                <Building2 size={8} />
                                {member.role} en espacio
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(member.userId)}
                            disabled={isAdding === member.userId}
                            className={`h-8 px-4 rounded-[4px] text-[11px] font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${
                              isAdding === member.userId
                                ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                                : 'bg-[#6C5DD3] text-white hover:bg-[#312e81] shadow-lg shadow-[#6C5DD3]/20 active:scale-95'
                            }`}
                          >
                            {isAdding === member.userId ? 'Añadiendo...' : (
                              <><UserPlus size={14} strokeWidth={2.5} />Añadir</>
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 rounded-[4px] bg-zinc-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-zinc-200 dark:border-white/10">
                          <Search size={24} className="text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No se encontraron miembros</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Todos los miembros del espacio ya están en este tablero.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-white/5 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center px-6">
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Lumins Access Control</span>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManageBoardMembersModal;
