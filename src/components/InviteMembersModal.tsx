import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Plus, Trash2, Layout, ClipboardList, Check, Loader2, Lock } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [wsRes, boardsRes] = await Promise.all([
        apiClient.get('/api/workspaces'),
        apiClient.get('/api/boards')
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
      
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar las invitaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInvites([{ email: '', role: 'MEMBER' }]);
    setSelectedWorkspaces(initialWorkspaceId ? [initialWorkspaceId] : []);
    setSelectedBoards([]);
    setError('');
    setSuccess(false);
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

            {success ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Mail size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">¡Invitaciones Enviadas!</h3>
                <p className="text-zinc-500 dark:text-zinc-400">Hemos enviado los correos de invitación correctamente.</p>
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
                  <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] px-1">Asignar a...</h3>
                  
                  {/* Unified Grouped List */}
                  <div className="max-h-[300px] overflow-y-auto border border-zinc-200 dark:border-white/10 rounded p-4 custom-scrollbar bg-zinc-50/30 dark:bg-black/10 space-y-6">
                    {workspaces.map((ws) => {
                      const workspaceBoards = boards.filter(b => b.workspaceId === ws.id);
                      const isWsSelected = selectedWorkspaces.includes(ws.id);

                      return (
                        <div key={ws.id} className="space-y-3">
                          {/* Workspace Header */}
                          <div 
                            onClick={() => toggleWorkspace(ws.id)}
                            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-all ${
                              isWsSelected 
                                ? 'bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10' 
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
                          </div>

                          {/* Nested Boards */}
                          {workspaceBoards.length > 0 && (
                            <div className="ml-8 space-y-1.5 border-l-2 border-zinc-100 dark:border-white/5 pl-4">
                              {workspaceBoards.map((board) => {
                                const isBoardSelected = selectedBoards.includes(board.id);
                                const isPrivate = board.visibility === 'PRIVATE';

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
                                      {isPrivate ? (
                                        <Lock className="text-zinc-400 dark:text-zinc-500" size={14} />
                                      ) : (
                                        <ClipboardList size={14} className="text-zinc-400 dark:text-zinc-500" />
                                      )}
                                      <span className={`text-sm font-medium ${isBoardSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                        {board.name}
                                      </span>
                                      {isPrivate && (
                                        <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                                          <Lock size={10} className="text-zinc-400 dark:text-zinc-500" />
                                          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">Privado</span>
                                        </div>
                                      )}
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
