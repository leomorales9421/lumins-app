import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api-client';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated: (workspace: any) => void;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ 
  isOpen, 
  onClose, 
  onWorkspaceCreated 
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      const response = await apiClient.post<any>('/api/workspaces', {
        name,
        description: description.trim() || undefined
      });
      
      const newWorkspace = response.data.workspace;
      
      if (!newWorkspace) {
        throw new Error('No se recibió el nuevo espacio desde el servidor');
      }

      onWorkspaceCreated(newWorkspace);
      handleClose();
      
      // Redirect to the new workspace dashboard
      navigate(`/w/${newWorkspace.id}/dashboard`);
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      const message = err.response?.data?.message || err.message || 'Error al crear el espacio de trabajo';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
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
            className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white dark:bg-[#1C1F26] rounded shadow-modal border border-zinc-200 dark:border-white/10 p-10 relative overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded flex items-center justify-center shadow-sm">
                  <Building2 size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Nuevo Espacio</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-1.5">Colabora con tu equipo en un lugar centralizado</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="w-12 h-12 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Workspace Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] ml-1">
                  Nombre del Espacio *
                </label>
                <input 
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marketing HQ o Lumins Global"
                  className="w-full h-12 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded px-6 text-zinc-900 dark:text-zinc-100 font-bold outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  required
                />
              </div>

              {/* Description Field */}
              <div className="space-y-3">
                {!isDescriptionExpanded ? (
                  <button 
                    type="button"
                    onClick={() => setIsDescriptionExpanded(true)}
                    className="text-[#6C5DD3] dark:text-[#8E82E3] text-sm font-bold hover:underline ml-1 transition-all"
                  >
                    + Añadir descripción (opcional)
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] ml-1">
                      Descripción del Espacio
                    </label>
                    <textarea 
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Define el propósito de este equipo..."
                      className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded p-6 text-zinc-900 dark:text-zinc-100 font-bold outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
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
              <div className="mt-12 flex justify-end items-center gap-6">
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
                    h-12 px-10 rounded font-bold text-white transition-all shadow-lg
                    ${isLoading || !name.trim() 
                      ? 'bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed' 
                      : 'bg-[#6C5DD3] hover:bg-[#5b4eb3] shadow-[#6C5DD3]/25 active:scale-[0.98]'
                    }
                  `}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'CREAR ESPACIO'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateWorkspaceModal;
