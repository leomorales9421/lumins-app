import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

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

const LuminsModalEmblem: React.FC<{ variant: ConfirmActionVariant }> = ({ variant }) => {
  const primary =
    variant === 'danger' ? '#FF665E' : variant === 'warning' ? '#FFCC40' : '#12A9A8';
  const secondary =
    variant === 'danger' ? '#12A9A8' : variant === 'warning' ? '#FF665E' : '#FFCC40';
  const tertiary =
    variant === 'danger' ? '#FFCC40' : variant === 'warning' ? '#12A9A8' : '#FF665E';

  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Fondo sutil con las 3 barras Lumins */}
      <rect x="9" y="21" width="5.5" height="12" rx="2.75" fill={tertiary} fillOpacity="0.28" />
      <rect x="19.25" y="14" width="5.5" height="19" rx="2.75" fill={secondary} fillOpacity="0.28" />
      <rect x="29.5" y="10" width="5.5" height="23" rx="2.75" fill={primary} fillOpacity="0.28" />

      {/* Anillo principal */}
      <circle
        cx="22"
        cy="22"
        r="16.5"
        stroke={primary}
        strokeWidth="2"
        strokeOpacity="0.85"
      />

      {/* Símbolo central limpio */}
      {variant === 'danger' || variant === 'warning' ? (
        <>
          <path
            d="M22 14.5V23.5"
            stroke={primary}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="22" cy="28.5" r="1.75" fill={primary} />
        </>
      ) : (
        <path
          d="M16.5 22.5L20.2 26.2L27.8 18.2"
          stroke={primary}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Acento de marca tricolor en esquina superior derecha */}
      <circle cx="34.5" cy="9.5" r="3" fill={secondary} />
      <circle cx="34.5" cy="9.5" r="1.2" fill="#FFFFFF" />
    </svg>
  );
};

const VARIANT_CONFIG: Record<
  ConfirmActionVariant,
  {
    glow: string;
    emblemBg: string;
    confirmBtn: string;
  }
> = {
  danger: {
    glow: 'radial-gradient(circle, rgba(255,102,94,0.22) 0%, rgba(18,169,168,0.08) 50%, transparent 72%)',
    emblemBg: 'bg-[#FF665E]/[0.07] dark:bg-[#FF665E]/[0.12] border-[#FF665E]/20',
    confirmBtn: 'bg-[#FF665E] hover:bg-[#EB544C] text-white shadow-sm shadow-[#FF665E]/25',
  },
  warning: {
    glow: 'radial-gradient(circle, rgba(255,204,64,0.24) 0%, rgba(18,169,168,0.08) 50%, transparent 72%)',
    emblemBg: 'bg-[#FFCC40]/[0.10] dark:bg-[#FFCC40]/[0.14] border-[#FFCC40]/30',
    confirmBtn: 'bg-[#FFCC40] hover:bg-[#F0BC2E] text-slate-900 shadow-sm shadow-[#FFCC40]/25',
  },
  primary: {
    glow: 'radial-gradient(circle, rgba(18,169,168,0.22) 0%, rgba(255,204,64,0.08) 50%, transparent 72%)',
    emblemBg: 'bg-[#12A9A8]/[0.08] dark:bg-[#12A9A8]/[0.14] border-[#12A9A8]/25',
    confirmBtn: 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-sm shadow-[#12A9A8]/25',
  },
  info: {
    glow: 'radial-gradient(circle, rgba(18,169,168,0.22) 0%, rgba(255,204,64,0.08) 50%, transparent 72%)',
    emblemBg: 'bg-[#12A9A8]/[0.08] dark:bg-[#12A9A8]/[0.14] border-[#12A9A8]/25',
    confirmBtn: 'bg-[#12A9A8] hover:bg-[#0E8786] text-white shadow-sm shadow-[#12A9A8]/25',
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

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.primary;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 bg-[#0F1117]/55 backdrop-blur-sm"
            onClick={isLoading ? undefined : onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-[380px] rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#191C23]/95 backdrop-blur-xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.32)] px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-7 text-center overflow-hidden"
          >
            {/* Pull handle nativo en mobile */}
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto mb-3 sm:hidden" aria-hidden="true" />
            {/* Línea sutil tricolor en borde superior */}
            <div
              className="absolute top-0 inset-x-0 h-[2px] opacity-80"
              style={{
                background: 'linear-gradient(90deg, #FF665E 0%, #12A9A8 50%, #FFCC40 100%)',
              }}
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Cerrar"
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Emblema centrado Lumins */}
            <div className="relative mx-auto w-fit mb-4 mt-1">
              <div
                className="absolute -inset-5 rounded-full pointer-events-none"
                style={{ background: config.glow }}
              />
              <div
                className={`relative w-14 h-14 rounded-2xl border flex items-center justify-center ${config.emblemBg}`}
              >
                <LuminsModalEmblem variant={variant} />
              </div>
            </div>

            {/* Texto centrado limpio */}
            <h3
              id="confirm-modal-title"
              className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-zinc-100 leading-snug"
            >
              {title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400 max-w-[310px] mx-auto">
              {description}
            </p>

            {/* Botones simétricos */}
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 px-4 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`h-10 px-4 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60 inline-flex items-center justify-center gap-1.5 cursor-pointer ${config.confirmBtn}`}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                <span>{isLoading ? 'Procesando...' : confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ConfirmActionModal;
