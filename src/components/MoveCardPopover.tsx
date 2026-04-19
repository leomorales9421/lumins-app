import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import apiClient from '../lib/api-client';
import { useNotificationHelpers } from './NotificationProvider';

interface Board {
  id: string;
  name: string;
}

interface List {
  id: string;
  name: string;
  _count?: {
    cards: number;
  };
}

interface MoveCardPopoverProps {
  cardId: string;
  currentBoardId: string;
  currentListId: string;
  onClose: () => void;
  onMoveSuccess: (movedToAnotherBoard: boolean) => void;
}

const MoveCardPopover: React.FC<MoveCardPopoverProps> = ({
  cardId,
  currentBoardId,
  currentListId,
  onClose,
  onMoveSuccess,
}) => {
  const { showSuccess } = useNotificationHelpers();
  const [boards, setBoards] = useState<Board[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  const [selectedBoardId, setSelectedBoardId] = useState(currentBoardId);
  const [selectedListId, setSelectedListId] = useState(currentListId);
  const [selectedPosition, setSelectedPosition] = useState(1);

  // Fetch all boards
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await apiClient.get<{ data: { boards: Board[] } }>('/api/boards');
        setBoards(res.data.boards);
      } catch (err) {
        console.error('Error fetching boards:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, []);

  // Fetch lists when board changes
  useEffect(() => {
    const fetchLists = async () => {
      if (!selectedBoardId) return;
      try {
        const res = await apiClient.get<{ data: { lists: any[] } }>(`/api/lists/boards/${selectedBoardId}/lists`);
        const fetchedLists = res.data.lists.map(l => ({
          id: l.id,
          name: l.name,
          _count: l._count
        }));
        setLists(fetchedLists);
        
        // Reset list and position if board changed
        if (selectedBoardId !== currentBoardId) {
          if (fetchedLists.length > 0) {
            setSelectedListId(fetchedLists[0].id);
            setSelectedPosition(1);
          }
        } else {
          setSelectedListId(currentListId);
        }
      } catch (err) {
        console.error('Error fetching lists:', err);
      }
    };
    fetchLists();
  }, [selectedBoardId, currentBoardId, currentListId]);

  const handleMove = async () => {
    setIsMoving(true);
    try {
      // In this system, position is usually multiples of 1024.
      // We calculate a rough position based on the selected rank.
      const targetPosition = (selectedPosition - 1) * 1024 + 512;

      await apiClient.post(`/api/cards/${cardId}/move`, {
        destinationBoardId: selectedBoardId,
        destinationListId: selectedListId,
        newPosition: targetPosition,
      });

      showSuccess('Tarjeta movida', 'La tarjeta se ha movido correctamente.');
      onMoveSuccess(selectedBoardId !== currentBoardId);
      onClose();
    } catch (err) {
      console.error('Error moving card:', err);
    } finally {
      setIsMoving(false);
    }
  };

  const currentListCardsCount = lists.find(l => l.id === selectedListId)?._count?.cards || 0;
  // If moving within the same list, we don't add 1. If moving to another list, we add 1.
  const maxPosition = (selectedListId === currentListId) ? currentListCardsCount : currentListCardsCount + 1;
  const positions = Array.from({ length: Math.max(1, maxPosition) }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="w-[320px] bg-white rounded-[16px] shadow-2xl border border-[#E8E9EC] p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#6B7280]" />
      </div>
    );
  }

  return (
    <div className="w-[320px] bg-white rounded-[16px] shadow-2xl border border-[#E8E9EC] flex flex-col p-4 animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 text-center">
          <h3 className="text-[10px] tracking-[0.4em] font-bold text-[#806F9B] uppercase">Mover tarjeta</h3>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Select Board */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-zinc-900 mb-1 mt-3">Tablero</label>
        <div className="relative">
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="appearance-none bg-[#F4F5F7] rounded-md p-2.5 text-sm text-[#1A1A2E] w-full outline-none border border-[#E8E9EC] focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 cursor-pointer"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.id === currentBoardId ? '(Actual)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]" />
        </div>
      </div>

      {/* Select List & Position */}
      <div className="flex gap-3 mt-4">
        <div className="flex-[2]">
          <label className="block text-xs font-bold text-zinc-900 mb-1">Lista</label>
          <div className="relative">
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="appearance-none bg-[#F4F5F7] rounded-md p-2.5 text-sm text-[#1A1A2E] w-full outline-none border border-[#E8E9EC] focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 cursor-pointer"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.id === currentListId ? '(Actual)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]" />
          </div>
        </div>

        <div className="flex-[1]">
          <label className="block text-xs font-bold text-zinc-900 mb-1">Posición</label>
          <div className="relative">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(Number(e.target.value))}
              className="appearance-none bg-[#F4F5F7] rounded-md p-2.5 text-sm text-[#1A1A2E] w-full outline-none border border-[#E8E9EC] focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 cursor-pointer"
            >
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleMove}
        disabled={isMoving || (selectedBoardId === currentBoardId && selectedListId === currentListId && selectedPosition === 1)}
        className="w-full bg-[#7A5AF8] text-white font-bold py-2.5 rounded-lg mt-6 hover:bg-[#694de3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isMoving && <Loader2 size={16} className="animate-spin" />}
        Mover
      </button>
    </div>
  );
};

export default MoveCardPopover;
