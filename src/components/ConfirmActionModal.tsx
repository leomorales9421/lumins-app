import React from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  variant = 'danger',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const iconStyles = {
    danger: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
    warning: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    primary: 'bg-[#6C5DD3]/15 text-[#6C5DD3]',
  }[variant];

  const confirmBtnStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    primary: 'bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white',
  }[variant];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1F26] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconStyles}`}>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>

          <h3 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>

        <div className="px-6 py-4 bg-zinc-50 dark:bg-white/5 border-t border-zinc-200 dark:border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-sm font-bold text-white transition-colors disabled:opacity-60 cursor-pointer ${confirmBtnStyles}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;