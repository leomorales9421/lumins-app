import React from 'react';
import type { Board } from '../types/board';
import { useNavigate } from 'react-router-dom';
import { Layout, MoreHorizontal, Calendar, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BoardCardProps {
  board: Board;
}

const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // For now, if we don't have real progress data from the backend, 
  // we default to 0% for new boards or calculate based on available info.
  // In a real scenario, this would come from a 'progress' or 'stats' field in the API.
  const progress = board._count?.cards === 0 ? 0 : 0; // Defaulting to 0 for now as we don't have 'closed' count in summary

  return (
    <div
      onClick={() => navigate(`/boards/${board.id}`)}
      className="group flex flex-col cursor-pointer bg-white border border-[#E8E9EC] rounded-xl overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1"
    >
      <div className="p-5 flex flex-col flex-1">
        
        {/* Header: Visibility Badge & Options */}
        <div className="flex justify-between items-center mb-4">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            board.visibility === 'public' 
              ? 'bg-[#F4F5F7] text-[#6B7280]' 
              : 'bg-amber-50 text-amber-600'
          }`}>
            {board.visibility === 'public' ? 'Público' : 'Privado'}
          </span>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded text-[#9CA3AF] hover:bg-[#F4F5F7] hover:text-[#1A1A2E] transition-colors"
          >
            < MoreHorizontal size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F4F5F7] text-[#7A5AF8] flex items-center justify-center group-hover:bg-[#7A5AF8] group-hover:text-white transition-all">
               <Layout size={18} strokeWidth={2.5} />
            </div>
            <h3 className="text-[16px] font-bold text-[#1A1A2E] tracking-tight group-hover:text-[#7A5AF8] transition-colors truncate">
              {board.name}
            </h3>
          </div>
          <p className="text-[13px] font-medium text-[#6B7280] line-clamp-2 leading-snug pl-10">
            {board.description || 'Sin descripción disponible.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-auto mb-5 pl-10">
           <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase">Progreso</span>
              <span className="text-[10px] font-bold text-[#7A5AF8]">{progress}%</span>
           </div>
           <div className="h-1.5 w-full bg-[#F4F5F7] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#7A5AF8] rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-[#F0F1F3]">
          <div className="flex -space-x-2">
             <div className="w-7 h-7 rounded-full bg-[#7A5AF8] flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">
               {user?.name?.[0] || 'U'}
             </div>
             <div className="w-7 h-7 rounded-full bg-[#EAECF0] flex items-center justify-center text-[#9CA3AF] border-2 border-white shadow-sm">
               <Users size={12} />
             </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-[#9CA3AF]">
             <Calendar size={14} />
             <span className="text-[11px] font-bold">
               {board.createdAt ? new Date(board.createdAt).getFullYear() : '2026'}
             </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BoardCard;
