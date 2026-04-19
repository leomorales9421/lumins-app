import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, User, Users, Plus, Trash2, Layout, ClipboardList, Check } from 'lucide-react';
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
  workspaceName: initialWorkspaceName
}) => {
  const [invites, setInvites] = useState<InviteRow[]>([{ email: '', role: 'MEMBER' }]);
  const [activeTab, setActiveTab] = useState<'workspaces' | 'boards'>('workspaces');
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-[600px] bg-white rounded-2xl shadow-2xl p-6 relative overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Invitar al equipo</h2>
                <p className="text-sm text-zinc-500">
                  Añade colaboradores y define sus niveles de acceso.
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div className="py-10 text-center space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 tracking-tighter">¡Invitaciones Enviadas!</h3>
                <p className="text-zinc-500">Hemos enviado los correos de invitación.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Section 1: Who are you inviting? */}
                <div className="space-y-3 mb-6">
                  <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {invites.map((invite, index) => (
                      <div key={index} className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <input 
                            type="email"
                            value={invite.email}
                            onChange={(e) => updateInviteRow(index, 'email', e.target.value)}
                            placeholder="nombre@empresa.com"
                            className="w-full bg-[#F4F6F9] rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-[#6C5DD3]/20 focus:bg-white transition-all"
                            required
                          />
                        </div>
                        <div className="w-36">
                          <select 
                            value={invite.role}
                            onChange={(e) => updateInviteRow(index, 'role', e.target.value as Role)}
                            className="w-full bg-slate-50 text-zinc-700 rounded-lg p-2 text-sm font-medium border border-zinc-200 outline-none cursor-pointer"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Miembro</option>
                            <option value="GUEST">Invitado</option>
                          </select>
                        </div>
                        {invites.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeInviteRow(index)}
                            className="text-zinc-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={addInviteRow}
                    className="text-[#6C5DD3] text-sm font-bold mt-2 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Añadir otro
                  </button>
                </div>

                {/* Section 2: Destinations */}
                <div className="mt-8">
                  <h3 className="text-xs font-bold text-zinc-700 mb-3 uppercase tracking-wider">Asignar a...</h3>
                  
                  {/* Tabs */}
                  <div className="flex p-1 bg-[#F4F6F9] rounded-lg w-fit mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('workspaces')}
                      className={`px-4 py-1.5 rounded-md text-sm transition-all ${
                        activeTab === 'workspaces' 
                          ? 'bg-white shadow-sm text-zinc-900 font-bold' 
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Espacios de trabajo
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('boards')}
                      className={`px-4 py-1.5 rounded-md text-sm transition-all ${
                        activeTab === 'boards' 
                          ? 'bg-white shadow-sm text-zinc-900 font-bold' 
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Tableros específicos
                    </button>
                  </div>

                  {/* Multi-Select List */}
                  <div className="max-h-40 overflow-y-auto border border-zinc-100 rounded-xl p-2 custom-scrollbar">
                    {activeTab === 'workspaces' ? (
                      <div className="space-y-1">
                        {workspaces.map((ws) => (
                          <div 
                            key={ws.id}
                            onClick={() => toggleWorkspace(ws.id)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              selectedWorkspaces.includes(ws.id) 
                                ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white' 
                                : 'border-zinc-300'
                            }`}>
                              {selectedWorkspaces.includes(ws.id) && <Check size={14} strokeWidth={3} />}
                            </div>
                            <div className="flex items-center gap-2">
                              <Layout size={16} className="text-zinc-400" />
                              <span className="text-sm text-zinc-700 font-medium">{ws.name}</span>
                            </div>
                          </div>
                        ))}
                        {workspaces.length === 0 && !isFetching && (
                          <div className="text-center py-4 text-zinc-400 text-sm">No se encontraron espacios.</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {boards.map((board) => (
                          <div 
                            key={board.id}
                            onClick={() => toggleBoard(board.id)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              selectedBoards.includes(board.id) 
                                ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white' 
                                : 'border-zinc-300'
                            }`}>
                              {selectedBoards.includes(board.id) && <Check size={14} strokeWidth={3} />}
                            </div>
                            <div className="flex items-center gap-2">
                              <ClipboardList size={16} className="text-zinc-400" />
                              <span className="text-sm text-zinc-700 font-medium">{board.name}</span>
                            </div>
                          </div>
                        ))}
                        {boards.length === 0 && !isFetching && (
                          <div className="text-center py-4 text-zinc-400 text-sm">No se encontraron tableros.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 text-rose-500 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="mt-8 flex justify-end items-center gap-3">
                  <button 
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || invites.every(i => !i.email.trim()) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0)}
                    className={`
                      px-6 py-2 rounded-lg font-bold text-white transition-all
                      ${isLoading || invites.every(i => !i.email.trim()) || (selectedWorkspaces.length === 0 && selectedBoards.length === 0)
                        ? 'bg-zinc-200 cursor-not-allowed' 
                        : 'bg-[#6C5DD3] hover:bg-[#5b4eb3] shadow-lg shadow-[#6C5DD3]/20 active:scale-[0.98]'
                      }
                    `}
                  >
                    {isLoading ? 'ENVIANDO...' : 'Enviar Invitaciones'}
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
