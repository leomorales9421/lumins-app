import React from 'react';
import { Rocket } from 'lucide-react';

interface WorkspaceEmptyStateProps {
  onCreateClick: () => void;
}

const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({ onCreateClick }) => {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open-onboarding'));
    if (onCreateClick) {
      onCreateClick();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 animate-fade-up">
      {/* Icon Container */}
      <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 p-8 rounded-3xl mb-8 relative shadow-[0_0_50px_rgba(99,102,241,0.2)]">
        <Rocket size={64} className="text-[#6366F1]" strokeWidth={2.2} />
        {/* Subtle decorative ring */}
        <div className="absolute inset-0 border-4 border-[#6366F1]/10 rounded-3xl scale-110 animate-pulse" />
      </div>

      {/* Text Content */}
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
          Bienvenido a <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">Lumins</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Para comenzar a crear tableros y gestionar proyectos, primero debes crear un 
          <span className="text-zinc-900 dark:text-white font-bold"> Espacio de Trabajo</span> para tu equipo.
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleClick}
        className="mt-10 h-14 px-8 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-extrabold text-sm rounded-xl shadow-[0_10px_25px_-5px_rgba(99,102,241,0.5)] hover:shadow-[0_15px_35px_-5px_rgba(99,102,241,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider"
      >
        Crear Espacio de Trabajo
      </button>

      {/* Micro-hint */}
      <div className="mt-8 flex items-center gap-3 opacity-30">
        <div className="h-px w-8 bg-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Empieza en 1 minuto</span>
        <div className="h-px w-8 bg-slate-400" />
      </div>
    </div>
  );
};

export default WorkspaceEmptyState;
