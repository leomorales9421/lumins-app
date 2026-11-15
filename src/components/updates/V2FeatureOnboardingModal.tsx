import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { useProductUpdates } from '../../contexts/ProductUpdatesContext';
import {
  LuminsBoardIcon,
  LuminsCalendarIcon,
  LuminsLockIcon,
  LuminsSettingsIcon,
  LuminsSparkleUpdateIcon,
} from '../icons/LuminsIcons';

interface OnboardingStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  tip: string;
  ctaLabel: string;
  ctaPath: string;
  icon: React.ReactNode;
}

const V2_STEPS: OnboardingStep[] = [
  {
    id: 'meet-calendar',
    badge: 'Paso 1 · Reuniones y Agenda',
    title: 'Vincula Google Calendar y Google Meet',
    description:
      'Conecta tu cuenta en Integraciones para sincronizar fechas de tarjetas y agendar reuniones de Google Meet directamente desde cualquier tarjeta o desde el Calendario.',
    tip: 'Tip: También puedes activar Google Meet al instante si ya vinculaste Google Calendar.',
    ctaLabel: 'Ir a Integraciones',
    ctaPath: '/settings/integrations',
    icon: <LuminsCalendarIcon size={28} />,
  },
  {
    id: 'contrast-menu',
    badge: 'Paso 2 · Apariencia y Menú',
    title: 'Personaliza Contrastes y Posición del Menú',
    description:
      'Ajusta el tema claro u oscuro, cambia tu color de acento Lumins y elige si prefieres la barra de navegación arriba o como menú lateral fijo.',
    tip: 'Tip: Los cambios de contraste y menú se aplican al instante en toda la plataforma.',
    ctaLabel: 'Ir a Preferencias',
    ctaPath: '/settings/preferences',
    icon: <LuminsSettingsIcon size={28} />,
  },
  {
    id: 'permissions',
    badge: 'Paso 3 · Seguridad Avanzada',
    title: 'Explora los Permisos Avanzados',
    description:
      'Administra roles y permisos granulares por espacio y tablero para definir con precisión quién edita, comenta o administra cada proyecto.',
    tip: 'Tip: Cada enlace compartido respeta la jerarquía y sesión del espacio.',
    ctaLabel: 'Ver Miembros y Permisos',
    ctaPath: '/members',
    icon: <LuminsLockIcon size={28} />,
  },
  {
    id: 'harmony',
    badge: 'Paso 4 · Identidad Lumins V2',
    title: 'Disfruta la Nueva Armonía Visual',
    description:
      'Iconografía propia multicolor, transiciones suaves y centro de notificaciones en tiempo real en la campanita para no perderte ninguna novedad.',
    tip: 'Puedes volver a abrir este recorrido desde la campanita cuando quieras.',
    ctaLabel: 'Explorar mis Tableros',
    ctaPath: '/app',
    icon: <LuminsBoardIcon size={28} />,
  },
];

export const V2FeatureOnboardingModal: React.FC = () => {
  const { isOnboardingOpen, closeV2Onboarding } = useProductUpdates();
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();

  if (!isOnboardingOpen) return null;

  const step = V2_STEPS[stepIndex] || V2_STEPS[0];
  const isLast = stepIndex === V2_STEPS.length - 1;

  const handleTryFeature = () => {
    closeV2Onboarding();
    navigate(step.ctaPath);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeV2Onboarding}
          className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#181B22] rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden z-10"
        >
          {/* Barra tricolor Lumins V2 */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF665E] via-[#12A9A8] to-[#FFCC40]" />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#12A9A8]/12 flex items-center justify-center">
                <LuminsSparkleUpdateIcon size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#12A9A8]">
                  Recorrido Guiado · Lumins V2
                </div>
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Paso {stepIndex + 1} de {V2_STEPS.length}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeV2Onboarding}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Cerrar recorrido"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step progress pills */}
          <div className="px-6 pt-4 flex gap-1.5">
            {V2_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStepIndex(idx)}
                className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                  idx <= stepIndex ? 'bg-[#12A9A8]' : 'bg-zinc-200 dark:bg-white/10'
                }`}
                aria-label={s.title}
              />
            ))}
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#212632] border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-800 dark:text-zinc-100">
                {step.icon}
              </div>
              <div className="min-w-0">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#12A9A8]/12 text-[#12A9A8] text-[10px] font-black uppercase tracking-wider mb-1.5">
                  {step.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-snug">
                  {step.title}
                </h3>
              </div>
            </div>

            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {step.description}
            </p>

            <div className="mt-4 p-3.5 rounded-2xl bg-[#FFCC40]/12 border border-[#FFCC40]/30 text-xs font-medium text-zinc-700 dark:text-zinc-200 flex items-start gap-2">
              <CheckCircle2 size={15} className="text-[#d99b00] dark:text-[#FFCC40] shrink-0 mt-0.5" />
              <span>{step.tip}</span>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleTryFeature}
                className="w-full py-2.5 px-4 rounded-xl bg-[#12A9A8] hover:bg-[#0e8f8e] text-white text-xs font-black transition-all shadow-md shadow-[#12A9A8]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{step.ctaLabel}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Footer navigation */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-black/30 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-600 dark:text-zinc-300 disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={13} />
              Anterior
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={closeV2Onboarding}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black cursor-pointer"
              >
                Finalizar recorrido
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(V2_STEPS.length - 1, i + 1))}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                Siguiente
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default V2FeatureOnboardingModal;
