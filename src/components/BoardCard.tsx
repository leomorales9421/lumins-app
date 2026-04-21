import React from 'react';
import type { Board } from '../types/board';
import { useNavigate } from 'react-router-dom';
import { Layout, MoreHorizontal, Calendar, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './ui/UserAvatar';

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
      className="group flex flex-col cursor-pointer bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1"
    >
      <div className="p-5 flex flex-col flex-1">
        
        {/* Header: Visibility Badge & Options */}
        <div className="flex justify-between items-center mb-4">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            board.visibility === 'public' 
              ? 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400' 
              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'
          }`}>
            {board.visibility === 'public' ? 'Público' : 'Privado'}
          </span>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            < MoreHorizontal size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-white/5 text-[#6C5DD3] flex items-center justify-center group-hover:bg-[#6C5DD3] group-hover:text-white transition-all">
               <Layout size={18} strokeWidth={2.5} />
            </div>
            <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-[#6C5DD3] transition-colors truncate">
              {board.name}
            </h3>
          </div>
          <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug pl-10">
            {board.description || 'Sin descripción disponible.'}
          </p>
        </div>

        {/* Progress Bar */}
         <div className="mt-auto mb-5 pl-10">
            <div className="flex justify-between items-center mb-1.5">
               <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Progreso</span>
               <span className="text-[10px] font-bold text-[#6C5DD3]">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded overflow-hidden">
               <div 
                 className="h-full bg-[#6C5DD3] rounded transition-all duration-500" 
                 style={{ width: `${progress}%` }}
               />
            </div>
         </div>

        <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-white/5">
          <div className="flex -space-x-2">
             <UserAvatar 
               user={user} 
               size="xs" 
               className="border-2 border-white dark:border-[#1C1F26] shadow-sm"
             />
             <div className="w-7 h-7 rounded bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border-2 border-white dark:border-[#1C1F26] shadow-sm">
               <Users size={12} />
             </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
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
