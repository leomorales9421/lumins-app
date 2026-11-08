import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Plus, Trash2, Layout, ClipboardList, Check, Loader2, Lock, 
  CheckCircle2, Globe, Users, Shield, RotateCcw 
} from 'lucide-react';
import apiClient from '../lib/api-client';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string; // Optional now as we can select multiple
  workspaceName?: string;
}

type Role = 'ADMIN' | 'MEMBER' | 'GUEST';

interface InviteRow {
  email: string;
  role: Role;
}

interface SentSummary {
  invites: Array<{ email: string; role: Role }>;
  workspaces: Array<{ id: string; name: string }>;
  publicBoards: Array<{ id: string; name: string; workspaceName?: string }>;
  privateBoards: Array<{ id: string; name: string; workspaceName?: string }>;
}

const InviteMembersModal: React.FC<InviteMembersModalProps> = ({ 
  isOpen, 
  onClose, 
  workspaceId: initialWorkspaceId,
}) => {
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'MEMBER' }]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(initialWorkspaceId ? [initialWorkspaceId] : []);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentSummary, setSentSummary] = useState<SentSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [wsRes, boardsRes] = await Promise.all([
        apiClient.get<{ data: { workspaces: any[] } }>('/api/workspaces'),
        apiClient.get<{ data: { boards: any[] } }>('/api/boards')
      ]);
      setWorkspaces(wsRes?.data?.workspaces || []);
      setBoards(boardsRes?.data?.boards || []);
    } catch (err) {
      console.error('Error fetching data for invite modal:', err);
    } finally {
      setIsFetching(false);
    }
  };

  const addInviteRow = () => {
    setInvites([...invites, { email: '', role: 'MEMBER' }]);
  };

  const removeInviteRow = (index: number) => {
    if (invites.length > 1) {
      const newInvites = [...invites];
      newInvites.splice(index, 1);
      setInvites(newInvites);
    }
  };

  const updateInviteRow = (index: number, field: keyof InviteRow, value: string) => {
    const newInvites = [...invites];
    newInvites[index] = { ...newInvites[index], [field]: value };
    setInvites(newInvites);
  };

  const toggleWorkspace = (id: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleBoard = (id: string) => {
    setSelectedBoards(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validInvites = invites.filter(i => i.email.trim() !== '');
    if (validInvites.length === 0) {
      setError('Por favor añade al menos un email válido.');
      return;
    }

    if (selectedWorkspaces.length === 0 && selectedBoards.length === 0) {
      setError('Selecciona al menos un espacio o tablero de destino.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/api/workspaces/bulk/invites', {
        invites: validInvites,
        destinations: {
          workspaces: selectedWorkspaces,
          boards: selectedBoards
        }
      });
      
      const invitedWs = workspaces
        .filter(w => selectedWorkspaces.includes(w.id))
        .map(w => ({ id: w.id, name: w.name }));

      const invitedBoardsList = boards.filter(b => selectedBoards.includes(b.id));

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

      setSentSummary({
        invites: [...validInvites],
        workspaces: invitedWs,
        publicBoards: pubBoards,
        privateBoards: privBoards
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar las invitaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInviteForm = () => {
    setInvites([{ email: '', role: 'MEMBER' }]);
    setSelectedWorkspaces(initialWorkspaceId ? [initialWorkspaceId] : []);
    setSelectedBoards([]);
    setError('');
    setSuccess(false);
    setSentSummary(null);
  };

  const handleClose = () => {
    setInvites([{ email: '', role: 'MEMBER' }]);
    setSelectedWorkspaces(initialWorkspaceId ? [initialWorkspaceId] : []);
    setSelectedBoards([]);
    setError('');
    setSuccess(false);
    setSentSummary(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-[600px] bg-white dark:bg-[#1C1F26] rounded shadow-2xl p-6 sm:p-8 relative overflow-hidden z-10 border border-zinc-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6 sm:mb-8">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Invitar al equipo</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Añade colaboradores y define sus niveles de acceso.
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
              >
                <X size={20} className="sm:hidden" />
                <X size={24} className="hidden sm:block" />
              </button>
            </div>

            {success && sentSummary ? (
              <div className="py-2 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                {/* Header banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                      <CheckCircle2 size={26} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                          ¡Invitaciones Enviadas con Éxito!
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Enviado
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        Hemos enviado los correos de invitación y configurado los niveles de acceso correspondientes.
                      </p>

                      {/* Stat chips */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5 pt-3 border-t border-emerald-500/15">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#13151A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shadow-xs">
                          <Users size={13} className="text-[#6C5DD3]" />
                          <strong className="text-zinc-900 dark:text-zinc-100">{sentSummary.invites.length}</strong> {sentSummary.invites.length === 1 ? 'persona' : 'personas'}
                        </span>

                        {sentSummary.workspaces.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#13151A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shadow-xs">
                            <Layout size={13} className="text-[#6C5DD3]" />
                            <strong className="text-zinc-900 dark:text-zinc-100">{sentSummary.workspaces.length}</strong> {sentSummary.workspaces.length === 1 ? 'espacio' : 'espacios'}
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
                      <Users size={13} className="text-[#6C5DD3]" />
                      Personas Invitadas ({sentSummary.invites.length})
                    </h4>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Rol y estado</span>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-2 border border-zinc-200/80 dark:border-white/10 rounded-xl p-2.5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    {sentSummary.invites.map((inv, idx) => (
                      <div key={`inv-${idx}`} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/60 dark:border-white/5 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center font-bold text-xs shrink-0">
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
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-zinc-300 border border-zinc-200 dark:border-white/10'
                        }`}>
                          {inv.role === 'ADMIN' ? 'Administrador' : inv.role === 'MEMBER' ? 'Miembro' : 'Invitado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Destinos Asignados (Espacios, Tableros Públicos y Privados) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Shield size={13} className="text-[#6C5DD3]" />
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
                          <div className="w-8 h-8 rounded-lg bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center shrink-0">
                            <Layout size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {ws.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Espacio de Trabajo</div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6C5DD3]/10 text-[#6C5DD3] border border-[#6C5DD3]/20 shrink-0">
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
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleResetInviteForm}
                    className="px-4 py-2.5 rounded-xl sm:rounded text-xs sm:text-sm font-bold text-[#6C5DD3] dark:text-[#8E82E3] hover:bg-[#6C5DD3]/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={15} />
                    Invitar a más personas
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 sm:py-3 rounded-xl sm:rounded font-bold text-xs sm:text-sm text-white bg-[#6C5DD3] hover:bg-[#5b4eb3] shadow-lg shadow-[#6C5DD3]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={16} strokeWidth={2.5} />
                    Listo, cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Who are you inviting? */}
                <div className="space-y-4">
                  <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-1">¿A quién invitas?</h3>
                  <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {invites.map((invite, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-0 bg-zinc-50/50 dark:bg-white/5 sm:bg-transparent rounded-lg sm:rounded-none border border-zinc-100 dark:border-white/5 sm:border-none">
                        <div className="flex-1">
                          <input 
                            type="email"
                            value={invite.email}
                            onChange={(e) => updateInviteRow(index, 'email', e.target.value)}
                            placeholder="nombre@empresa.com"
                            className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded p-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 sm:w-40">
                            <select 
                              value={invite.role}
                              onChange={(e) => updateInviteRow(index, 'role', e.target.value as Role)}
                              className="w-full bg-zinc-50 dark:bg-[#13151A] text-zinc-700 dark:text-zinc-300 rounded p-3 text-sm font-bold border border-zinc-200 dark:border-white/10 outline-none cursor-pointer focus:ring-4 focus:ring-[#6C5DD3]/10 appearance-none"
                            >
                              <option value="ADMIN">Administrador</option>
                              <option value="MEMBER">Miembro</option>
                              <option value="GUEST">Invitado</option>
                            </select>
                          </div>
                          {invites.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeInviteRow(index)}
                              className="p-3 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={addInviteRow}
                    className="text-[#6C5DD3] dark:text-[#8E82E3] text-sm font-bold mt-2 hover:underline cursor-pointer flex items-center gap-2 group px-1"
                  >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    Añadir otro destinatario
                  </button>
                </div>

                {/* Section 2: Destinations */}
                <div className="space-y-4">
                  <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-1">Asignar acceso a...</h3>
                  
                  <div className="max-h-[300px] overflow-y-auto border border-zinc-200 dark:border-white/10 rounded p-4 custom-scrollbar bg-zinc-50/30 dark:bg-black/10 space-y-6">
                    {workspaces.map((ws) => {
                      const workspaceBoards = boards.filter(b => b.workspaceId === ws.id);
                      const publicBoards = workspaceBoards.filter(b => b.visibility !== 'PRIVATE');
                      const privateBoards = workspaceBoards.filter(b => b.visibility === 'PRIVATE');
                      const isWsSelected = selectedWorkspaces.includes(ws.id);
                      const hasPrivateSelected = privateBoards.some(b => selectedBoards.includes(b.id));

                      return (
                        <div key={ws.id} className="space-y-3">
                          {/* Workspace Header */}
                          <div 
                            onClick={() => toggleWorkspace(ws.id)}
                            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-all ${
                              isWsSelected 
                                ? 'bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10 ring-1 ring-[#6C5DD3]/20' 
                                : 'hover:bg-zinc-100 dark:hover:bg-white/5'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isWsSelected 
                                ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-sm' 
                                : 'border-zinc-300 dark:border-white/10'
                            }`}>
                              {isWsSelected && <Check size={12} strokeWidth={4} />}
                            </div>
                            <div className="flex items-center gap-3 flex-1">
                              <Layout size={18} className="text-[#6C5DD3]" />
                              <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isWsSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                  {ws.name}
                                </span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">Espacio de Trabajo</span>
                              </div>
                            </div>
                            {isWsSelected && (
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                                Acceso al espacio
                              </span>
                            )}
                          </div>

                          {/* Public Boards (inherited via workspace) */}
                          {publicBoards.length > 0 && (
                            <div className="ml-8 space-y-1.5 border-l-2 border-zinc-100 dark:border-white/5 pl-4">
                              <div className="flex items-center gap-2 px-2.5 py-1">
                                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                                  Tableros del espacio
                                </span>
                                {isWsSelected && (
                                  <span className="text-[8px] text-emerald-500 font-bold">(acceso automático)</span>
                                )}
                              </div>
                              {publicBoards.map((board) => {
                                const isBoardSelected = selectedBoards.includes(board.id);
                                return (
                                  <div 
                                    key={board.id}
                                    onClick={() => toggleBoard(board.id)}
                                    className={`flex items-center gap-3 p-2.5 rounded cursor-pointer transition-all ${
                                      isBoardSelected 
                                        ? 'bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10' 
                                        : 'hover:bg-zinc-100 dark:hover:bg-white/5'
                                    }`}
                                  >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                      isBoardSelected 
                                        ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-sm' 
                                        : 'border-zinc-300 dark:border-white/10'
                                    }`}>
                                      {isBoardSelected && <Check size={10} strokeWidth={4} />}
                                    </div>
                                    <div className="flex items-center gap-2.5 flex-1">
                                      <ClipboardList size={14} className="text-zinc-400 dark:text-zinc-500" />
                                      <span className={`text-sm font-medium ${isBoardSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                        {board.name}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Private Boards (require explicit invite) */}
                          {privateBoards.length > 0 && (
                            <div className="ml-8 space-y-1.5 border-l-2 border-amber-200 dark:border-amber-500/20 pl-4">
                              <div className="flex items-center gap-2 px-2.5 py-1">
                                <Lock size={10} className="text-amber-500" />
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                                  Tableros Privados
                                </span>
                                <span className="text-[8px] text-amber-500/70 italic">(requiere selección manual)</span>
                              </div>
                              {privateBoards.map((board) => {
                                const isBoardSelected = selectedBoards.includes(board.id);
                                return (
                                  <div 
                                    key={board.id}
                                    onClick={() => toggleBoard(board.id)}
                                    className={`flex items-center gap-3 p-2.5 rounded cursor-pointer transition-all ${
                                      isBoardSelected 
                                        ? 'bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/20' 
                                        : 'hover:bg-amber-50/50 dark:hover:bg-amber-500/5'
                                    }`}
                                    title="Este tablero es privado. Los miembros del espacio no tienen acceso automático. Selecciona este board para invitarlos explícitamente."
                                  >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                      isBoardSelected 
                                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                                        : 'border-zinc-300 dark:border-white/10'
                                    }`}>
                                      {isBoardSelected && <Check size={10} strokeWidth={4} />}
                                    </div>
                                    <div className="flex items-center gap-2.5 flex-1">
                                      <Lock size={14} className="text-amber-400" />
                                      <span className={`text-sm font-medium ${isBoardSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                        {board.name}
                                      </span>
                                      <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                        <Lock size={10} className="text-amber-500" />
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Privado</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {workspaces.length === 0 && !isFetching && (
                      <div className="py-8 text-center text-zinc-500 dark:text-zinc-500 text-sm italic">
                        No se encontraron espacios de trabajo disponibles.
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {(selectedWorkspaces.length > 0 || selectedBoards.length > 0) && (
                    <div className="px-4 py-3 rounded bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[11px] space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
                        <span className="w-2 h-2 rounded bg-[#6C5DD3]" />
                        {selectedWorkspaces.length} espacio(s) de trabajo seleccionado(s)
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
                        <span className="w-2 h-2 rounded bg-amber-500" />
                        {selectedBoards.length} tablero(s) privado(s) seleccionado(s)
                      </div>
                      <p className="text-zinc-400 dark:text-zinc-500 italic mt-1">
                        Los tableros del espacio se heredan automáticamente. Los tableros privados deben seleccionarse individualmente.
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="text-rose-500 dark:text-rose-400 text-[13px] font-bold text-center bg-rose-50 dark:bg-rose-500/10 p-3 rounded border border-rose-100 dark:border-rose-500/20">
                    {error}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end items-center gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 text-zinc-500 dark:text-zinc-400 font-bold text-sm hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || invites.every(i => !i.email.trim()) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0)}
                    className={`
                      px-8 py-3 rounded font-bold text-white transition-all shadow-lg
                      ${isLoading || invites.every(i => !i.email.trim()) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0)
                        ? 'bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed' 
                        : 'bg-[#6C5DD3] hover:bg-[#5b4eb3] shadow-[#6C5DD3]/25 active:scale-[0.98]'
                      }
                    `}
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Invitaciones'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteMembersModal;
