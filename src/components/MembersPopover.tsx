import React, { useState } from 'react';
import { Search, X, ChevronLeft, Check } from 'lucide-react';

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
    <div className="w-72 bg-white rounded-[16px] shadow-dropdown border border-[#E8E9EC] flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-y-auto scrollbar-thin">
      {/* Header Dinámico */}
      <div className="flex items-center justify-between p-4 pb-2">
        {onBack ? (
          <button 
            onClick={onBack}
            className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        ) : (
          <div className="w-6" /> // Spacer
        )}
        
        <h3 className="text-[10px] tracking-[0.4em] font-extrabold text-[#806F9B] uppercase">
          Miembros
        </h3>
        
        <button 
          onClick={onClose}
          className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Buscador */}
      <div className="px-4 pb-4">
        <div className="relative">
          <input 
            type="text"
            placeholder="Buscar miembros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#F4F5F7] border border-[#E8E9EC] rounded-md p-2 pl-8 text-sm text-[#1A1A2E] w-full outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all placeholder:text-[#806F9B]/60"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#806F9B]" />
        </div>
      </div>

      {/* Lista de Miembros */}
      <div className="flex flex-col max-h-64 overflow-y-auto px-2 pb-2 custom-scrollbar">
        <div className="text-xs font-bold text-zinc-900 px-2 mb-2 mt-1">
          Miembros del tablero
        </div>
        
        {uniqueMembers.map((member) => {
          const isAssigned = assignedMemberIds.includes(member.id);
          
          return (
            <button
              key={member.id}
              onClick={() => onToggleMember(member.id)}
              className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors hover:bg-[#F4F5F7] group w-full text-left"
            >
              <div className="flex items-center">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#7A5AF8] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-sm  ring-2 ring-white">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.initials
                  )}
                </div>
                {/* Nombre */}
                <span className="text-sm font-bold text-zinc-900 ml-3 truncate max-w-[150px]">
                  {member.name}
                </span>
              </div>

              {/* Estado */}
              {isAssigned && (
                <Check size={16} className="text-[#7A5AF8] animate-in zoom-in duration-200" />
              )}
            </button>
          );
        })}

        {uniqueMembers.length === 0 && (
          <p className="text-xs text-center text-[#806F9B] py-4">
            No se encontraron miembros.
          </p>
        )}
      </div>
    </div>
  );
};

export default MembersPopover;
