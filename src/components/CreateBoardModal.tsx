import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Users, ChevronDown } from 'lucide-react';
import apiClient from '../lib/api-client';

interface Workspace {
  id: string;
  name: string;
}

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: () => void;
  workspaces?: Workspace[];
}

interface CreateBoardPayload {
  name: string;
  workspaceId: string;
  visibility: 'private' | 'team';
  description?: string;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ 
  isOpen, 
  onClose, 
  onBoardCreated,
  workspaces = []
}) => {
  const [name, setName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  // Update workspaceId when workspaces change or modal opens
  React.useEffect(() => {
    if (isOpen && workspaces.length > 0 && !workspaceId) {
      setWorkspaceId(workspaces[0].id);
    }
  }, [isOpen, workspaces, workspaceId]);
  const [visibility, setVisibility] = useState<'private' | 'team'>('private');
  const [description, setDescription] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const payload: CreateBoardPayload = {
        name,
        workspaceId,
        visibility,
        description: description.trim() || undefined
      };

      // Simulating API call as per plan
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await apiClient.post('/api/boards', payload);
      
      onBoardCreated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el tablero');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setWorkspaceId(workspaces[0]?.id || '');
    setVisibility('private');
    setDescription('');
    setIsDescriptionExpanded(false);
    setError('');
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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white rounded-[24px] shadow-[0_20px_40px_-15px_rgba(122,90,248,0.2)] p-10 relative overflow-hidden z-10"
          >
            {/* Decorative Orb */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#F4F5F7] blur-[60px] opacity-50 pointer-events-none -mr-20 -mt-20" />

            {/* Header */}
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Crear nuevo tablero</h2>
              <button 
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:bg-[#F4F5F7] hover:text-[#7A5AF8] transition-all"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Workspace Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em] ml-1">
                  Espacio de Trabajo
                </label>
                <div className="relative">
                  <select 
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="w-full h-14 bg-[#F4F5F7] rounded-[12px] px-5 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 appearance-none transition-all"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#7A5AF8] pointer-events-none" size={20} strokeWidth={3} />
                </div>
              </div>

              {/* Board Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em] ml-1">
                  Nombre del Tablero *
                </label>
                <input 
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Lanzamiento Q4"
                  className="w-full h-14 bg-[#F4F5F7] rounded-[12px] px-5 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all placeholder:text-[#9CA3AF]"
                  required
                />
              </div>

              {/* Visibility Cards */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em] ml-1">
                  Privacidad
                </label>
                <div className="flex gap-4">
                  <div 
                    onClick={() => setVisibility('private')}
                    className={`flex-1 p-5 rounded-[16px] border-2 cursor-pointer transition-all ${
                      visibility === 'private' 
                        ? 'border-[#7A5AF8] bg-[#F4F5F7] shadow-sm' 
                        : 'border-zinc-100 bg-white hover:border-zinc-200'
                    }`}
                  >
                    <Lock size={20} className={visibility === 'private' ? 'text-[#7A5AF8]' : 'text-zinc-400'} strokeWidth={3} />
                    <div className="mt-3">
                      <div className="font-extrabold text-zinc-900 text-sm">Privado</div>
                      <div className="text-[10px] text-[#806F9B] font-bold mt-1 leading-tight">Solo tú y invitados</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setVisibility('team')}
                    className={`flex-1 p-5 rounded-[16px] border-2 cursor-pointer transition-all ${
                      visibility === 'team' 
                        ? 'border-[#7A5AF8] bg-[#F4F5F7] shadow-sm' 
                        : 'border-zinc-100 bg-white hover:border-zinc-200'
                    }`}
                  >
                    <Users size={20} className={visibility === 'team' ? 'text-[#7A5AF8]' : 'text-zinc-400'} strokeWidth={3} />
                    <div className="mt-3">
                      <div className="font-extrabold text-zinc-900 text-sm">Equipo</div>
                      <div className="text-[10px] text-[#806F9B] font-bold mt-1 leading-tight">Todo el equipo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Toggle/Field */}
              <div className="space-y-3">
                {!isDescriptionExpanded ? (
                  <button 
                    type="button"
                    onClick={() => setIsDescriptionExpanded(true)}
                    className="text-[#7A5AF8] text-sm font-bold hover:underline ml-1 transition-all"
                  >
                    + Añadir descripción (opcional)
                  </button>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em] ml-1">
                      Descripción (Opcional)
                    </label>
                    <textarea 
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="¿De qué trata este proyecto?"
                      className="w-full bg-[#F4F5F7] rounded-[12px] p-5 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all placeholder:text-[#9CA3AF] resize-none"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest text-center py-3 rounded-[12px]">
                  {error}
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-10 flex justify-end items-center gap-6">
                <button 
                  type="button"
                  onClick={handleClose}
                  className="text-[#806F9B] font-bold text-sm hover:text-zinc-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className={`
                    h-14 px-10 rounded-[12px] font-black text-white transition-all relative overflow-hidden
                    ${isLoading || !name.trim() 
                      ? 'bg-zinc-200 cursor-not-allowed opacity-50 grayscale' 
                      : 'bg-gradient-to-r from-[#7A5AF8] to-[#E91E63] hover:shadow-[0_8px_16px_-6px_rgba(122,90,248,0.4)] active:scale-[0.98]'
                    }
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>CREANDO...</span>
                    </div>
                  ) : (
                    'CREAR TABLERO'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateBoardModal;
