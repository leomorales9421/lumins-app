import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LuminsErrorIcon, LuminsWarningIcon, LuminsInfoIcon } from './icons/LuminsIcons';

export type ConfirmActionVariant = 'danger' | 'warning' | 'primary' | 'info';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: ConfirmActionVariant;
  onConfirm: () => void;
  onClose: () => void;
}

const VARIANT_CONFIG: Record<
  ConfirmActionVariant,
  {
    accentBar: string;
    iconBg: string;
    confirmBtn: string;
    icon: React.ReactNode;
  }
> = {
  danger: {
    accentBar: 'bg-[#FF665E]',
    iconBg: 'bg-[#FF665E]/10 border-[#FF665E]/20',
    confirmBtn: 'bg-[#FF665E] hover:bg-[#E54D45] text-white shadow-sm shadow-[#FF665E]/25',
    icon: <LuminsErrorIcon size={22} />,
  },
  warning: {
    accentBar: 'bg-[#FFCC40]',
    iconBg: 'bg-[#FFCC40]/15 border-[#FFCC40]/30',
    confirmBtn: 'bg-[#FFCC40] hover:bg-[#E6B32E] text-slate-900 shadow-sm shadow-[#FFCC40]/25',
    icon: <LuminsWarningIcon size={22} />,
  },
  primary: {
    accentBar: 'bg-[#12A9A8]',
    iconBg: 'bg-[#12A9A8]/10 border-[#12A9A8]/20',
    confirmBtn: 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-sm shadow-[#12A9A8]/25',
    icon: <LuminsInfoIcon size={22} />,
  },
  info: {
    accentBar: 'bg-[#12A9A8]',
    iconBg: 'bg-[#12A9A8]/10 border-[#12A9A8]/20',
    confirmBtn: 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-sm shadow-[#12A9A8]/25',
    icon: <LuminsInfoIcon size={22} />,
  },
};

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
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.primary;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-[#13151A]/55 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#1C1F26] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Barra superior de acento Lumins */}
        <div className={`h-1 w-full ${config.accentBar}`} />

        <div className="p-6">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.iconBg}`}
            >
              {config.icon}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <h3
                  id="confirm-modal-title"
                  className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-zinc-100 leading-snug"
                >
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  aria-label="Cerrar"
                  className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-400">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 bg-white dark:bg-[#13151A] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer ${config.confirmBtn}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ConfirmActionModal;
