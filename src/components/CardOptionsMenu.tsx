import React from 'react';
import { 
  UserPlus, 
  UserMinus, 
  Link, 
  Archive, 
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CardOptionsMenuProps {
  cardId: string;
  assignedMemberIds: string[];
  onToggleJoin: (userId: string) => Promise<void>;
  onArchive: () => Promise<void>;
  onClose: () => void;
  canModerate?: boolean;
}

const CardOptionsMenu: React.FC<CardOptionsMenuProps> = ({
  cardId,
  assignedMemberIds,
  onToggleJoin,
  onArchive,
  onClose,
  canModerate
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const isJoined = user ? assignedMemberIds.includes(user.id) : false;

  const handleJoinClick = async () => {
    if (!user) return;
    await onToggleJoin(user.id);
    onClose();
  };

  const handleShareClick = () => {
    // Construct the URL with cardId for deep linking
    const url = new URL(window.location.href);
    url.searchParams.set('cardId', cardId);
    
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    
    // Reset copy state after 2 seconds
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 2000);
  };

  const handleArchiveClick = async () => {
    if (window.confirm('¿Estás seguro de que deseas archivar esta tarjeta?')) {
      await onArchive();
      onClose();
    }
  };

  return (
    <div className="w-56 bg-white dark:bg-[#1C1F26] rounded shadow-dropdown border border-zinc-200 dark:border-white/10 flex flex-col py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
      {/* Join / Leave */}
      <button 
        onClick={handleJoinClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-[#6C5DD3] dark:hover:text-[#6C5DD3] transition-colors cursor-pointer group"
      >
        {isJoined ? (
          <>
            <UserMinus size={18} className="text-zinc-400 dark:text-zinc-500 group-hover:text-[#6C5DD3]" />
            <span>Abandonar tarjeta</span>
          </>
        ) : (
          <>
            <UserPlus size={18} className="text-zinc-400 dark:text-zinc-500 group-hover:text-[#6C5DD3]" />
            <span>Unirse</span>
          </>
        )}
      </button>

      {/* Share */}
      <button 
        onClick={handleShareClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-[#6C5DD3] dark:hover:text-[#6C5DD3] transition-colors cursor-pointer group"
      >
        {copied ? (
          <>
            <Check size={18} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-500">¡Copiado!</span>
          </>
        ) : (
          <>
            <Link size={18} className="text-zinc-400 dark:text-zinc-500 group-hover:text-[#6C5DD3]" />
            <span>Copiar enlace</span>
          </>
        )}
      </button>

      {/* Divider */}
      {canModerate && <hr className="border-zinc-100 dark:border-white/5 my-1 mx-2" />}

      {/* Archive */}
      {canModerate && (
        <button 
          onClick={handleArchiveClick}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer group"
        >
          <Archive size={18} className="text-zinc-400 dark:text-zinc-500 group-hover:text-rose-500 dark:group-hover:text-rose-400" />
          <span>Archivar tarjeta</span>
        </button>
      )}
    </div>
  );
};

export default CardOptionsMenu;
