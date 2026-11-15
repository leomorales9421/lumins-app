import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trash2, Calendar } from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import Alert from './ui/Alert';
import Badge from './ui/Badge';
import {
  LuminsSettingsIcon,
  LuminsBoardIcon,
  LuminsMembersIcon
} from './icons/LuminsIcons';

export interface WorkspaceEditableData {
  id: string;
  name: string;
  description?: string | null;
  ownerId?: string;
  createdAt?: string;
  _count?: {
    boards: number;
    members: number;
  };
}

interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceEditableData | null;
  onWorkspaceUpdated?: (workspace: WorkspaceEditableData) => void;
  onRequestDelete?: (workspaceId: string, workspaceName: string) => void;
}

const EditWorkspaceModal: React.FC<EditWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onWorkspaceUpdated,
  onRequestDelete,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspace && isOpen) {
      setName(workspace.name || '');
      setDescription(workspace.description || '');
      setError('');
    }
  }, [workspace, isOpen]);

  if (!workspace) return null;

  const isOwner = workspace.ownerId === user?.id || (user as any)?.globalRole === 'SYSTEM_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del espacio es obligatorio');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.patch<{
        success: boolean;
        data: { workspace: WorkspaceEditableData };
        message: string;
      }>(`/api/workspaces/${workspace.id}`, {
        name: name.trim(),
        description: description.trim(),
      });

      const updated = res.data?.workspace || {
        ...workspace,
        name: name.trim(),
        description: description.trim(),
      };

      toast.success('Espacio de trabajo actualizado correctamente');
      window.dispatchEvent(new CustomEvent('workspace-changed'));

      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(updated);
      }
      onClose();
    } catch (err: any) {
      console.error('Error updating workspace:', err);
      const msg = err.response?.data?.message || 'Error al actualizar el espacio de trabajo';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = workspace.createdAt
    ? new Date(workspace.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#13151A]/50 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="w-full max-w-lg bg-white dark:bg-[#1C1F26] rounded-t-2xl sm:rounded-xl shadow-modal border border-slate-200/90 dark:border-white/10 p-5 sm:p-6 relative overflow-hidden z-10 max-h-[90dvh] overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {/* Mobile Pull Handle */}
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto mb-3 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shrink-0">
                  <LuminsSettingsIcon size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
                    Propiedades del Espacio
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                    Configura el nombre y detalles de este espacio de trabajo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100 transition-all shrink-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <Alert tone="coral" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name Field (small) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nombre del Espacio <span className="text-[#FF665E]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marketing & Producto"
                  className="w-full h-9 px-3 bg-slate-50/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs sm:text-[13px] font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#12A9A8] focus:ring-2 focus:ring-[#12A9A8]/15 transition-all"
                  autoFocus
                />
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Descripción <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe los objetivos o proyectos que se gestionan aquí..."
                  className="w-full px-3 py-2 bg-slate-50/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs sm:text-[13px] font-normal text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#12A9A8] focus:ring-2 focus:ring-[#12A9A8]/15 transition-all resize-none"
                />
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5">
                <div className="flex items-center gap-3.5">
                  {workspace._count?.boards !== undefined && (
                    <Badge variant="inline" icon={<LuminsBoardIcon size={13} />}>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{workspace._count.boards}</span> tableros
                    </Badge>
                  )}
                  {workspace._count?.members !== undefined && (
                    <Badge variant="inline" icon={<LuminsMembersIcon size={13} />}>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{workspace._count.members}</span> miembros
                    </Badge>
                  )}
                </div>

                {formattedDate && (
                  <Badge variant="inline" icon={<Calendar size={12} className="text-slate-400" />}>
                    Creado {formattedDate}
                  </Badge>
                )}
              </div>

              {/* Actions Footer (small) */}
              <div className="flex items-center justify-end gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="h-9 px-4 rounded-lg bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading && <Loader2 size={13} className="animate-spin" />}
                  <span>Guardar cambios</span>
                </button>
              </div>
            </form>

            {/* Danger Zone: using global Alert component */}
            {isOwner && onRequestDelete && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <Alert
                  tone="coral"
                  title="Zona de peligro"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRequestDelete(workspace.id, workspace.name);
                      }}
                      className="h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#FF665E]/50 hover:bg-[#FF665E]/[0.06] text-[#C83730] dark:text-[#FF857E] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 size={12} />
                      <span>Eliminar espacio</span>
                    </button>
                  }
                >
                  Eliminar permanentemente este espacio y sus tableros.
                </Alert>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EditWorkspaceModal;
