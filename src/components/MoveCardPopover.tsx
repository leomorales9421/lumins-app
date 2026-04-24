import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2 } from 'lucide-react';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import { Board } from '../types/board';


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
    if (!selectedBoardId) return;

    const fetchLists = async () => {
      try {
        const res = await apiClient.get<{ data: { lists: List[] } }>(`/api/lists/boards/${selectedBoardId}/lists`);
        setLists(res.data.lists);
        
        // If moving to current board, select current list
        if (selectedBoardId === currentBoardId) {
          setSelectedListId(currentListId);
        } else if (res.data.lists.length > 0) {
          setSelectedListId(res.data.lists[0].id);
        }
      } catch (err) {
        console.error('Error fetching lists:', err);
      }
    };
    fetchLists();
  }, [selectedBoardId, currentBoardId, currentListId]);

  const handleMove = async () => {
    if (!selectedBoardId || !selectedListId) return;

    setIsMoving(true);
    try {
      await apiClient.post(`/api/cards/${cardId}/move`, {
        destinationBoardId: selectedBoardId,
        destinationListId: selectedListId,
        newPosition: (selectedPosition - 1) * 1024 + 1024,
      });

      toast.success('Tarjeta movida', {
        description: 'La tarjeta se ha movido correctamente.'
      });

      onMoveSuccess(selectedBoardId !== currentBoardId);
      onClose();
    } catch (err: any) {
      console.error('Error moving card:', err);
      const message = err.response?.data?.message || 'Error al mover la tarjeta';
      toast.error('No se pudo mover', {
        description: message
      });
    } finally {
      setIsMoving(false);
    }
  };

  const currentListCardsCount = lists.find(l => l.id === selectedListId)?._count?.cards || 0;
  // If moving within the same list, we don't add 1. If moving to another list, we add 1.
  const maxPosition = (selectedListId === currentListId) ? currentListCardsCount : currentListCardsCount + 1;
  const positions = Array.from({ length: Math.max(1, maxPosition) }, (_, i) => i + 1);

  // Group boards by workspace
  const groupedBoards = boards.reduce((acc, b) => {
    const wsName = b.workspace?.name || 'Otros';
    if (!acc[wsName]) acc[wsName] = [];
    acc[wsName].push(b);
    return acc;
  }, {} as Record<string, Board[]>);

  if (isLoading) {
    return (
      <div className="w-[320px] bg-white dark:bg-[#1C1F26] rounded shadow-2xl border border-zinc-200 dark:border-white/10 p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400 dark:text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="w-[320px] bg-white dark:bg-[#1C1F26] rounded shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col p-4 animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 text-center">
          <h3 className="text-[10px] tracking-[0.4em] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Mover tarjeta</h3>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Select Board */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 mt-3">Tablero</label>
        <div className="relative">
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="appearance-none bg-zinc-50 dark:bg-[#13151A] rounded p-2.5 text-sm text-zinc-900 dark:text-zinc-100 w-full outline-none border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 cursor-pointer"
          >
            {Object.entries(groupedBoards).map(([wsName, wsBoards]) => (
              <optgroup key={wsName} label={wsName}>
                {wsBoards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.id === currentBoardId ? '(Actual)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500" />
        </div>
      </div>

      {/* Select List & Position */}
      <div className="flex gap-3 mt-4">
        <div className="flex-[2]">
          <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">Lista</label>
          <div className="relative">
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="appearance-none bg-zinc-50 dark:bg-[#13151A] rounded p-2.5 text-sm text-zinc-900 dark:text-zinc-100 w-full outline-none border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 cursor-pointer"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.id === currentListId ? '(Actual)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>

        <div className="flex-[1]">
          <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">Posición</label>
          <div className="relative">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(Number(e.target.value))}
              className="appearance-none bg-zinc-50 dark:bg-[#13151A] rounded p-2.5 text-sm text-zinc-900 dark:text-zinc-100 w-full outline-none border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 cursor-pointer"
            >
              {positions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleMove}
        disabled={isMoving || (selectedBoardId === currentBoardId && selectedListId === currentListId && selectedPosition === 1)}
        className="w-full bg-[#6C5DD3] text-white font-bold py-2.5 rounded mt-6 hover:bg-[#312e81] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#6C5DD3]/20"
      >
        {isMoving && <Loader2 size={16} className="animate-spin" />}
        Mover
      </button>
    </div>
  );
};

export default MoveCardPopover;
