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
}

const CardOptionsMenu: React.FC<CardOptionsMenuProps> = ({
  cardId,
  assignedMemberIds,
  onToggleJoin,
  onArchive,
  onClose
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
    <div className="w-56 bg-white rounded-[12px] shadow-[0_10px_40px_-10px_rgba(122,90,248,0.2)] border border-purple-50 flex flex-col py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
      {/* Join / Leave */}
      <button 
        onClick={handleJoinClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-zinc-700 hover:bg-[#F3E8FF] hover:text-[#7A5AF8] transition-colors cursor-pointer group"
      >
        {isJoined ? (
          <>
            <UserMinus size={18} className="text-[#806F9B] group-hover:text-[#7A5AF8]" />
            <span>Abandonar tarjeta</span>
          </>
        ) : (
          <>
            <UserPlus size={18} className="text-[#806F9B] group-hover:text-[#7A5AF8]" />
            <span>Unirse</span>
          </>
        )}
      </button>

      {/* Share */}
      <button 
        onClick={handleShareClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-zinc-700 hover:bg-[#F3E8FF] hover:text-[#7A5AF8] transition-colors cursor-pointer group"
      >
        {copied ? (
          <>
            <Check size={18} className="text-emerald-500" />
            <span className="text-emerald-600">¡Copiado!</span>
          </>
        ) : (
          <>
            <Link size={18} className="text-[#806F9B] group-hover:text-[#7A5AF8]" />
            <span>Copiar enlace</span>
          </>
        )}
      </button>

      {/* Divider */}
      <hr className="border-purple-50 my-1 mx-2" />

      {/* Archive */}
      <button 
        onClick={handleArchiveClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-zinc-700 hover:bg-rose-50 hover:text-[#E91E63] transition-colors cursor-pointer group"
      >
        <Archive size={18} className="text-[#806F9B] group-hover:text-[#E91E63]" />
        <span>Archivar tarjeta</span>
      </button>
    </div>
  );
};

export default CardOptionsMenu;
