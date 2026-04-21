import React, { useState } from 'react';
import { Search, X, ChevronLeft, Check } from 'lucide-react';
import UserAvatar from './ui/UserAvatar';

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}

interface MembersPopoverProps {
  onClose: () => void;
  onBack?: () => void;
  boardMembers: Member[];
  assignedMemberIds: string[];
  onToggleMember: (userId: string) => void;
}

const MembersPopover: React.FC<MembersPopoverProps> = ({
  onClose,
  onBack,
  boardMembers,
  assignedMemberIds,
  onToggleMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = boardMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Deduplicate members by ID
  const uniqueMembers = Array.from(new Map(filteredMembers.map(m => [m.id, m])).values());

  return (
    <div className="w-72 bg-white dark:bg-[#1C1F26] rounded shadow-xl border border-zinc-200 dark:border-white/10 flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        {onBack ? (
          <button 
            onClick={onBack}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-all"
          >
            <ChevronLeft size={16} />
          </button>
        ) : (
          <div className="w-8" /> // Spacer
        )}
        
        <h3 className="text-[10px] tracking-[0.3em] font-black text-zinc-500 dark:text-zinc-500 uppercase">
          Miembros
        </h3>
        
        <button 
          onClick={onClose}
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-3">
        <div className="relative group">
          <input 
            type="text"
            placeholder="Buscar miembros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded p-2.5 pl-9 text-xs font-bold text-zinc-900 dark:text-zinc-100 w-full outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3]/40 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#6C5DD3] transition-colors" />
        </div>
      </div>

      {/* Member List */}
      <div className="flex flex-col max-h-[350px] overflow-y-auto px-2 pb-3 custom-scrollbar">
        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 px-3 mb-2 mt-2 uppercase tracking-wider">
          Colaboradores
        </div>
        
        {uniqueMembers.map((member) => {
          const isAssigned = assignedMemberIds.includes(member.id);
          
          return (
            <button
              key={member.id}
              onClick={() => onToggleMember(member.id)}
              className="flex items-center justify-between p-2.5 rounded cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-white/5 group w-full text-left"
            >
              <div className="flex items-center gap-3">
                <UserAvatar 
                  name={member.name} 
                  avatarUrl={member.avatarUrl} 
                  size="sm"
                  className="ring-2 ring-transparent group-hover:ring-[#6C5DD3]/20 shadow-sm"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">
                    {member.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate max-w-[150px] font-medium leading-none mt-0.5">
                    {member.email}
                  </span>
                </div>
              </div>

              {isAssigned && (
                <div className="w-6 h-6 bg-[#6C5DD3]/10 dark:bg-[#6C5DD3]/20 rounded flex items-center justify-center animate-in zoom-in duration-200">
                  <Check size={14} className="text-[#6C5DD3]" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}

        {uniqueMembers.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-white/5 rounded flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-zinc-300 dark:text-zinc-700" />
            </div>
            <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">
              No se encontraron coincidencias
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersPopover;
