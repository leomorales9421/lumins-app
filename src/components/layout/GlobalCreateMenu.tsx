import React, { useState } from 'react';
import { 
  Plus, 
  Layout, 
  Briefcase, 
  ChevronRight 
} from 'lucide-react';
import SmartPopover from '../SmartPopover';

interface GlobalCreateMenuProps {
  onCreateBoard: () => void;
  onCreateWorkspace: () => void;
  canCreateBoard: boolean;
}

const GlobalCreateMenu: React.FC<GlobalCreateMenuProps> = ({ 
  onCreateBoard, 
  onCreateWorkspace,
  canCreateBoard
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateBoard = () => {
    onCreateBoard();
    setIsOpen(false);
  };

  const handleCreateWorkspace = () => {
    onCreateWorkspace();
    setIsOpen(false);
  };

  const menuContent = (
    <div className="w-64 bg-white dark:bg-[#1C1F26] rounded shadow-2xl border border-zinc-100 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in duration-200">
      {/* Nuevo Tablero */}
      <button
        disabled={!canCreateBoard}
        onClick={handleCreateBoard}
        className={`w-full flex items-center gap-3 p-3 rounded transition-all text-left group/item
          ${canCreateBoard 
            ? 'hover:bg-indigo-50 dark:hover:bg-[#6C5DD3]/10 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed grayscale'
          }
        `}
      >
        <div className={`w-9 h-9 rounded flex items-center justify-center transition-colors
          ${canCreateBoard ? 'bg-indigo-100 dark:bg-[#6C5DD3]/20 text-[#6C5DD3] dark:text-indigo-400' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-600'}
        `}>
          <Layout size={18} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover/item:text-[#6C5DD3] dark:group-hover/item:text-indigo-400 transition-colors">Tablero</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Crea un tablero en el espacio actual</p>
        </div>
        <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600 group-hover/item:text-[#6C5DD3] dark:group-hover/item:text-indigo-400 group-hover/item:translate-x-0.5 transition-all" />
      </button>

      <hr className="my-1.5 border-zinc-100 dark:border-white/5" />

      {/* Nuevo Espacio de Trabajo */}
      <button
        onClick={handleCreateWorkspace}
        className="w-full flex items-center gap-3 p-3 rounded hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left group/item"
      >
        <div className="w-9 h-9 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 rounded flex items-center justify-center group-hover/item:bg-zinc-200 dark:group-hover/item:bg-white/20 transition-colors">
          <Briefcase size={18} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Espacio de Trabajo</h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Crea una organización para tus equipos</p>
        </div>
        <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600 group-hover/item:translate-x-0.5 transition-all" />
      </button>
    </div>
  );

  return (
    <SmartPopover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`
            h-10 px-3 rounded-[4px] font-bold text-[13px] transition-all flex items-center justify-center gap-2
            ${isOpen 
              ? 'bg-zinc-100 dark:bg-white/10 text-indigo-600 dark:text-indigo-400' 
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100'
            }
          `}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-100 dark:bg-[#6C5DD3]/20' : 'bg-zinc-100 dark:bg-white/10'}`}>
            <Plus size={14} strokeWidth={3} className={`${isOpen ? 'rotate-45' : ''} transition-transform duration-200 ${isOpen ? 'text-indigo-600' : ''}`} />
          </div>
          <span className="uppercase tracking-wider">Nuevo</span>
        </button>
      }

      content={menuContent}
    />
  );
};

export default GlobalCreateMenu;
