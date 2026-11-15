import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import apiClient from '../lib/api-client';
import { useNavigate } from 'react-router-dom';
import { useNotificationHelpers } from './NotificationProvider';
import { LuminsWarningIcon, LuminsTrashIcon } from './icons/LuminsIcons';

interface WorkspaceStats {
  boards: number;
  lists: number;
  cards: number;
  comments: number;
  attachments: number;
}

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

const DeleteWorkspaceModal: React.FC<DeleteWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotificationHelpers();

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchStats();
    } else {
      setConfirmText('');
    }
  }, [isOpen, workspaceId]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiClient.get<{ data: WorkspaceStats }>(`/api/workspaces/${workspaceId}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching workspace stats:', error);
      showError('Error', 'No se pudieron cargar las estadísticas del espacio');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toLowerCase() !== workspaceName.trim().toLowerCase()) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/workspaces/${workspaceId}`);
      showSuccess('Éxito', 'El espacio de trabajo ha sido eliminado permanentemente');
      
      // Clear from localStorage if it's the current one
      if (localStorage.getItem('lastActiveWorkspaceId') === workspaceId) {
        localStorage.removeItem('lastActiveWorkspaceId');
      }

      // Dispatch event to refresh workspace lists across the app
      window.dispatchEvent(new CustomEvent('workspace-changed'));
      
      onClose();
      // Redirigir al dashboard general o a otro espacio
      navigate('/app');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      showError('Error', 'Hubo un problema al intentar eliminar el espacio');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[440px] bg-white dark:bg-[#1C1F26] rounded-xl shadow-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFCC40]/15 flex items-center justify-center shrink-0">
              <LuminsWarningIcon size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                ¿Eliminar espacio de trabajo?
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Esta acción es irreversible. Se eliminará permanentemente el espacio y todo su contenido.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats Section */}
          <div>
            {isLoadingStats ? (
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-white/[0.03] px-4 py-3 rounded-lg border border-slate-200/70 dark:border-white/10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-8 mb-1" />
                    <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-14" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-white/[0.03] px-4 py-3 rounded-lg border border-slate-200/70 dark:border-white/10">
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-900 dark:text-zinc-100 tabular-nums">{stats.boards}</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Tableros</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-900 dark:text-zinc-100 tabular-nums">{stats.cards}</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Tarjetas</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-900 dark:text-zinc-100 tabular-nums">{stats.comments + stats.attachments}</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Recursos</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-white/[0.03] px-4 py-4 rounded-lg border border-slate-200/70 dark:border-white/10 text-center">
                <p className="text-xs text-slate-400">No se pudieron obtener estadísticas detalladas</p>
              </div>
            )}
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-zinc-300 block mb-1.5">
              Para confirmar, escribe el nombre del espacio:{' '}
              <span className="font-bold text-slate-900 dark:text-zinc-100">{workspaceName}</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              placeholder="Escribe el nombre aquí..."
              className="w-full h-9 px-3 bg-white dark:bg-[#14171C] border border-slate-200 dark:border-white/10 focus:border-[#FF665E] focus:ring-2 focus:ring-[#FF665E]/15 rounded-lg text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-2 pt-2">
            <button
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText.trim().toLowerCase() !== workspaceName.trim().toLowerCase() || isDeleting}
              className="h-9 px-3.5 rounded-lg bg-[#FF665E] hover:bg-[#E54D45] text-white text-xs font-semibold shadow-xs disabled:opacity-45 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Borrando...</span>
                </>
              ) : (
                <>
                  <LuminsTrashIcon size={14} className="text-white" />
                  <span>Eliminar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteWorkspaceModal;
