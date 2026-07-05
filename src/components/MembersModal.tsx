import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Plus, Trash2, Layout, ClipboardList, Check, Loader2, Lock, Search, UserPlus, Shield, User, Building2, Crown } from 'lucide-react';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

type Role = 'ADMIN' | 'MEMBER' | 'GUEST';

interface InviteRow {
  email: string;
  role: Role;
}

interface BoardMember {
  userId: string;
  role: string;
  inheritedFrom?: 'workspace' | 'owner' | null;
  wsRole?: string | null;
  isBoardOwner?: boolean;
  user: { id: string; name: string; email: string; avatarUrl?: string };
}

interface WorkspaceMember {
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; avatarUrl?: string };
}

const roleColors: Record<string, string> = {
  admin: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  editor: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  viewer: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  OWNER: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400',
  ADMIN: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400',
  MEMBER: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400',
};

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  workspaceName?: string;
  boardId?: string;
  boardName?: string;
  onUpdate?: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({
  isOpen, onClose, workspaceId: initialWorkspaceId, workspaceName, boardId, boardName, onUpdate
}) => {
  const { user: me } = useAuth();
  const [activeTab, setActiveTab] = useState<'invite' | 'manage'>('invite');

  // --- Invite state ---
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'MEMBER' }]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(initialWorkspaceId ? [initialWorkspaceId] : []);
  const [selectedBoards, setSelectedBoards] = useState<string[]>(boardId ? [boardId] : []);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- Manage state ---
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const activeWorkspaceId = initialWorkspaceId || (workspaces.length > 0 ? workspaces[0]?.id : '');

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (boardId) {
        fetchBoardMembersData();
        if (activeWorkspaceId) fetchWorkspaceMembersData();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (boardId && isOpen && activeWorkspaceId) {
      fetchWorkspaceMembersData();
    }
  }, [activeWorkspaceId]);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [wsRes, boardsRes] = await Promise.all([
        apiClient.get<{ data: { workspaces: any[] } }>('/api/workspaces'),
        apiClient.get<{ data: { boards: any[] } }>('/api/boards')
      ]);
      const fetchedWorkspaces = wsRes?.data?.workspaces || [];
      const fetchedBoards = boardsRes?.data?.boards || [];
      setWorkspaces(fetchedWorkspaces);
      setBoards(fetchedBoards);

      // If boardId is provided, auto-select its workspace
      if (boardId && fetchedBoards.length > 0) {
        const currentBoard = fetchedBoards.find(b => b.id === boardId);
        if (currentBoard && !selectedWorkspaces.length) {
          setSelectedWorkspaces([currentBoard.workspaceId]);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const fetchBoardMembersData = async () => {
    if (!boardId) return;
    try {
      setIsLoadingMembers(true);
      const res = await apiClient.get<{ data: { members: BoardMember[] } }>(`/api/boards/${boardId}/members`);
      setBoardMembers(res.data.members || []);
    } catch (err) {
      console.error('Failed to fetch board members', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchWorkspaceMembersData = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await apiClient.get<{ data: { workspace: { members: WorkspaceMember[] } } }>(`/api/workspaces/${activeWorkspaceId}`);
      setWorkspaceMembers(res.data.workspace.members || []);
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
    }
  };

  // --- Invite handlers ---
  const addInviteRow = () => setInvites([...invites, { email: '', role: 'MEMBER' }]);
  const removeInviteRow = (index: number) => { if (invites.length > 1) { const n = [...invites]; n.splice(index, 1); setInvites(n); } };
  const updateInviteRow = (index: number, field: keyof InviteRow, value: string) => {
    const n = [...invites]; n[index] = { ...n[index], [field]: value }; setInvites(n);
  };
  const toggleWorkspace = (id: string) => {
    const isSelected = selectedWorkspaces.includes(id);
    const wsBoardIds = boards.filter(b => b.workspaceId === id).map(b => b.id);
    if (isSelected) {
      setSelectedWorkspaces(prev => prev.filter(i => i !== id));
      setSelectedBoards(prev => prev.filter(bId => !wsBoardIds.includes(bId)));
    } else {
      const nonPrivateIds = boards.filter(b => b.workspaceId === id && b.visibility !== 'PRIVATE').map(b => b.id);
      setSelectedWorkspaces(prev => [...prev, id]);
      setSelectedBoards(prev => [...new Set([...prev, ...nonPrivateIds])]);
    }
  };
  const toggleBoard = (id: string) => {
    setSelectedBoards(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validInvites = invites.filter(i => i.email.trim() !== '');
    if (validInvites.length === 0) { setError('Añade al menos un email.'); return; }
    if (selectedWorkspaces.length === 0 && selectedBoards.length === 0) { setError('Selecciona al menos un destino.'); return; }
    setIsLoading(true); setError('');
    try {
      await apiClient.post('/api/workspaces/bulk/invites', {
        invites: validInvites,
        destinations: { workspaces: selectedWorkspaces, boards: selectedBoards }
      });
      setSuccess(true);
      setTimeout(() => handleClose(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar invitaciones');
    } finally { setIsLoading(false); }
  };

  // --- Manage handlers ---
  const handleAddMember = async (userId: string) => {
    if (!boardId) return;
    try {
      setIsAdding(userId);
      await apiClient.post(`/api/boards/${boardId}/members`, { userId, role: 'editor' });
      toast.success('Miembro añadido al tablero');
      fetchBoardMembersData();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo añadir' });
    } finally { setIsAdding(null); }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!boardId) return;
    try {
      await apiClient.patch(`/api/boards/${boardId}/members/${userId}`, { role: newRole });
      toast.success('Rol actualizado');
      fetchBoardMembersData();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo actualizar' });
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!boardId) return;
    if (!window.confirm(`¿Eliminar a ${name} del tablero?`)) return;
    try {
      await apiClient.delete(`/api/boards/${boardId}/members/${userId}`);
      toast.success('Miembro eliminado del tablero');
      fetchBoardMembersData();
      onUpdate?.();
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo eliminar' });
    }
  };

  const boardMemberIds = new Set(boardMembers.map(m => m.userId));
  const filteredAddable = workspaceMembers.filter(m =>
    !boardMemberIds.has(m.userId) &&
    (m.user.name.toLowerCase().includes(search.toLowerCase()) || m.user.email.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredBoardMembers = boardMembers.filter(m =>
    m.user.name.toLowerCase().includes(search.toLowerCase()) || m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const myBoardEntry = boardMembers.find(m => m.userId === me?.id);
  const myWsRole = myBoardEntry?.wsRole;
  const isWsAdmin = myWsRole === 'OWNER' || myWsRole === 'ADMIN';
  const isBoardAdmin = myBoardEntry?.role === 'admin';
  const myRole = myWsRole || myBoardEntry?.role || 'viewer';
  const canManageMembers = isWsAdmin || isBoardAdmin;

  const canEditMember = (member: BoardMember) => {
    if (!canManageMembers) return false;
    if (member.userId === me?.id) return false;
    if (member.inheritedFrom === 'owner' || member.isBoardOwner) return false;
    if (isBoardAdmin && !isWsAdmin && member.role === 'admin') return false;
    return true;
  };

  const handleClose = () => {
    setInvites([{ email: '', role: 'MEMBER' }]);
    setSelectedWorkspaces(initialWorkspaceId ? [initialWorkspaceId] : []);
    setSelectedBoards(boardId ? [boardId] : []);
    setError(''); setSuccess(false); setSearch('');
    onClose();
  };

  const currentBoard = boards.find(b => b.id === boardId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-md" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-[780px] bg-white dark:bg-[#1C1F26] rounded shadow-2xl relative overflow-hidden z-10 border border-zinc-200 dark:border-white/10 flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {boardId ? `Miembros del tablero` : 'Invitar al equipo'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {boardId 
                      ? `Gestiona quién tiene acceso a "${boardName || currentBoard?.name || ''}"`
                      : 'Añade colaboradores y define sus niveles de acceso.'}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4 gap-6 border-b border-zinc-100 dark:border-white/5">
              <button onClick={() => { setActiveTab('invite'); setSearch(''); }}
                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'invite' ? 'text-[#6C5DD3]' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                Invitar por email
                {activeTab === 'invite' && <motion.div layoutId="mtab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C5DD3]" />}
              </button>
              {boardId && (
                <button onClick={() => { setActiveTab('manage'); setSearch(''); }}
                  className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'manage' ? 'text-[#6C5DD3]' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                  Gestionar ({boardMembers.length})
                  {activeTab === 'manage' && <motion.div layoutId="mtab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C5DD3]" />}
                </button>
              )}
            </div>

            {activeTab === 'invite' && (
              <form onSubmit={handleInviteSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {success ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Mail size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">¡Invitaciones Enviadas!</h3>
                    <p className="text-zinc-500 dark:text-zinc-400">Hemos enviado los correos de invitación correctamente.</p>
                  </div>
                ) : (
                  <>
                    {/* Email section */}
                    <div className="space-y-3">
                      <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-1">¿A quién invitas?</h3>
                      <div className="space-y-3">
                        {invites.map((invite, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 sm:p-0 bg-zinc-50/50 dark:bg-white/5 sm:bg-transparent rounded sm:rounded-none border border-zinc-100 dark:border-white/5 sm:border-none">
                            <div className="flex-1">
                              <input type="email" value={invite.email}
                                onChange={(e) => updateInviteRow(index, 'email', e.target.value)}
                                placeholder="nombre@empresa.com"
                                className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all" required />
                            </div>
                            <select value={invite.role} onChange={(e) => updateInviteRow(index, 'role', e.target.value as Role)}
                              className="bg-zinc-50 dark:bg-[#13151A] text-zinc-700 dark:text-zinc-300 rounded p-3 text-sm font-bold border border-zinc-200 dark:border-white/10 outline-none cursor-pointer focus:ring-4 focus:ring-[#6C5DD3]/10 appearance-none w-[130px]">
                              <option value="ADMIN">Administrador</option>
                              <option value="MEMBER">Miembro</option>
                              <option value="GUEST">Invitado</option>
                            </select>
                            {invites.length > 1 && (
                              <button type="button" onClick={() => removeInviteRow(index)}
                                className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addInviteRow}
                        className="text-[#6C5DD3] dark:text-[#8E82E3] text-sm font-bold hover:underline flex items-center gap-2 group px-1">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Añadir otro destinatario
                      </button>
                    </div>

                    {/* Destinations section */}
                    <div className="space-y-3">
                      <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-1">Asignar acceso a...</h3>
                      <div className="border border-zinc-200 dark:border-white/10 rounded p-4 custom-scrollbar bg-zinc-50/30 dark:bg-black/10 space-y-6">
                        {workspaces.map((ws) => {
                          const workspaceBoards = boards.filter(b => b.workspaceId === ws.id);
                          const publicBoards = workspaceBoards.filter(b => b.visibility !== 'PRIVATE');
                          const privateBoards = workspaceBoards.filter(b => b.visibility === 'PRIVATE');
                          const isWsSelected = selectedWorkspaces.includes(ws.id);

                          return (
                            <div key={ws.id} className="space-y-3">
                              <div onClick={() => toggleWorkspace(ws.id)}
                                className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-all ${isWsSelected ? 'bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10 ring-1 ring-[#6C5DD3]/20' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isWsSelected ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-sm' : 'border-zinc-300 dark:border-white/10'}`}>
                                  {isWsSelected && <Check size={12} strokeWidth={4} />}
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                  <Layout size={18} className="text-[#6C5DD3]" />
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${isWsSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>{ws.name}</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Espacio de Trabajo</span>
                                  </div>
                                </div>
                                {isWsSelected && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">Acceso al espacio</span>}
                              </div>

                              {publicBoards.length > 0 && (
                                <div className="ml-8 space-y-1.5 border-l-2 border-zinc-100 dark:border-white/5 pl-4">
                                  <div className="flex items-center gap-2 px-2.5 py-1">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Tableros del espacio</span>
                                    {isWsSelected && <span className="text-[8px] text-emerald-500 font-bold">(acceso automático)</span>}
                                  </div>
                                  {publicBoards.map(board => {
                                    const isAutoSelected = isWsSelected;
                                    return (
                                    <div key={board.id} onClick={isAutoSelected ? undefined : () => toggleBoard(board.id)}
                                      className={`flex items-center gap-3 p-2.5 rounded transition-all ${isAutoSelected ? 'opacity-70 cursor-default' : 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5'} ${selectedBoards.includes(board.id) ? 'bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10' : ''}`}
                                      title={isAutoSelected ? 'Acceso automático por pertenecer al espacio de trabajo' : undefined}>
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedBoards.includes(board.id) ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-sm' : 'border-zinc-300 dark:border-white/10'}`}>
                                        {selectedBoards.includes(board.id) && <Check size={10} strokeWidth={4} />}
                                      </div>
                                      <ClipboardList size={14} className="text-zinc-400" />
                                      <span className={`text-sm font-medium ${selectedBoards.includes(board.id) ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{board.name}</span>
                                    </div>
                                    );
                                  })}
                                </div>
                              )}

                              {privateBoards.length > 0 && (
                                <div className="ml-8 space-y-1.5 border-l-2 border-amber-200 dark:border-amber-500/20 pl-4">
                                  <div className="flex items-center gap-2 px-2.5 py-1">
                                    <Lock size={10} className="text-amber-500" />
                                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Tableros Privados</span>
                                    <span className="text-[8px] text-amber-500/70 italic">(requiere selección manual)</span>
                                  </div>
                                  {privateBoards.map(board => (
                                    <div key={board.id} onClick={() => toggleBoard(board.id)}
                                      className={`flex items-center gap-3 p-2.5 rounded cursor-pointer transition-all ${selectedBoards.includes(board.id) ? 'bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/20' : 'hover:bg-amber-50/50 dark:hover:bg-amber-500/5'}`}
                                      title="Este tablero es privado. Los miembros del espacio no tienen acceso automático. Selecciona este board para invitarlos explícitamente.">
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedBoards.includes(board.id) ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'border-zinc-300 dark:border-white/10'}`}>
                                        {selectedBoards.includes(board.id) && <Check size={10} strokeWidth={4} />}
                                      </div>
                                      <Lock size={14} className="text-amber-400" />
                                      <span className={`text-sm font-medium ${selectedBoards.includes(board.id) ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{board.name}</span>
                                      <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                        <Lock size={10} className="text-amber-500" />
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Privado</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {workspaces.length === 0 && !isFetching && (
                          <div className="py-8 text-center text-zinc-500 text-sm italic">No se encontraron espacios de trabajo disponibles.</div>
                        )}
                      </div>

                      {(selectedWorkspaces.length > 0 || selectedBoards.length > 0) && (
                        <div className="px-4 py-3 rounded bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[11px] space-y-1">
                          <div className="flex items-center gap-2 text-zinc-500 font-medium">
                            <span className="w-2 h-2 rounded bg-[#6C5DD3]" />
                            {selectedWorkspaces.length} espacio(s) de trabajo
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500 font-medium">
                            <span className="w-2 h-2 rounded bg-amber-500" />
                            {selectedBoards.length} tablero(s) seleccionado(s)
                          </div>
                          <p className="text-zinc-400 italic mt-1">Los tableros del espacio se heredan automáticamente. Los privados deben seleccionarse individualmente.</p>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="text-rose-500 text-[13px] font-bold text-center bg-rose-50 dark:bg-rose-500/10 p-3 rounded border border-rose-100 dark:border-rose-500/20">
                        {error}
                      </div>
                    )}

                    <div className="flex justify-end items-center gap-4 pt-2">
                      <button type="button" onClick={handleClose}
                        className="px-6 py-3 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors">Cancelar</button>
                      <button type="submit"
                        disabled={isLoading || invites.every(i => !i.email.trim()) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0)}
                        className={`px-8 py-3 rounded font-bold text-white transition-all shadow-lg ${isLoading || invites.every(i => !i.email.trim()) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0) ? 'bg-zinc-200 dark:bg-white/5 text-zinc-400 cursor-not-allowed shadow-none' : 'bg-[#6C5DD3] hover:bg-[#5b4eb3] shadow-[#6C5DD3]/25 active:scale-[0.98]'}`}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Invitaciones'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {activeTab === 'manage' && boardId && (
              <div className="p-6 flex-1 overflow-hidden flex flex-col">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input type="text" placeholder="Buscar miembros..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] outline-none transition-all placeholder:text-zinc-400 font-medium" />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                  {isLoadingMembers ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-white/5" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-zinc-100 dark:bg-white/5 rounded w-1/2" />
                          <div className="h-3 bg-zinc-100 dark:bg-white/5 rounded w-3/4" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Board members */}
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1 py-2">Miembros del tablero</h4>
                        {filteredBoardMembers.length > 0 ? filteredBoardMembers.map((member) => {
                          const isMe = member.userId === me?.id;
                          const isInherited = !!member.inheritedFrom;
                          const displayRole = member.wsRole || member.role;
                          return (
                            <div key={member.userId} className="flex items-center justify-between p-3 rounded hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-white/10">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 ${isInherited ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 'bg-gradient-to-br from-[#6C5DD3] to-[#312e81]'}`}>
                                  {member.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{member.user.name}</span>
                                    {isMe && <span className="text-[9px] font-black text-[#6C5DD3] uppercase tracking-tighter bg-[#6C5DD3]/10 px-1.5 py-0.5 rounded">Tú</span>}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 font-medium truncate">{member.user.email}</div>
                                  {isInherited && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Building2 size={9} className="text-zinc-400" />
                                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">
                                        {member.inheritedFrom === 'owner' ? 'Propietario del tablero' : `Vía Espacio · ${member.wsRole === 'ADMIN' ? 'Administrador' : member.wsRole === 'MEMBER' ? 'Miembro' : member.wsRole === 'GUEST' ? 'Invitado' : member.wsRole}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                {isInherited ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${roleColors[displayRole] || roleColors.viewer}`}>
                                    <Lock size={9} />
                                    {displayRole === 'OWNER' ? 'Propietario' : displayRole === 'ADMIN' ? 'Administrador' : displayRole === 'MEMBER' || displayRole === 'editor' ? 'Miembro' : displayRole === 'GUEST' || displayRole === 'viewer' ? 'Invitado' : displayRole}
                                  </span>
                                ) : (
                                  <>
                                    {canEditMember(member) && (
                                      <select value={member.role} onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                                        className="bg-transparent text-[11px] font-bold text-zinc-500 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 outline-none focus:border-[#6C5DD3] transition-all hover:bg-white dark:hover:bg-white/5 uppercase tracking-tighter">
                                        <option value="admin">Administrador</option>
                                        <option value="editor">Miembro</option>
                                        <option value="viewer">Invitado</option>
                                      </select>
                                    )}
                                    {(isMe || !canEditMember(member)) && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${member.isBoardOwner ? roleColors.OWNER : roleColors[member.role] || roleColors.viewer}`}>
                                        {member.isBoardOwner ? 'Propietario' : member.role === 'admin' ? 'Administrador' : member.role === 'editor' ? 'Miembro' : 'Invitado'}
                                      </span>
                                    )}
                                    {canEditMember(member) && (
                                      <button onClick={() => handleRemoveMember(member.userId, member.user.name)}
                                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all" title="Eliminar del tablero">
                                        <Trash2 size={16} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="py-8 text-center opacity-50">
                            <User size={24} className="mx-auto mb-2 text-zinc-300" />
                            <p className="text-sm font-bold">No hay miembros que coincidan</p>
                          </div>
                        )}
                      </div>

                      {/* Addable WS members */}
                      {filteredAddable.length > 0 && (
                        <div className="space-y-1 pt-4 border-t border-zinc-100 dark:border-white/5">
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1 py-2">Añadir desde el espacio</h4>
                          {filteredAddable.map((member) => (
                            <div key={member.userId} className="flex items-center justify-between p-3 rounded hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 text-xs font-bold border border-zinc-200 dark:border-white/10">
                                  {member.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{member.user.name}</div>
                                  <div className="text-[11px] text-zinc-500 font-medium">{member.user.email}</div>
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded border mt-0.5 ${roleColors[member.role] || roleColors.viewer}`}>
                                    {member.role === 'OWNER' ? 'Propietario' : member.role === 'ADMIN' ? 'Administrador' : member.role === 'MEMBER' ? 'Miembro' : 'Invitado'} en espacio
                                  </span>
                                </div>
                              </div>
                              <button onClick={() => handleAddMember(member.userId)} disabled={isAdding === member.userId}
                                className={`h-8 px-4 rounded text-[11px] font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${isAdding === member.userId ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed' : 'bg-[#6C5DD3] text-white hover:bg-[#312e81] shadow-lg shadow-[#6C5DD3]/20 active:scale-95'}`}>
                                {isAdding === member.userId ? 'Añadiendo...' : <><UserPlus size={14} strokeWidth={2.5} />Añadir</>}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {boardMembers.length === 0 && filteredAddable.length === 0 && (
                        <div className="py-12 text-center">
                          <div className="w-16 h-16 rounded bg-zinc-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-dashed border-zinc-200 dark:border-white/10">
                            <Search size={24} className="text-zinc-300" />
                          </div>
                          <p className="text-sm font-bold text-zinc-500">No se encontraron miembros</p>
                          <p className="text-xs text-zinc-400 mt-1">Todos los miembros del espacio ya están en este tablero.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-white/5 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center px-6">
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Lumins Access Control</span>
              <button onClick={handleClose} className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MembersModal;