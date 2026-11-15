import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import apiClient from '../lib/api-client';
import { BOARD_BACKGROUND_PRESETS } from '../lib/board-backgrounds';
import { LuminsBoardIcon, LuminsLockIcon, LuminsWorkspaceIcon } from './icons/LuminsIcons';
import { Alert } from './ui/Alert';

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
  background?: string;
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
      const colorfulPresets = BOARD_BACKGROUND_PRESETS.filter(p => p.id !== 'default');
      const randomBackground = colorfulPresets[Math.floor(Math.random() * colorfulPresets.length)].value;

      const payload: CreateBoardPayload = {
        name,
        workspaceId,
        visibility,
        description: description.trim() || undefined,
        background: randomBackground,
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
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="w-full max-w-md bg-white dark:bg-[#1C1F26] rounded-xl shadow-modal relative overflow-hidden z-10 border border-slate-200/90 dark:border-white/10"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#12A9A8]/10 rounded-lg flex items-center justify-center shrink-0">
                  <LuminsBoardIcon size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-snug">Nuevo proyecto</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Organiza tus tareas en un nuevo tablero</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-zinc-100 rounded-lg transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Workspace Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.14em] block">
                  Espacio de Trabajo
                </label>
                <div className="relative">
                  <select 
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="w-full h-9 bg-slate-50 dark:bg-[#13151A] border border-slate-200 dark:border-white/10 rounded-lg px-3 pr-9 text-xs font-semibold text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#12A9A8]/15 focus:border-[#12A9A8] appearance-none transition-all cursor-pointer"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" size={15} />
                </div>
              </div>

              {/* Board Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.14em] block">
                  Nombre del Tablero *
                </label>
                <input 
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Plan de Marketing 2026"
                  className="w-full h-9 bg-slate-50 dark:bg-[#13151A] border border-slate-200 dark:border-white/10 rounded-lg px-3 text-xs font-medium text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-[#12A9A8]/15 focus:border-[#12A9A8] transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  required
                />
              </div>

              {/* Visibility Options */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.14em] block">
                  Visibilidad
                </label>
                <div className="flex gap-3">
                  <div 
                    onClick={() => setVisibility('PRIVATE')}
                    className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      visibility === 'PRIVATE' 
                        ? 'border-[#12A9A8] bg-[#12A9A8]/[0.06] dark:bg-[#12A9A8]/10 shadow-xs' 
                        : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-black/10 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <LuminsLockIcon size={18} active={visibility === 'PRIVATE'} className={visibility === 'PRIVATE' ? 'text-[#0E8786] dark:text-[#12A9A8]' : 'text-slate-400 dark:text-zinc-500'} />
                    <div className="mt-2">
                      <div className={`font-bold text-xs ${visibility === 'PRIVATE' ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-600 dark:text-zinc-400'}`}>Privado</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium leading-tight mt-0.5">Solo miembros del tablero</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setVisibility('WORKSPACE')}
                    className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      visibility === 'WORKSPACE' 
                        ? 'border-[#12A9A8] bg-[#12A9A8]/[0.06] dark:bg-[#12A9A8]/10 shadow-xs' 
                        : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-black/10 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <LuminsWorkspaceIcon size={18} active={visibility === 'WORKSPACE'} className={visibility === 'WORKSPACE' ? 'text-[#0E8786] dark:text-[#12A9A8]' : 'text-slate-400 dark:text-zinc-500'} />
                    <div className="mt-2">
                      <div className={`font-bold text-xs ${visibility === 'WORKSPACE' ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-600 dark:text-zinc-400'}`}>Espacio</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium leading-tight mt-0.5">Todo el espacio de trabajo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                {!isDescriptionExpanded ? (
                  <button 
                    type="button"
                    onClick={() => setIsDescriptionExpanded(true)}
                    className="text-[#0E8786] dark:text-[#12A9A8] text-xs font-semibold hover:underline"
                  >
                    + Añadir descripción (opcional)
                  </button>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.14em] block">
                      Descripción
                    </label>
                    <textarea 
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve descripción del proyecto..."
                      className="w-full bg-slate-50 dark:bg-[#13151A] border border-slate-200 dark:border-white/10 rounded-lg p-3 text-xs font-medium text-slate-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-[#12A9A8]/15 focus:border-[#12A9A8] transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none"
                    />
                  </div>
                )}
              </div>

              {error && (
                <Alert tone="coral">{error}</Alert>
              )}

              {/* Footer Actions */}
              <div className="pt-2 flex justify-end items-center gap-2">
                <button 
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-3.5 rounded-lg text-slate-600 dark:text-zinc-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className={`
                    h-9 px-4 rounded-lg text-xs font-semibold text-white transition-all inline-flex items-center justify-center gap-1.5
                    ${isLoading || !name.trim() 
                      ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-zinc-600 cursor-not-allowed' 
                      : 'bg-[#12A9A8] hover:bg-[#0E8786] shadow-xs active:scale-[0.98]'
                    }
                  `}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={15} /> : 'Crear tablero'}
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
