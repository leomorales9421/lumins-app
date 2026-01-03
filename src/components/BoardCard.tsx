import React from 'react';
import type { Board } from '../types/board';
import { useNavigate } from 'react-router-dom';

interface BoardCardProps {
  board: Board;
  onStarToggle?: (boardId: string, starred: boolean) => void;
  onDelete?: (boardId: string) => void;
  isAdmin?: boolean;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onStarToggle, onDelete, isAdmin }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/boards/${board.id}`);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStarToggle) {
      onStarToggle(board.id, !board.starred);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && isAdmin) {
      onDelete(board.id);
    }
  };

  const getVisibilityColor = () => {
    switch (board.visibility) {
      case 'public': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'team': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'private': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getVisibilityText = () => {
    switch (board.visibility) {
      case 'public': return 'Público';
      case 'team': return 'Equipo';
      case 'private': return 'Privado';
      default: return board.visibility;
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-[#1c2327]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-2xl card-hover group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg truncate group-hover:text-primary transition-colors">
            {board.name}
          </h3>
          {board.description && (
            <p className="text-[#9db0b9] text-sm mt-1 line-clamp-2">
              {board.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleStarClick}
            className="p-1.5 rounded-full hover:bg-white/5 transition-colors"
            aria-label={board.starred ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <svg
              className={`w-5 h-5 ${board.starred ? 'text-yellow-500 fill-yellow-500' : 'text-[#9db0b9]'}`}
              fill={board.starred ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          {isAdmin && onDelete && (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-full hover:bg-red-500/10 text-[#9db0b9] hover:text-red-500 transition-colors"
              aria-label="Eliminar tablero"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getVisibilityColor()}`}>
          {getVisibilityText()}
        </span>
        
        <div className="flex items-center text-[#9db0b9] text-sm">
          {board.updatedAt && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {new Date(board.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-[#9db0b9] text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"></path>
            </svg>
            <span>Miembros</span>
          </div>
        </div>
        
        <div className="text-primary group-hover:text-blue-400 transition-colors">
          <span className="text-sm font-medium">Abrir →</span>
        </div>
      </div>
    </div>
  );
};

export default BoardCard;
