import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Users, ChevronDown, Layout } from 'lucide-react';
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-modal p-8 relative overflow-hidden z-10 border border-[#E8E9EC]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[#F4F5F7] rounded-xl flex items-center justify-center text-[#7A5AF8]">
                    <Layout size={20} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-xl font-bold text-[#1A1A2E] tracking-tight">Nuevo proyecto</h2>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 text-[#9CA3AF] hover:bg-[#F4F5F7] hover:text-[#1A1A2E] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workspace Selection */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1A1A2E] ml-1">
                  Espacio de Trabajo
                </label>
                <div className="relative">
                  <select 
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="w-full h-11 bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg px-4 text-sm font-medium text-[#1A1A2E] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 appearance-none transition-all"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" size={16} />
                </div>
              </div>

              {/* Board Name */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1A1A2E] ml-1">
                  Nombre del Tablero *
                </label>
                <input 
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Plan de Marketing 2026"
                  className="w-full h-11 bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg px-4 text-sm font-medium text-[#1A1A2E] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all placeholder:text-[#9CA3AF]"
                  required
                />
              </div>

              {/* Visibility Options */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1A1A2E] ml-1">
                  Visibilidad
                </label>
                <div className="flex gap-3">
                  <div 
                    onClick={() => setVisibility('private')}
                    className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${
                      visibility === 'private' 
                        ? 'border-[#7A5AF8] bg-[#F4F5F7] shadow-sm' 
                        : 'border-[#E8E9EC] bg-white hover:border-[#D1D5DB]'
                    }`}
                  >
                    <Lock size={18} className={visibility === 'private' ? 'text-[#7A5AF8]' : 'text-[#9CA3AF]'} />
                    <div className="mt-2">
                      <div className="font-bold text-[#1A1A2E] text-[13px]">Privado</div>
                      <div className="text-[11px] text-[#6B7280] font-medium leading-tight">Solo tú y invitados</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setVisibility('team')}
                    className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${
                      visibility === 'team' 
                        ? 'border-[#7A5AF8] bg-[#F4F5F7] shadow-sm' 
                        : 'border-[#E8E9EC] bg-white hover:border-[#D1D5DB]'
                    }`}
                  >
                    <Users size={18} className={visibility === 'team' ? 'text-[#7A5AF8]' : 'text-[#9CA3AF]'} />
                    <div className="mt-2">
                      <div className="font-bold text-[#1A1A2E] text-[13px]">Equipo</div>
                      <div className="text-[11px] text-[#6B7280] font-medium leading-tight">Todo el equipo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                {!isDescriptionExpanded ? (
                  <button 
                    type="button"
                    onClick={() => setIsDescriptionExpanded(true)}
                    className="text-[#7A5AF8] text-[13px] font-bold hover:underline ml-1"
                  >
                    + Añadir descripción (opcional)
                  </button>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[12px] font-bold text-[#1A1A2E] ml-1">
                      Descripción
                    </label>
                    <textarea 
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve descripción del proyecto..."
                      className="w-full bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg p-4 text-sm font-medium text-[#1A1A2E] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all placeholder:text-[#9CA3AF] resize-none"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-8 flex justify-end items-center gap-4">
                <button 
                  type="button"
                  onClick={handleClose}
                  className="text-[#6B7280] font-bold text-sm hover:text-[#1A1A2E] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className={`
                    h-10 px-6 rounded-lg font-bold text-white transition-all shadow-sm
                    ${isLoading || !name.trim() 
                      ? 'bg-[#E8E9EC] cursor-not-allowed text-[#9CA3AF]' 
                      : 'bg-[#7A5AF8] hover:bg-[#694de3] active:scale-[0.98]'
                    }
                  `}
                >
                  {isLoading ? 'Creando...' : 'Crear tablero'}
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
