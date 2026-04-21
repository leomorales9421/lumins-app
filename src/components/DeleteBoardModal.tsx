import React from 'react';

interface DeleteBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  boardName: string;
  counts: {
    lists: number;
    cards: number;
    labels: number;
    members: number;
  } | null;
  isLoading: boolean;
}

const DeleteBoardModal: React.FC<DeleteBoardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  boardName,
  counts,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded bg-gradient-to-b from-[#1c2327] to-[#111618] text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="px-6 pt-6 pb-4">
            {/* Warning icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-red-500/10">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            {/* Title */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold leading-6 text-white">
                ¿Eliminar tablero permanentemente?
              </h3>
              <p className="mt-2 text-sm text-[#9db0b9]">
                Esta acción no se puede deshacer. Se eliminará el tablero{' '}
                <span className="font-semibold text-white">
                  "{boardName}"
                </span>{' '}
                y todos sus datos asociados.
              </p>
            </div>

            {/* Detailed counts */}
            {counts && (
              <div className="mt-6 rounded bg-white/5 p-4">
                <h4 className="text-sm font-medium text-white mb-3">
                  Se eliminarán los siguientes elementos:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-500">{counts.lists}</span>
                    </div>
                    <span className="text-sm text-[#9db0b9]">
                      Lista{counts.lists !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded bg-green-500/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-green-500">{counts.cards}</span>
                    </div>
                    <span className="text-sm text-[#9db0b9]">
                      Tarjeta{counts.cards !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded bg-indigo-500/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-500">{counts.labels}</span>
                    </div>
                    <span className="text-sm text-[#9db0b9]">
                      Etiqueta{counts.labels !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded bg-yellow-500/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-yellow-500">{counts.members}</span>
                    </div>
                    <span className="text-sm text-[#9db0b9]">
                      Miembro{counts.members !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#6d7f88]">
                  Además de todos los comentarios, archivos adjuntos, checklists y registros de actividad.
                </p>
              </div>
            )}

            {/* Warning message */}
            <div className="mt-6 rounded border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-400">Advertencia crítica</h4>
                  <p className="mt-1 text-sm text-red-400/80">
                    Esta acción eliminará permanentemente todos los datos del tablero. No podrás recuperar esta información.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/5 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className="inline-flex w-full justify-center rounded bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </span>
              ) : (
                'Eliminar permanentemente'
              )}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded border border-white/10 bg-[#1c2327] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:w-auto"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBoardModal;
