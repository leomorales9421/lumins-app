import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import apiClient from '../lib/api-client';
import { useNavigate } from 'react-router-dom';
import { useNotificationHelpers } from './NotificationProvider';

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
    if (confirmText !== workspaceName) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/workspaces/${workspaceId}`);
      showSuccess('Éxito', 'El espacio de trabajo ha sido eliminado permanentemente');
      
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-6 border border-rose-100 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center sm:text-left">
          <div className="bg-rose-50 p-3 rounded-full mb-4 inline-block">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">¿Eliminar espacio de trabajo?</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Esta acción es irreversible. Se eliminará permanentemente el espacio y todo su contenido.
          </p>
        </div>

        {/* Stats Section */}
        <div className="mt-4">
          {isLoadingStats ? (
            <div className="grid grid-cols-3 gap-3 bg-[#F4F6F9] p-4 rounded-xl border border-zinc-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-zinc-200 rounded w-10 mb-1" />
                  <div className="h-3 bg-zinc-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-3 bg-[#F4F6F9] p-4 rounded-xl border border-zinc-100">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-zinc-900">{stats.boards}</span>
                <span className="text-xs text-zinc-500">Tableros</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-zinc-900">{stats.cards}</span>
                <span className="text-xs text-zinc-500">Tarjetas</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-zinc-900">{stats.comments + stats.attachments}</span>
                <span className="text-xs text-zinc-500">Recursos</span>
              </div>
            </div>
          ) : (
             <div className="bg-[#F4F6F9] p-4 rounded-xl border border-zinc-100 text-center py-6">
                <p className="text-xs text-zinc-400">No se pudieron obtener estadísticas detalladas</p>
             </div>
          )}
        </div>

        {/* Confirmation Input */}
        <div className="mt-6">
          <label className="text-sm font-medium text-zinc-700 block">
            Para confirmar, escribe el nombre del espacio: <span className="font-bold">{workspaceName}</span>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoFocus
            placeholder="Escribe el nombre aquí..."
            className="w-full bg-white border border-zinc-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-lg p-2.5 text-sm outline-none transition-all mt-2"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-zinc-600 hover:bg-zinc-100 px-4 py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmText !== workspaceName || isDeleting}
            className="bg-rose-500 text-white font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[100px] flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Borrando...
              </>
            ) : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteWorkspaceModal;
