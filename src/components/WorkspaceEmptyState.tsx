import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { LuminsRocketIcon } from './icons/LuminsIcons';

interface WorkspaceEmptyStateProps {
  onCreateClick?: () => void;
}

const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = () => {
  const handleAssistedClick = () => {
    window.dispatchEvent(new CustomEvent('open-onboarding'));
  };

  const handleDirectClick = () => {
    window.dispatchEvent(new CustomEvent('open-create-workspace'));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[65vh] animate-fade-up">
      {/* Icon Container */}
      <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#1C1F26] border border-slate-200/80 dark:border-white/10 flex items-center justify-center mb-6 shadow-sm">
        <LuminsRocketIcon size={50} />
      </div>

      {/* Text Content */}
      <div className="max-w-md text-center space-y-2.5">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Bienvenido a <span className="text-[#0E8786] dark:text-[#12A9A8]">Lumins</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Para comenzar a crear tableros y gestionar proyectos, crea un{' '}
          <span className="text-slate-900 dark:text-white font-semibold">Espacio de Trabajo</span>{' '}
          con nuestra guía paso a paso o de forma directa.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={handleAssistedClick}
          className="h-9 px-5 bg-[#12A9A8] hover:bg-[#0E8786] text-white font-semibold text-xs rounded-lg shadow-xs transition-all active:scale-[0.98] inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Sparkles size={14} />
          <span>Crear con asistencia</span>
        </button>

        <button
          type="button"
          onClick={handleDirectClick}
          className="h-9 px-5 bg-white dark:bg-[#1C1F26] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/10 font-semibold text-xs rounded-lg shadow-2xs transition-all active:scale-[0.98] inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus size={14} />
          <span>Crear sin asistencia</span>
        </button>
      </div>

      {/* Micro-hint */}
      <div className="mt-6 flex items-center gap-3 opacity-50">
        <div className="h-px w-8 bg-slate-300 dark:bg-white/15" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Empieza en 1 minuto</span>
        <div className="h-px w-8 bg-slate-300 dark:bg-white/15" />
      </div>
    </div>
  );
};

export default WorkspaceEmptyState;
