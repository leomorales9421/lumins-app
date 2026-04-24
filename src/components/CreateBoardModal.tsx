import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Users, ChevronDown, Layout, Loader2, Building2 } from 'lucide-react';
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
  defaultWorkspaceId?: string;
}

interface CreateBoardPayload {
  name: string;
  workspaceId: string;
  visibility: 'PRIVATE' | 'WORKSPACE';
  description?: string;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ 
  isOpen, 
  onClose, 
  onBoardCreated,
  workspaces = [],
  defaultWorkspaceId
}) => {
  const [name, setName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  React.useEffect(() => {
    if (isOpen && workspaces.length > 0) {
      if (defaultWorkspaceId) {
        setWorkspaceId(defaultWorkspaceId);
      } else if (!workspaceId) {
        setWorkspaceId(workspaces[0].id);
      }
    }
  }, [isOpen, workspaces, workspaceId, defaultWorkspaceId]);

  const [visibility, setVisibility] = useState<'PRIVATE' | 'WORKSPACE'>('WORKSPACE');
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
    setVisibility('WORKSPACE');
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
            className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white dark:bg-[#1C1F26] rounded shadow-modal p-8 relative overflow-hidden z-10 border border-zinc-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded flex items-center justify-center shadow-sm">
                  <Layout size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Nuevo proyecto</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">Organiza tus tareas en un nuevo tablero</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workspace Selection */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  Espacio de Trabajo
                </label>
                <div className="relative">
                  <select 
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="w-full h-12 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded px-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] appearance-none transition-all cursor-pointer"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Board Name */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  Nombre del Tablero *
                </label>
                <input 
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Plan de Marketing 2026"
                  className="w-full h-12 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded px-4 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  required
                />
              </div>

              {/* Visibility Options */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  Visibilidad
                </label>
                <div className="flex gap-4">
                  <div 
                    onClick={() => setVisibility('PRIVATE')}
                    className={`flex-1 p-5 rounded border cursor-pointer transition-all ${
                      visibility === 'PRIVATE' 
                        ? 'border-[#6C5DD3] bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10 shadow-sm' 
                        : 'border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/10 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <Lock size={20} className={visibility === 'PRIVATE' ? 'text-[#6C5DD3]' : 'text-zinc-400 dark:text-zinc-500'} />
                    <div className="mt-3">
                      <div className={`font-bold text-[14px] ${visibility === 'PRIVATE' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>Privado</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium leading-tight mt-0.5">Solo miembros del tablero</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setVisibility('WORKSPACE')}
                    className={`flex-1 p-5 rounded border cursor-pointer transition-all ${
                      visibility === 'WORKSPACE' 
                        ? 'border-[#6C5DD3] bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/10 shadow-sm' 
                        : 'border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/10 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <Building2 size={20} className={visibility === 'WORKSPACE' ? 'text-[#6C5DD3]' : 'text-zinc-400 dark:text-zinc-500'} />
                    <div className="mt-3">
                      <div className={`font-bold text-[14px] ${visibility === 'WORKSPACE' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>Espacio</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-500 font-medium leading-tight mt-0.5">Todo el espacio de trabajo</div>
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
                    className="text-[#6C5DD3] dark:text-[#8E82E3] text-[13px] font-bold hover:underline ml-1"
                  >
                    + Añadir descripción (opcional)
                  </button>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">
                      Descripción
                    </label>
                    <textarea 
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve descripción del proyecto..."
                      className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded p-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold p-4 rounded border border-rose-100 dark:border-rose-500/20">
                  {error}
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-10 flex justify-end items-center gap-6">
                <button 
                  type="button"
                  onClick={handleClose}
                  className="text-zinc-500 dark:text-zinc-400 font-bold text-sm hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className={`
                    h-12 px-8 rounded font-bold text-white transition-all shadow-lg
                    ${isLoading || !name.trim() 
                      ? 'bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed' 
                      : 'bg-[#6C5DD3] hover:bg-[#5b4eb3] shadow-[#6C5DD3]/25 active:scale-[0.98]'
                    }
                  `}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Crear tablero'}
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
