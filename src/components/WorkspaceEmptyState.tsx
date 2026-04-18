import React from 'react';
import { Rocket } from 'lucide-react';

interface WorkspaceEmptyStateProps {
  onCreateClick: () => void;
}

const WorkspaceEmptyState: React.FC<WorkspaceEmptyStateProps> = ({ onCreateClick }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 animate-fade-up">
      {/* Icon Container */}
      <div className="bg-[#F3E8FF] p-8 rounded-full mb-8 relative">
        <Rocket size={64} className="text-[#7A5AF8]" strokeWidth={2.5} />
        {/* Subtle decorative ring */}
        <div className="absolute inset-0 border-4 border-[#7A5AF8]/10 rounded-full scale-125 animate-pulse" />
      </div>

      {/* Text Content */}
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-4xl font-black text-zinc-900 tracking-tighter leading-tight">
          Bienvenido a <span className="text-[#7A5AF8]">Luminous</span>
        </h2>
        <p className="text-[#806F9B] font-medium leading-relaxed">
          Para comenzar a crear tableros y gestionar proyectos, primero debes crear un 
          <span className="text-zinc-900 font-bold"> Espacio de Trabajo</span> para tu equipo.
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={onCreateClick}
        className="mt-12 h-16 px-10 bg-gradient-to-r from-[#7A5AF8] to-[#E91E63] text-white font-black text-lg rounded-[12px] shadow-[0_10px_25px_-5px_rgba(122,90,248,0.4)] hover:shadow-[0_15px_35px_-5px_rgba(122,90,248,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
      >
        Crear Espacio de Trabajo
      </button>

      {/* Micro-hint */}
      <div className="mt-8 flex items-center gap-3 opacity-30">
        <div className="h-px w-8 bg-[#806F9B]" />
        <span className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em]">Empieza hoy</span>
        <div className="h-px w-8 bg-[#806F9B]" />
      </div>
    </div>
  );
};

export default WorkspaceEmptyState;
