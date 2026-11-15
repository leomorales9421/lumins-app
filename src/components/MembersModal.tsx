import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Check, Lock,
  Search, Globe, Users, RotateCcw,
  Shield, Layout, ClipboardList, Building2, Trash2, User, UserPlus
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import ConfirmActionModal from './ConfirmActionModal';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import LuminsLogoLoader from './ui/LuminsLogoLoader';
import WorkspaceRolesHelpPopover from './WorkspaceRolesHelpPopover';
import { BoardRolesHelpPopover } from './BoardRolesHelpPopover';
import {
  LuminsBoardIcon,
  LuminsLockIcon,
  LuminsSuccessIcon,
  LuminsTrashIcon,
  LuminsMembersIcon,
} from './icons/LuminsIcons';

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

interface SentSummary {
  invites: Array<{ email: string; role: Role }>;
  addedMembers: Array<{ name: string; email: string; role: string }>;
  workspaces: Array<{ id: string; name: string }>;
  publicBoards: Array<{ id: string; name: string; workspaceName?: string }>;
  privateBoards: Array<{ id: string; name: string; workspaceName?: string }>;
}

const roleColors: Record<string, string> = {
  admin: 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] border-[var(--lumins-accent-border)]',
  editor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:border-white/10',
  viewer: 'bg-[#FFCC40]/15 text-[#B88600] border-[#FFCC40]/30 dark:text-[#FFCC40]',
  OWNER: 'bg-[#FFCC40]/15 text-[#B88600] border-[#FFCC40]/30 dark:text-[#FFCC40]',
  ADMIN: 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] border-[var(--lumins-accent-border)]',
  MEMBER: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:border-white/10',
  GUEST: 'bg-[#FF665E]/10 text-[#D94841] border-[#FF665E]/25 dark:text-[#FF857E]',
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
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(
    !boardId && initialWorkspaceId ? [initialWorkspaceId] : []
  );
  const [selectedBoards, setSelectedBoards] = useState<string[]>(boardId ? [boardId] : []);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentSummary, setSentSummary] = useState<SentSummary | null>(null);
  const [selectedWsMembers, setSelectedWsMembers] = useState<{userId: string; role: string}[]>([]);
  const [boardSearch, setBoardSearch] = useState('');
  const [showOtherWorkspaces, setShowOtherWorkspaces] = useState(false);

  // --- Manage state ---
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [removeMemberCandidate, setRemoveMemberCandidate] = useState<{ userId: string; name: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

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

      // Si se abrió desde un tablero específico, la invitación por email es exclusiva para ese tablero.
      if (boardId) {
        setSelectedWorkspaces([]);
        setSelectedBoards([boardId]);
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
  const toggleWsMember = (userId: string) => {
    setSelectedWsMembers(prev => {
      const exists = prev.find(m => m.userId === userId);
      if (exists) return prev.filter(m => m.userId !== userId);
      return [...prev, { userId, role: 'editor' }];
    });
  };
  const updateWsMemberRole = (userId: string, role: string) => {
    setSelectedWsMembers(prev => prev.map(m => m.userId === userId ? { ...m, role } : m));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validInvites = invites.filter(i => i.email.trim() !== '');
    if (validInvites.length === 0 && selectedWsMembers.length === 0) { setError('Añade al menos un email o selecciona miembros del espacio.'); return; }
    if (selectedWorkspaces.length === 0 && selectedBoards.length === 0) { setError('Selecciona al menos un destino.'); return; }

    // Check for duplicate emails against existing board members
    if (boardId && boardMembers.length > 0) {
      const boardEmails = new Set(boardMembers.map(m => m.user.email.toLowerCase()));
      const duplicate = validInvites.find(i => boardEmails.has(i.email.trim().toLowerCase()));
      if (duplicate) { setError(`"${duplicate.email}" ya es miembro del tablero.`); return; }
    }

    setIsLoading(true); setError('');
    try {
      if (validInvites.length > 0) {
        await apiClient.post('/api/workspaces/bulk/invites', {
          invites: validInvites,
          destinations: { workspaces: selectedWorkspaces, boards: selectedBoards }
        });
      }
      if (boardId && selectedWsMembers.length > 0) {
        await Promise.all(selectedWsMembers.map(m =>
          apiClient.post(`/api/boards/${boardId}/members`, { userId: m.userId, role: m.role })
        ));
      }

      // Prepare rich sent summary
      const invitedWs = workspaces
        .filter(w => selectedWorkspaces.includes(w.id))
        .map(w => ({ id: w.id, name: w.name }));

      const invitedBoardsList = boards.filter(b => selectedBoards.includes(b.id));
      if (boardId && selectedBoards.includes(boardId) && !invitedBoardsList.some(b => b.id === boardId)) {
        invitedBoardsList.push({
          id: boardId,
          name: boardName || currentBoard?.name || 'Tablero actual',
          visibility: currentBoard?.visibility || 'PRIVATE',
          workspaceId: initialWorkspaceId
        });
      }

      const pubBoards = invitedBoardsList
        .filter(b => b.visibility !== 'PRIVATE')
        .map(b => {
          const ws = workspaces.find(w => w.id === b.workspaceId);
          return { id: b.id, name: b.name, workspaceName: ws?.name };
        });

      const privBoards = invitedBoardsList
        .filter(b => b.visibility === 'PRIVATE')
        .map(b => {
          const ws = workspaces.find(w => w.id === b.workspaceId);
          return { id: b.id, name: b.name, workspaceName: ws?.name };
        });

      const addedFromWs = selectedWsMembers.map(m => {
        const mem = workspaceMembers.find(w => w.userId === m.userId);
        return {
          name: mem?.user?.name || 'Usuario',
          email: mem?.user?.email || '',
          role: m.role
        };
      });

      setSentSummary({
        invites: [...validInvites],
        addedMembers: addedFromWs,
        workspaces: invitedWs,
        publicBoards: pubBoards,
        privateBoards: privBoards
      });

      setSuccess(true);
      onUpdate?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar invitaciones');
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleResetInviteForm = () => {
    setInvites([{ email: '', role: 'MEMBER' }]);
    setSelectedWorkspaces(!boardId && initialWorkspaceId ? [initialWorkspaceId] : []);
    setSelectedBoards(boardId ? [boardId] : []);
    setSelectedWsMembers([]);
    setError('');
    setSuccess(false);
    setSentSummary(null);
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

  const handleRemoveMember = (userId: string, name: string) => {
    if (!boardId) return;
    setRemoveMemberCandidate({ userId, name });
  };

  const handleConfirmRemoveMember = async () => {
    if (!boardId || !removeMemberCandidate) return;
    setIsRemovingMember(true);
    try {
      await apiClient.delete(`/api/boards/${boardId}/members/${removeMemberCandidate.userId}`);
      toast.success('Miembro eliminado del tablero');
      fetchBoardMembersData();
      onUpdate?.();
      setRemoveMemberCandidate(null);
    } catch (err: any) {
      toast.error('Error', { description: err.response?.data?.message || 'No se pudo eliminar' });
    } finally {
      setIsRemovingMember(false);
    }
  };

  const boardMemberIds = new Set(boardMembers.map(m => m.userId));
  const filteredAddable = workspaceMembers.filter(m =>
    !boardMemberIds.has(m.userId) &&
    (m.user.name.toLowerCase().includes(search.toLowerCase()) || m.user.email.toLowerCase().includes(search.toLowerCase()))
  );
  const addableWsMembers = workspaceMembers.filter(m => !boardMemberIds.has(m.userId));

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
    setSelectedWorkspaces(!boardId && initialWorkspaceId ? [initialWorkspaceId] : []);
    setSelectedBoards(boardId ? [boardId] : []);
    setSelectedWsMembers([]);
    setError(''); 
    setSuccess(false); 
    setSentSummary(null);
    setSearch('');
    onClose();
  };

  const currentBoard = boards.find(b => b.id === boardId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="w-full sm:max-w-[780px] bg-white dark:bg-[#1C1F26] rounded-t-[28px] sm:rounded-2xl shadow-2xl relative overflow-hidden z-10 border-t sm:border border-zinc-200 dark:border-white/10 flex flex-col h-[88vh] sm:h-auto sm:max-h-[90vh]"
          >
            {/* Mobile Pull Bar */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0 bg-zinc-50/50 dark:bg-white/5">
              <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/60 dark:bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0">
                  <LuminsMembersIcon size={18} active />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate">
                    {boardId ? `Miembros del tablero` : 'Invitar al equipo'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium truncate max-w-[230px] sm:max-w-md">
                    {boardId 
                      ? `Gestiona quién tiene acceso a "${boardName || currentBoard?.name || ''}"`
                      : 'Define el rol en el espacio y los tableros a los que tendrán acceso.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Cerrar modal"
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 sm:px-6 pt-3 gap-5 border-b border-slate-100 dark:border-white/5 shrink-0 overflow-x-auto no-scrollbar">
              <button onClick={() => { setActiveTab('invite'); setSearch(''); }}
                className={`pb-3 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer ${activeTab === 'invite' ? 'text-[var(--lumins-accent-fg)]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'}`}>
                Invitar por email
                {activeTab === 'invite' && <motion.div layoutId="mtab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--lumins-accent)]" />}
              </button>
              {boardId && (
                <button onClick={() => { setActiveTab('manage'); setSearch(''); }}
                  className={`pb-3 text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer ${activeTab === 'manage' ? 'text-[var(--lumins-accent-fg)]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'}`}>
                  Gestionar ({boardMembers.length})
                  {activeTab === 'manage' && <motion.div layoutId="mtab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--lumins-accent)]" />}
                </button>
              )}
            </div>

            {activeTab === 'invite' && (
              <form onSubmit={handleInviteSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                  {success && sentSummary ? (
                  <div className="py-2 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    {/* Header banner */}
                    <div className="p-5 rounded-2xl bg-[var(--lumins-accent-soft)]/50 border border-[var(--lumins-accent-border)] text-left">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--lumins-accent-soft)] border border-[var(--lumins-accent-border)] flex items-center justify-center shrink-0">
                          <LuminsSuccessIcon size={28} />
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                              ¡Invitaciones Enviadas con Éxito!
                            </h3>
                            <Badge tone="teal" variant="dot" size="xs">
                              Enviado
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
                            Hemos enviado los correos de invitación y configurado los niveles de acceso correspondientes.
                          </p>

                          {/* Stat chips */}
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5 pt-3 border-t border-[var(--lumins-accent-border)]">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#13151A] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 shadow-xs">
                              <Users size={13} className="text-[var(--lumins-accent-fg)]" />
                              <strong className="text-slate-900 dark:text-zinc-100">{sentSummary.invites.length + sentSummary.addedMembers.length}</strong> {sentSummary.invites.length + sentSummary.addedMembers.length === 1 ? 'persona' : 'personas'}
                            </span>

                            {sentSummary.workspaces.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#13151A] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 shadow-xs">
                                <LuminsBoardIcon size={13} />
                                <strong className="text-slate-900 dark:text-zinc-100">{sentSummary.workspaces.length}</strong> {sentSummary.workspaces.length === 1 ? 'espacio' : 'espacios'}
                              </span>
                            )}

                            {sentSummary.publicBoards.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#13151A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shadow-xs">
                                <Globe size={13} className="text-emerald-600 dark:text-emerald-400" />
                                <strong className="text-zinc-900 dark:text-zinc-100">{sentSummary.publicBoards.length}</strong> {sentSummary.publicBoards.length === 1 ? 'tablero público' : 'tableros públicos'}
                              </span>
                            )}

                            {sentSummary.privateBoards.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shadow-xs">
                                <Lock size={12} className="text-amber-500" />
                                <strong className="text-amber-900 dark:text-amber-200">{sentSummary.privateBoards.length}</strong> {sentSummary.privateBoards.length === 1 ? 'tablero privado' : 'tableros privados'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Destinatarios */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                          <Users size={13} className="text-[var(--lumins-accent-fg)]" />
                          Personas Invitadas ({sentSummary.invites.length + sentSummary.addedMembers.length})
                        </h4>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Rol y estado</span>
                      </div>

                      <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-2 border border-zinc-200/80 dark:border-white/10 rounded-xl p-2.5 bg-zinc-50/50 dark:bg-white/[0.02]">
                        {sentSummary.invites.map((inv, idx) => (
                          <div key={`inv-${idx}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] flex items-center justify-center font-bold text-xs shrink-0">
                                {inv.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {inv.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Invitación enviada por email
                                </div>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              inv.role === 'ADMIN'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                : inv.role === 'MEMBER'
                                ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] border border-[var(--lumins-accent-border)]'
                                : 'bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-zinc-300 border border-zinc-200 dark:border-white/10'
                            }`}>
                              {inv.role === 'ADMIN' ? 'Administrador' : inv.role === 'MEMBER' ? 'Miembro' : 'Invitado'}
                            </span>
                          </div>
                        ))}

                        {sentSummary.addedMembers.map((mem, idx) => (
                          <div key={`mem-${idx}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {mem.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {mem.name}
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate">{mem.email}</div>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] border border-[var(--lumins-accent-border)]">
                              {mem.role === 'admin' ? 'Administrador' : mem.role === 'editor' ? 'Miembro' : 'Invitado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Destinos Asignados (Espacios, Tableros Públicos y Privados) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                          <Shield size={13} className="text-[var(--lumins-accent-fg)]" />
                          Destinos con acceso asignado
                        </h4>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {sentSummary.workspaces.length + sentSummary.publicBoards.length + sentSummary.privateBoards.length} destino(s)
                        </span>
                      </div>

                      <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-2 border border-zinc-200/80 dark:border-white/10 rounded-xl p-2.5 bg-zinc-50/50 dark:bg-white/[0.02]">
                        {/* Espacios de Trabajo */}
                        {sentSummary.workspaces.map(ws => (
                          <div key={`ws-${ws.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] flex items-center justify-center shrink-0">
                                <Layout size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {ws.name}
                                </div>
                                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Espacio de Trabajo</div>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] border border-[var(--lumins-accent-border)] shrink-0">
                              Acceso al Espacio
                            </span>
                          </div>
                        ))}

                        {/* Tableros Públicos / del Espacio */}
                        {sentSummary.publicBoards.map(board => (
                          <div key={`pb-${board.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <ClipboardList size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {board.name}
                                </div>
                                {board.workspaceName && (
                                  <div className="text-[10px] text-zinc-400 truncate">
                                    Espacio: {board.workspaceName}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                              <Globe size={11} />
                              Tablero Público / Espacio
                            </span>
                          </div>
                        ))}

                        {/* Tableros Privados */}
                        {sentSummary.privateBoards.map(board => (
                          <div key={`prb-${board.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/25 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <Lock size={15} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {board.name}
                                </div>
                                {board.workspaceName && (
                                  <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate">
                                    Espacio: {board.workspaceName}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30 shrink-0">
                              <Lock size={10} />
                              Tablero Privado
                            </span>
                          </div>
                        ))}

                        {sentSummary.workspaces.length === 0 && sentSummary.publicBoards.length === 0 && sentSummary.privateBoards.length === 0 && (
                          <div className="py-4 text-center text-xs text-zinc-400 italic">
                            Sin destinos específicos registrados
                          </div>
                        )}
                      </div>
                    </div>

                      {/* Footer Actions inside Success */}
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <button
                        type="button"
                        onClick={handleResetInviteForm}
                        className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[var(--lumins-accent-fg)] hover:bg-[var(--lumins-accent-soft)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw size={15} />
                        Invitar a más personas
                      </button>

                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] hover:brightness-95 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check size={16} strokeWidth={2.5} />
                        Listo, cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Paso 1: ¿A quién invitas y con qué rol? */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] text-[10px] font-bold flex items-center justify-center">1</span>
                          <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.16em]">
                            ¿A quién invitas y con qué rol?
                          </h3>
                          <WorkspaceRolesHelpPopover align="start" compact />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {invites.map((invite, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 sm:p-0 bg-slate-50/70 dark:bg-white/5 sm:bg-transparent rounded-xl sm:rounded-none border border-slate-200/70 dark:border-white/5 sm:border-none"
                          >
                            <div className="flex-1">
                              <input
                                type="email"
                                value={invite.email}
                                onChange={(e) => updateInviteRow(index, 'email', e.target.value)}
                                placeholder="nombre@empresa.com"
                                className="w-full h-10 bg-white dark:bg-[#13151A] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[var(--lumins-accent)]/15 focus:border-[var(--lumins-accent)] transition-all"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 sm:w-[165px]">
                                <Select
                                  uiSize="sm"
                                  value={invite.role}
                                  onChange={(e) => updateInviteRow(index, 'role', e.target.value as Role)}
                                >
                                  <option value="ADMIN">Administrador</option>
                                  <option value="MEMBER">Miembro</option>
                                  <option value="GUEST">Invitado</option>
                                </Select>
                              </div>
                              {invites.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeInviteRow(index)}
                                  title="Quitar destinatario"
                                  className="p-2 rounded-lg text-slate-400 hover:text-[#FF665E] hover:bg-[#FF665E]/10 transition-colors cursor-pointer"
                                >
                                  <LuminsTrashIcon size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 px-1">
                        <button
                          type="button"
                          onClick={addInviteRow}
                          className="text-[var(--lumins-accent-fg)] hover:opacity-80 text-xs font-bold flex items-center gap-1.5 group cursor-pointer"
                        >
                          <Plus size={15} className="group-hover:rotate-90 transition-transform" />
                          Añadir otro destinatario
                        </button>

                        {/* Resumen claro de qué permisos otorga el rol elegido */}
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <BoardRolesHelpPopover align="end" />
                          <span>
                            {boardId
                              ? invites.some(i => i.role === 'GUEST')
                                ? 'Invitado: solo lectura (Lector) en este tablero.'
                                : invites.every(i => i.role === 'ADMIN')
                                ? 'Administrador: permiso Admin en este tablero.'
                                : 'Miembro: permiso Editor en este tablero.'
                              : invites.some(i => i.role === 'GUEST')
                              ? 'Invitado: solo lectura (Lector) en los tableros que marques abajo.'
                              : invites.every(i => i.role === 'ADMIN')
                              ? 'Administrador: permiso Admin por defecto en tableros visibles.'
                              : 'Miembro: permiso Editor por defecto en tableros visibles.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Paso 2: ¿A dónde los estás invitando? */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)] text-[10px] font-bold flex items-center justify-center">2</span>
                          <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.16em]">
                            {boardId ? 'Tablero de destino' : '¿A dónde los estás invitando?'}
                          </h3>
                        </div>
                        {!boardId && workspaces.length > 1 && initialWorkspaceId && (
                          <button
                            type="button"
                            onClick={() => setShowOtherWorkspaces(v => !v)}
                            className="text-[11px] font-semibold text-[var(--lumins-accent-fg)] hover:underline cursor-pointer"
                          >
                            {showOtherWorkspaces ? 'Solo este espacio' : `Ver todos los espacios (${workspaces.length})`}
                          </button>
                        )}
                      </div>

                      {boardId ? (
                        <div className="rounded-xl border border-[var(--lumins-accent-border)] bg-[var(--lumins-accent-soft)]/45 p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] flex items-center justify-center shrink-0">
                              <LuminsBoardIcon size={18} active />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                                {boardName || currentBoard?.name || 'Tablero actual'}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                                Invitación directa solo a este tablero
                              </div>
                            </div>
                          </div>
                          <Badge tone="teal" variant="dot" size="xs">
                            Incluido
                          </Badge>
                        </div>
                      ) : isFetching ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/40 dark:bg-black/10">
                          <LuminsLogoLoader size="xs" />
                          <span className="text-[11px] font-semibold text-slate-400">Cargando espacios y tableros...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(initialWorkspaceId && !showOtherWorkspaces
                            ? workspaces.filter(ws => ws.id === initialWorkspaceId)
                            : workspaces
                          ).map((ws) => {
                            const workspaceBoards = boards.filter(b => b.workspaceId === ws.id);
                            const publicBoards = workspaceBoards.filter(b => b.visibility !== 'PRIVATE');
                            const privateBoards = workspaceBoards.filter(b => b.visibility === 'PRIVATE');
                            const isWsSelected = selectedWorkspaces.includes(ws.id);
                            const hasGuestInvitee = invites.some(i => i.role === 'GUEST');

                            // Si todos son ADMIN/MEMBER y el espacio está marcado, los tableros públicos se heredan:
                            // solo mostramos selección manual para tableros privados (o todos si hay Invitado / espacio desmarcado).
                            const selectableBoards =
                              isWsSelected && !hasGuestInvitee ? privateBoards : workspaceBoards;

                            const filteredSelectableBoards = selectableBoards.filter(b =>
                              !boardSearch.trim() ||
                              b.name.toLowerCase().includes(boardSearch.trim().toLowerCase())
                            );

                            return (
                              <div
                                key={ws.id}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-black/10 overflow-hidden"
                              >
                                {/* Workspace header toggle */}
                                <div
                                  onClick={() => toggleWorkspace(ws.id)}
                                  className={`flex items-center justify-between gap-3 p-3.5 cursor-pointer transition-all ${
                                    isWsSelected
                                      ? 'bg-[var(--lumins-accent-soft)]/50 border-b border-[var(--lumins-accent-border)]'
                                      : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div
                                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                                        isWsSelected
                                          ? 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)]'
                                          : 'border-slate-300 dark:border-white/20 bg-white dark:bg-[#13151A]'
                                      }`}
                                    >
                                      {isWsSelected && <Check size={12} strokeWidth={3.5} />}
                                    </div>
                                    <LuminsBoardIcon size={18} className="shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                                        {ws.name}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                                        {workspaceBoards.length} {workspaceBoards.length === 1 ? 'tablero' : 'tableros'} en este espacio
                                      </div>
                                    </div>
                                  </div>

                                  {isWsSelected ? (
                                    <Badge tone="teal" variant="dot" size="xs">
                                      Incluido
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] font-semibold text-slate-400">Opcional</span>
                                  )}
                                </div>

                                {/* Board selection area */}
                                <div className="p-3 space-y-2.5">
                                  {isWsSelected && !hasGuestInvitee && publicBoards.length > 0 && (
                                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#1C1F26] border border-slate-200/80 dark:border-white/10 text-xs">
                                      <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 min-w-0">
                                        <Globe size={14} className="text-[var(--lumins-accent-fg)] shrink-0" />
                                        <span className="truncate">
                                          Acceso automático a <strong>{publicBoards.length}</strong> {publicBoards.length === 1 ? 'tablero visible' : 'tableros visibles'} del espacio
                                        </span>
                                      </div>
                                      <Badge tone="teal" variant="inline" size="xs">
                                        Heredado
                                      </Badge>
                                    </div>
                                  )}

                                  {selectableBoards.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                                          {hasGuestInvitee ? (
                                            <>Selecciona los tableros para Invitado ({selectableBoards.length})</>
                                          ) : (
                                            <>
                                              <LuminsLockIcon size={12} />
                                              Tableros privados (selección manual)
                                            </>
                                          )}
                                        </span>

                                        {selectableBoards.length > 4 && (
                                          <div className="relative w-44">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                              type="text"
                                              value={boardSearch}
                                              onChange={(e) => setBoardSearch(e.target.value)}
                                              placeholder="Filtrar tablero..."
                                              className="w-full h-7 pl-7 pr-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13151A] text-[11px] text-slate-700 dark:text-zinc-200 outline-none focus:border-[var(--lumins-accent)]"
                                            />
                                          </div>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                                        {filteredSelectableBoards.map((board) => {
                                          const checked = selectedBoards.includes(board.id);
                                          const isPrivate = board.visibility === 'PRIVATE';
                                          return (
                                            <div
                                              key={board.id}
                                              onClick={() => toggleBoard(board.id)}
                                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                                checked
                                                  ? isPrivate
                                                    ? 'bg-[#FFCC40]/10 border-[#FFCC40]/40 text-slate-900 dark:text-zinc-100'
                                                    : 'bg-[var(--lumins-accent-soft)] border-[var(--lumins-accent-border)] text-slate-900 dark:text-zinc-100'
                                                  : 'bg-white dark:bg-[#1C1F26] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-white/20'
                                              }`}
                                            >
                                              <div
                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                                  checked
                                                    ? isPrivate
                                                      ? 'bg-[#FFCC40] border-[#FFCC40] text-slate-900'
                                                      : 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)]'
                                                    : 'border-slate-300 dark:border-white/20'
                                                }`}
                                              >
                                                {checked && <Check size={10} strokeWidth={3.5} />}
                                              </div>
                                              <span className="text-xs font-semibold truncate flex-1">{board.name}</span>
                                              {isPrivate && (
                                                <Lock size={11} className="text-[#D99B00] dark:text-[#FFCC40] shrink-0" />
                                              )}
                                            </div>
                                          );
                                        })}
                                        {filteredSelectableBoards.length === 0 && (
                                          <div className="col-span-full py-3 text-center text-xs text-slate-400">
                                            No hay tableros que coincidan con &ldquo;{boardSearch}&rdquo;.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {workspaces.length === 0 && !isFetching && (
                            <div className="py-6 text-center text-slate-500 text-xs italic border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                              No se encontraron espacios de trabajo disponibles.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {boardId && addableWsMembers.length > 0 && (
                      <div className="space-y-2.5">
                        <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.16em] px-1">
                          Miembros del espacio para añadir al tablero
                        </h3>
                        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-2.5 space-y-1.5 bg-slate-50/40 dark:bg-black/10 max-h-44 overflow-y-auto custom-scrollbar">
                          {addableWsMembers.map(member => {
                            const isSelected = selectedWsMembers.some(m => m.userId === member.userId);
                            const currentRole = selectedWsMembers.find(m => m.userId === member.userId)?.role || 'editor';
                            return (
                              <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-[#1C1F26] border border-slate-100 dark:border-white/5">
                                <div onClick={() => toggleWsMember(member.userId)}
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${isSelected ? 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)]' : 'border-slate-300 dark:border-white/20'}`}>
                                  {isSelected && <Check size={10} strokeWidth={3.5} />}
                                </div>
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-zinc-300 shrink-0 border border-slate-200 dark:border-white/10">
                                    {member.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{member.user.name}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{member.user.email}</div>
                                  </div>
                                </div>
                                <div className="w-28 shrink-0">
                                  <Select
                                    uiSize="sm"
                                    value={currentRole}
                                    onChange={(e) => updateWsMemberRole(member.userId, e.target.value)}
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Lector</option>
                                  </Select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="text-[#D94841] dark:text-[#FF857E] text-xs font-semibold text-center bg-[#FF665E]/10 p-3 rounded-xl border border-[#FF665E]/25">
                        {error}
                      </div>
                    )}
                  </>
                )}
                </div>

                {/* Footer fijo siempre visible */}
                {!success && (
                  <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:pb-3.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      <Badge tone="teal" variant="dot" size="xs">
                        {invites.filter(i => i.email.trim()).length || 0} {invites.filter(i => i.email.trim()).length === 1 ? 'invitado' : 'invitados'}
                      </Badge>
                      {boardId ? (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[220px]">Solo en este tablero</span>
                        </>
                      ) : (
                        <>
                          <span>·</span>
                          <span>{selectedWorkspaces.length} {selectedWorkspaces.length === 1 ? 'espacio' : 'espacios'}</span>
                          {selectedBoards.length > 0 && (
                            <>
                              <span>·</span>
                              <span>{selectedBoards.length} {selectedBoards.length === 1 ? 'tablero' : 'tableros'}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-[#13151A] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Cerrar
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || (invites.every(i => !i.email.trim()) && selectedWsMembers.length === 0) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0)}
                        className={`h-9 px-5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          isLoading || (invites.every(i => !i.email.trim()) && selectedWsMembers.length === 0) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0)
                            ? 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-zinc-400 cursor-not-allowed'
                            : 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] hover:brightness-95 shadow-sm cursor-pointer active:scale-[0.98]'
                        }`}
                      >
                        {isLoading ? 'Enviando...' : 'Enviar Invitaciones'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}

            {activeTab === 'manage' && boardId && (
              <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
                <div className="relative mb-3 sm:mb-4 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input type="text" placeholder="Buscar miembros del tablero o del espacio..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-8 bg-white dark:bg-[#13151A] border border-slate-200 dark:border-white/10 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-[var(--lumins-accent)]/15 focus:border-[var(--lumins-accent)] outline-none transition-all placeholder:text-slate-400 font-medium" />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
                  {isLoadingMembers ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
                          <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-3/4" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Board members */}
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] px-1 py-1">
                          Con acceso al tablero ({filteredBoardMembers.length})
                        </h4>
                        {filteredBoardMembers.length > 0 ? filteredBoardMembers.map((member) => {
                          const isMe = member.userId === me?.id;
                          const isInherited = !!member.inheritedFrom;
                          const displayRole = member.wsRole || member.role;
                          return (
                            <div key={member.userId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] sm:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-slate-100 dark:border-white/5 sm:border-transparent sm:hover:border-slate-200/80 sm:dark:hover:border-white/10">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  style={
                                    !isInherited
                                      ? { backgroundColor: 'var(--lumins-accent)', color: 'var(--lumins-accent-on)' }
                                      : undefined
                                  }
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-xs shrink-0 ${
                                    isInherited ? 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-200' : ''
                                  }`}
                                >
                                  {member.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{member.user.name}</span>
                                    {isMe && (
                                      <span className="text-[9px] font-bold text-[var(--lumins-accent-fg)] bg-[var(--lumins-accent-soft)] border border-[var(--lumins-accent-border)] uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                        Tú
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">{member.user.email}</div>
                                  {isInherited && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Building2 size={10} className="text-slate-400 shrink-0" />
                                      <span className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                                        {member.inheritedFrom === 'owner' ? 'Propietario del tablero' : `Vía Espacio · ${member.wsRole === 'ADMIN' ? 'Administrador' : member.wsRole === 'MEMBER' ? 'Miembro' : member.wsRole === 'GUEST' ? 'Invitado' : member.wsRole}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5 shrink-0">
                                {isInherited ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${roleColors[displayRole] || roleColors.viewer}`}>
                                    <Lock size={10} />
                                    {displayRole === 'OWNER' ? 'Propietario' : displayRole === 'ADMIN' ? 'Administrador' : displayRole === 'MEMBER' || displayRole === 'editor' ? 'Miembro' : displayRole === 'GUEST' || displayRole === 'viewer' ? 'Invitado' : displayRole}
                                  </span>
                                ) : (
                                  <>
                                    {canEditMember(member) && (
                                      <div className="w-36">
                                        <Select
                                          uiSize="sm"
                                          value={member.role}
                                          onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                                        >
                                          <option value="admin">Administrador</option>
                                          <option value="editor">Miembro</option>
                                          <option value="viewer">Invitado</option>
                                        </Select>
                                      </div>
                                    )}
                                    {(isMe || !canEditMember(member)) && (
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${member.isBoardOwner ? roleColors.OWNER : roleColors[member.role] || roleColors.viewer}`}>
                                        {member.isBoardOwner ? 'Propietario' : member.role === 'admin' ? 'Administrador' : member.role === 'editor' ? 'Miembro' : 'Invitado'}
                                      </span>
                                    )}
                                    {canEditMember(member) && (
                                      <button onClick={() => handleRemoveMember(member.userId, member.user.name)}
                                        className="p-1.5 text-slate-400 hover:text-[#FF665E] hover:bg-[#FF665E]/10 active:scale-95 rounded-lg transition-all cursor-pointer" title="Eliminar del tablero">
                                        <LuminsTrashIcon size={16} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="py-6 text-center opacity-60">
                            <User size={22} className="mx-auto mb-1.5 text-slate-300" />
                            <p className="text-xs font-bold text-slate-500">No hay miembros que coincidan</p>
                          </div>
                        )}
                      </div>

                      {/* Addable WS members */}
                      <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between px-1 py-1">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                            En tu espacio (sin acceso directo aún)
                          </h4>
                          <button
                            type="button"
                            onClick={() => { setActiveTab('invite'); setSearch(''); }}
                            className="text-[11px] font-bold text-[var(--lumins-accent-fg)] hover:underline cursor-pointer"
                          >
                            Invitar por email →
                          </button>
                        </div>

                        {filteredAddable.length > 0 ? filteredAddable.map((member) => (
                          <div key={member.userId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] sm:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-slate-100 dark:border-white/5 sm:border-transparent sm:hover:border-slate-200/80 sm:dark:hover:border-white/10">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-zinc-300 text-xs font-bold border border-slate-200 dark:border-white/10 shrink-0">
                                {member.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{member.user.name}</div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate">{member.user.email}</div>
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 ${roleColors[member.role] || roleColors.viewer}`}>
                                  {member.role === 'OWNER' ? 'Propietario' : member.role === 'ADMIN' ? 'Administrador' : member.role === 'MEMBER' ? 'Miembro' : 'Invitado'} en espacio
                                </span>
                              </div>
                            </div>
                            <button onClick={() => handleAddMember(member.userId)} disabled={isAdding === member.userId}
                              className={`w-full sm:w-auto h-8 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${isAdding === member.userId ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed' : 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] hover:brightness-95 shadow-xs active:scale-95'}`}>
                              {isAdding === member.userId ? 'Añadiendo...' : <><UserPlus size={13} strokeWidth={2.5} />Añadir al tablero</>}
                            </button>
                          </div>
                        )) : (
                          <p className="text-xs text-slate-400 dark:text-zinc-500 px-1 py-1.5">
                            Todos los miembros de tu espacio ya tienen acceso a este tablero. Usa «Invitar por email» para sumar personas nuevas.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer (solo en pestaña gestionar para evitar doble footer con el formulario) */}
            {activeTab === 'manage' && (
              <div className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex justify-between items-center px-4 sm:px-6 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  {boardMembers.length} {boardMembers.length === 1 ? 'persona con acceso' : 'personas con acceso'}
                </span>
                <button onClick={handleClose} className="h-9 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-[#13151A] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                  Cerrar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Confirmación para eliminar miembro del tablero */}
      <ConfirmActionModal
        isOpen={!!removeMemberCandidate}
        title="Eliminar miembro del tablero"
        description={`¿Estás seguro de que deseas eliminar a "${removeMemberCandidate?.name}" del tablero?`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isRemovingMember}
        onClose={() => {
          if (!isRemovingMember) setRemoveMemberCandidate(null);
        }}
        onConfirm={handleConfirmRemoveMember}
      />
    </AnimatePresence>
  );
};

export default MembersModal;