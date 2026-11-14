import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Loader2, Trash2, Layout, Users, Calendar, AlertTriangle } from 'lucide-react';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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
      
      // Dispatch global event so sidebar and switcher update in real time
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
            className="fixed inset-0 bg-[#13151A]/60 backdrop-blur-md"
          />

          {/* Modal Card (Native Bottom Sheet on mobile / Centered Dialog on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="w-full max-w-lg bg-white dark:bg-[#1C1F26] rounded-t-[28px] sm:rounded-2xl shadow-modal border border-zinc-200 dark:border-white/10 p-5 sm:p-7 relative overflow-hidden z-10 max-h-[90dvh] overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {/* Native Mobile Pull Handle */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-3 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-white/10 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center shadow-xs shrink-0">
                  <Settings size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
                    Propiedades del Espacio
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                    Configura el nombre y detalles de este espacio de trabajo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nombre del Espacio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marketing & Producto"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] transition-all"
                  autoFocus
                />
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Descripción <span className="text-zinc-400 font-normal lowercase">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe los objetivos o proyectos que se gestionan aquí..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] transition-all resize-none"
                />
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-3 sm:gap-4">
                  {workspace._count?.boards !== undefined && (
                    <div className="flex items-center gap-1.5" title="Tableros">
                      <Layout size={13} className="text-[#6C5DD3]" />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {workspace._count.boards}
                      </span>
                      <span className="text-[11px]">tableros</span>
                    </div>
                  )}
                  {workspace._count?.members !== undefined && (
                    <div className="flex items-center gap-1.5" title="Miembros">
                      <Users size={13} className="text-emerald-500" />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {workspace._count.members}
                      </span>
                      <span className="text-[11px]">miembros</span>
                    </div>
                  )}
                </div>

                {formattedDate && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Calendar size={12} />
                    <span>Creado {formattedDate}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-bold transition-all shadow-md shadow-[#6C5DD3]/25 disabled:opacity-50 active:scale-95"
                >
                  {isLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>Guardar cambios</span>
                </button>
              </div>
            </form>

            {/* Danger Zone: only for owners */}
            {isOwner && onRequestDelete && (
              <div className="mt-5 pt-4 border-t border-rose-100 dark:border-rose-500/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-500/[0.04] border border-rose-100 dark:border-rose-500/15">
                  <div>
                    <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Zona de peligro
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Eliminar permanentemente este espacio y sus tableros
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestDelete(workspace.id, workspace.name);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                    <span>Eliminar espacio</span>
                  </button>
                </div>
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
