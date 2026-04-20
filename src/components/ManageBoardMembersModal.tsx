import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Shield, Check } from 'lucide-react';
import apiClient from '../lib/api-client';

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

const ManageBoardMembersModal: React.FC<ManageBoardMembersModalProps> = ({
  isOpen,
  onClose,
  boardId,
  workspaceId,
  currentMembers,
  onUpdate
}) => {
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaceMembers();
    }
  }, [isOpen, workspaceId]);

  const fetchWorkspaceMembers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ data: { workspace: { members: WorkspaceMember[] } } }>(`/api/workspaces/${workspaceId}`);
      setWorkspaceMembers(response.data.workspace.members || []);
    } catch (err) {
      console.error('Failed to fetch workspace members', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      setIsAdding(userId);
      await apiClient.post(`/api/boards/${boardId}/members`, {
        userId,
        role: 'editor' // Default role for board members
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to add member', err);
    } finally {
      setIsAdding(null);
    }
  };

  const currentMemberIds = new Set(currentMembers.map(m => m.userId));
  
  const filteredMembers = workspaceMembers.filter(m => 
    (m.user.name.toLowerCase().includes(search.toLowerCase()) || 
     m.user.email.toLowerCase().includes(search.toLowerCase())) &&
    !currentMemberIds.has(m.userId)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative overflow-hidden z-10 border border-[#E8E9EC]"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-[#7A5AF8] flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 leading-tight">Miembros del Tablero</h2>
                  <p className="text-xs text-zinc-500 font-medium">Añade colaboradores de tu espacio</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-100/50 border border-zinc-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-violet-50 focus:border-[#7A5AF8] outline-none transition-all placeholder:text-zinc-400 font-medium"
                />
              </div>

              <div className="space-y-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-zinc-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-zinc-100 rounded w-1/2" />
                        <div className="h-3 bg-zinc-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div 
                      key={member.userId} 
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7A5AF8] to-[#6949d6] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-900">{member.user.name}</div>
                          <div className="text-[11px] text-zinc-500 font-medium">{member.user.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(member.userId)}
                        disabled={isAdding === member.userId}
                        className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isAdding === member.userId
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:border-[#7A5AF8] hover:text-[#7A5AF8] hover:shadow-sm'
                        }`}
                      >
                        {isAdding === member.userId ? 'Añadiendo...' : (
                          <>
                            <UserPlus size={14} />
                            Añadir
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-zinc-300" />
                    </div>
                    <p className="text-sm font-bold text-zinc-500">No se encontraron miembros</p>
                    <p className="text-xs text-zinc-400 mt-1">Todos los miembros del espacio ya están aquí o no coinciden.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
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
