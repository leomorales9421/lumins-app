import React from 'react';
import type { Board } from '../types/board';
import { useNavigate } from 'react-router-dom';
import Card from './ui/Card';

interface BoardCardProps {
  board: Board;
}

const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/boards/${board.id}`)}
      variant="default"
      className="group flex flex-col cursor-pointer h-[360px] rounded-xl bg-white border border-[#7A5AF8]/5 transition-all duration-300 hover:shadow-heavy hover:-translate-y-1.5"
    >
      <div className="flex flex-col flex-1 p-8">
        
        {/* Status Label (From Identity Graph) */}
        <div className="flex justify-between items-center mb-8">
          <span className="px-3 py-1.5 rounded-md bg-[#F3E8FF] text-[#7A5AF8] text-[10px] font-extrabold uppercase tracking-[0.2em]">
            {board.visibility === 'public' ? 'Estratégico' : 'Privado'}
          </span>
          <div className="w-8 h-8 rounded-md bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-[#7A5AF8]/5 group-hover:text-[#7A5AF8] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
          </div>
        </div>

        {/* Content (Manrope Headlines) */}
        <div className="flex flex-col gap-3 mb-8">
          <h3 className="text-2xl font-extrabold text-[#100B26] tracking-tight group-hover:text-[#7A5AF8] transition-colors leading-tight font-sans">
            {board.name}
          </h3>
          <p className="text-sm font-medium text-[#806F9B] truncate leading-relaxed">
            {board.description || 'Despliegue operativo alineado con la identidad de marca v7.0.'}
          </p>
        </div>

        {/* Progress Bar (Using Primary/Secondary colors) */}
        <div className="mt-auto mb-6">
           <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-black text-[#806F9B] uppercase tracking-widest">Ejecución</span>
              <span className="text-[10px] font-black text-[#7A5AF8] tracking-widest">72%</span>
           </div>
           <div className="h-2 w-full bg-[#F3E8FF] rounded-full overflow-hidden">
              <div className="h-full bg-[#7A5AF8] w-[72%] rounded-full transition-all duration-1000 group-hover:bg-gradient-to-r group-hover:from-[#7A5AF8] group-hover:to-[#E91E63]" />
           </div>
        </div>

        {/* Footer (Manrope Labels) */}
        <div className="pt-6 flex items-center justify-between border-t border-zinc-50">
          <div className="flex -space-x-3">
             <div className="w-8 h-8 rounded-md bg-[#7A5AF8] flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">
               M
             </div>
             <div className="w-8 h-8 rounded-md bg-[#E91E63] flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm">
               P
             </div>
          </div>
          
          <div className="flex items-center gap-2 text-[#806F9B]">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/></svg>
             <span className="text-[10px] font-black uppercase tracking-widest">Q3 2026</span>
          </div>
        </div>

      </div>
    </Card>
  );
};

export default BoardCard;
