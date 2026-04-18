import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2 } from 'lucide-react';
import apiClient from '../lib/api-client';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated: () => void;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ 
  isOpen, 
  onClose, 
  onWorkspaceCreated 
}) => {
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
      await apiClient.post('/api/workspaces', {
        name,
        description: description.trim() || undefined
      });
      
      onWorkspaceCreated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el espacio de trabajo');
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white rounded-[24px] shadow-[0_20px_40px_-15px_rgba(122,90,248,0.2)] p-10 relative overflow-hidden z-10"
          >
            {/* Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F3E8FF] blur-[40px] opacity-60 pointer-events-none -mr-10 -mt-10" />

            {/* Header */}
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F3E8FF] rounded-xl flex items-center justify-center text-[#7A5AF8]">
                  <Building2 size={24} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Nuevo Espacio</h2>
              </div>
              <button 
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:bg-[#F3E8FF] hover:text-[#7A5AF8] transition-all"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Workspace Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em] ml-1">
                  Nombre del Espacio *
                </label>
                <input 
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marketing HQ o Luminous Global"
                  className="w-full h-14 bg-[#F3E8FF] rounded-[12px] px-5 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#7A5AF8]/50 transition-all placeholder:text-[#7A5AF8]/30"
                  required
                />
              </div>

              {/* Description Field */}
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
                      Descripción del Espacio
                    </label>
                    <textarea 
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Define el propósito de este equipo..."
                      className="w-full bg-[#F3E8FF] rounded-[12px] p-5 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#7A5AF8]/50 transition-all placeholder:text-[#7A5AF8]/30 resize-none"
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
                  {isLoading ? 'CREANDO...' : 'CREAR ESPACIO'}
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
