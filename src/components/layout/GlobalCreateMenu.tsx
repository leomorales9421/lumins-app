import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import SmartPopover from '../SmartPopover';
import { LuminsBoardIcon, LuminsWorkspaceIcon, LuminsMembersIcon } from '../icons/LuminsIcons';

interface GlobalCreateMenuProps {
  onCreateBoard: () => void;
  onCreateWorkspace: () => void;
  onInviteMember?: () => void;
  canCreateBoard: boolean;
}

const GlobalCreateMenu: React.FC<GlobalCreateMenuProps> = ({ 
  onCreateBoard, 
  onCreateWorkspace,
  onInviteMember,
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

  const handleInviteMember = () => {
    onInviteMember?.();
    setIsOpen(false);
  };

  const menuContent = (
    <div className="w-64 bg-white dark:bg-[#1C1F26] rounded-xl shadow-xl border border-slate-200/90 dark:border-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
      {/* Nuevo Tablero */}
      <button
        disabled={!canCreateBoard}
        onClick={handleCreateBoard}
        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left group/item
          ${canCreateBoard 
            ? 'hover:bg-[var(--lumins-accent-soft)] cursor-pointer' 
            : 'opacity-50 cursor-not-allowed grayscale'
          }
        `}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0
          ${canCreateBoard ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-600'}
        `}>
          <LuminsBoardIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover/item:text-[var(--lumins-accent-fg)] transition-colors">Tablero</h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-snug">Crea un tablero en el espacio actual</p>
        </div>
        <ChevronRight size={14} className="text-slate-300 dark:text-zinc-600 group-hover/item:text-[var(--lumins-accent-fg)] group-hover/item:translate-x-0.5 transition-all shrink-0" />
      </button>

      <hr className="my-1 border-slate-100 dark:border-white/5" />

      {/* Nuevo Espacio de Trabajo */}
      <button
        onClick={handleCreateWorkspace}
        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--lumins-accent-soft)] transition-all text-left group/item cursor-pointer"
      >
        <div className="w-9 h-9 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-200 rounded-lg flex items-center justify-center group-hover/item:bg-[var(--lumins-accent-soft)] group-hover/item:text-[var(--lumins-accent-fg)] transition-colors shrink-0">
          <LuminsWorkspaceIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover/item:text-[var(--lumins-accent-fg)] transition-colors">Espacio de Trabajo</h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-snug">Crea una organización para tus equipos</p>
        </div>
        <ChevronRight size={14} className="text-slate-300 dark:text-zinc-600 group-hover/item:text-[var(--lumins-accent-fg)] group-hover/item:translate-x-0.5 transition-all shrink-0" />
      </button>

      {onInviteMember && (
        <>
          <hr className="my-1 border-slate-100 dark:border-white/5" />

          {/* Invitar Miembro */}
          <button
            onClick={handleInviteMember}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--lumins-accent-soft)] transition-all text-left group/item cursor-pointer"
          >
            <div className="w-9 h-9 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-200 rounded-lg flex items-center justify-center group-hover/item:bg-[var(--lumins-accent-soft)] group-hover/item:text-[var(--lumins-accent-fg)] transition-colors shrink-0">
              <LuminsMembersIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover/item:text-[var(--lumins-accent-fg)] transition-colors">Miembro</h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-snug">Invita personas a un espacio o tablero</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 dark:text-zinc-600 group-hover/item:text-[var(--lumins-accent-fg)] group-hover/item:translate-x-0.5 transition-all shrink-0" />
          </button>
        </>
      )}
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
            h-9 px-2.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer
            ${isOpen 
              ? 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]' 
              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-zinc-100'
            }
          `}
        >
          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isOpen ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)]' : 'bg-[var(--lumins-accent-soft)] text-[var(--lumins-accent-fg)]'}`}>
            <Plus size={13} strokeWidth={2.75} className={`${isOpen ? 'rotate-45' : ''} transition-transform duration-200`} />
          </div>
          <span className="uppercase tracking-wider hidden sm:block">Nuevo</span>
        </button>
      }

      content={menuContent}
    />
  );
};

export default GlobalCreateMenu;
