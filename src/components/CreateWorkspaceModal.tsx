import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api-client';
import Alert from './ui/Alert';
import { LuminsBoardIcon } from './icons/LuminsIcons';

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
            className="fixed inset-0 bg-[#13151A]/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="w-full max-w-md bg-white dark:bg-[#1C1F26] rounded-xl shadow-modal border border-slate-200/90 dark:border-white/10 p-5 sm:p-6 relative overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <LuminsBoardIcon size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
                    Nuevo Espacio
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                    Colabora con tu equipo en un lugar centralizado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100 transition-all cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Workspace Name (small) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nombre del Espacio <span className="text-[#FF665E]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marketing HQ o Lumins Global"
                  className="w-full h-9 bg-slate-50/90 dark:bg-[#13151A] border border-slate-200 dark:border-white/10 rounded-lg px-3 text-xs sm:text-[13px] text-slate-900 dark:text-zinc-100 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/15 focus:border-[#12A9A8] transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  required
                />
              </div>

              {/* Description Field */}
              <div>
                {!isDescriptionExpanded ? (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(true)}
                    className="text-[#0E8786] hover:text-[#12A9A8] text-xs font-semibold hover:underline transition-all cursor-pointer"
                  >
                    + Añadir descripción (opcional)
                  </button>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                      Descripción del Espacio
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Define el propósito de este equipo..."
                      className="w-full bg-slate-50/90 dark:bg-[#13151A] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs sm:text-[13px] text-slate-900 dark:text-zinc-100 font-normal outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/15 focus:border-[#12A9A8] transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none"
                    />
                  </div>
                )}
              </div>

              {error && (
                <Alert tone="coral">
                  {error}
                </Alert>
              )}

              {/* Footer Actions (small) */}
              <div className="pt-2 flex justify-end items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-3.5 rounded-lg text-slate-600 dark:text-zinc-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className={`
                    h-9 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5
                    ${isLoading || !name.trim()
                      ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-600 border border-slate-200/80 dark:border-white/5 cursor-not-allowed'
                      : 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-xs active:scale-[0.98] cursor-pointer'
                    }
                  `}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={14} /> : 'Crear espacio'}
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
