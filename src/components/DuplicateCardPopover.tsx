import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, ChevronDown, Copy, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import type { Board } from '../types/board';

interface List {
  id: string;
  name: string;
  _count?: {
    cards: number;
  };
}

interface DuplicateCardPopoverProps {
  currentBoardId: string;
  currentListId: string;
  currentCardPosition?: number;
  onDuplicate: (payload: {
    destinationBoardId: string;
    destinationListId: string;
    newPosition: number;
    copyOptions: {
      copyAssignees: boolean;
      copyLabels: boolean;
      copyChecklists: boolean;
      copyDates: boolean;
      copyStatusFlags: boolean;
    };
  }) => Promise<void>;
  onClose: () => void;
  onDuplicateSuccess: (duplicatedToAnotherBoard: boolean) => void;
}

const DuplicateCardPopover: React.FC<DuplicateCardPopoverProps> = ({
  currentBoardId,
  currentListId,
  currentCardPosition,
  onDuplicate,
  onClose,
  onDuplicateSuccess,
}) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [selectedBoardId, setSelectedBoardId] = useState(currentBoardId);
  const [selectedListId, setSelectedListId] = useState(currentListId);
  const [selectedPosition, setSelectedPosition] = useState(1);

  const [copyAssignees, setCopyAssignees] = useState(true);
  const [copyLabels, setCopyLabels] = useState(true);
  const [copyChecklists, setCopyChecklists] = useState(true);
  const [copyDates, setCopyDates] = useState(true);
  const [copyStatusFlags, setCopyStatusFlags] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await apiClient.get<{ data: { boards: Board[] } }>('/api/boards');
        setBoards(res.data.boards || []);
      } catch (err) {
        console.error('Error fetching boards for duplicate:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []);

  useEffect(() => {
    if (!selectedBoardId) return;

    const fetchLists = async () => {
      try {
        const res = await apiClient.get<{ data: { lists: List[] } }>(`/api/lists/boards/${selectedBoardId}/lists`);
        const fetchedLists = res.data.lists || [];
        setLists(fetchedLists);

        if (selectedBoardId === currentBoardId) {
          setSelectedListId(currentListId);
        } else if (fetchedLists.length > 0) {
          setSelectedListId(fetchedLists[0].id);
        }
      } catch (err) {
        console.error('Error fetching lists for duplicate:', err);
      }
    };

    fetchLists();
  }, [selectedBoardId, currentBoardId, currentListId]);

  const currentListCardsCount = useMemo(
    () => lists.find((l) => l.id === selectedListId)?._count?.cards || 0,
    [lists, selectedListId]
  );

  const positions = useMemo(() => {
    const maxPosition = currentListCardsCount + 1;
    return Array.from({ length: Math.max(1, maxPosition) }, (_, i) => i + 1);
  }, [currentListCardsCount]);

  useEffect(() => {
    if (positions.length === 0) return;

    if (selectedBoardId === currentBoardId && selectedListId === currentListId && currentCardPosition) {
      const suggestedPosition = Math.min(
        positions.length,
        Math.max(1, Math.floor(currentCardPosition / 1000) + 1)
      );
      setSelectedPosition(suggestedPosition);
      return;
    }

    setSelectedPosition(Math.max(1, positions.length));
  }, [
    positions,
    selectedBoardId,
    selectedListId,
    currentBoardId,
    currentListId,
    currentCardPosition,
  ]);

  const groupedBoards = useMemo(
    () =>
      boards.reduce((acc, board) => {
        const workspaceName = board.workspace?.name || 'Otros';
        if (!acc[workspaceName]) acc[workspaceName] = [];
        acc[workspaceName].push(board);
        return acc;
      }, {} as Record<string, Board[]>),
    [boards]
  );

  const handleDuplicate = async () => {
    if (!selectedBoardId || !selectedListId) return;

    setIsDuplicating(true);
    try {
      await onDuplicate({
        destinationBoardId: selectedBoardId,
        destinationListId: selectedListId,
        newPosition: selectedPosition * 1000,
        copyOptions: {
          copyAssignees,
          copyLabels,
          copyChecklists,
          copyDates,
          copyStatusFlags,
        },
      });

      toast.success('Tarjeta duplicada', {
        description:
          selectedBoardId === currentBoardId
            ? 'La copia se creó correctamente.'
            : 'La copia se creó en el tablero de destino.',
      });

      onDuplicateSuccess(selectedBoardId !== currentBoardId);
      onClose();
    } catch (err: any) {
      console.error('Error duplicating card:', err);
      const message = err.response?.data?.message || 'No se pudo duplicar la tarjeta';
      toast.error('No se pudo duplicar', {
        description: message,
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-[340px] bg-white dark:bg-[#1C1F26] rounded shadow-2xl border border-zinc-200 dark:border-white/10 p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400 dark:text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-white dark:bg-[#1C1F26] rounded shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col p-4 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 text-center">
          <h3 className="text-[10px] tracking-[0.4em] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
            Duplicar tarjeta
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1 mt-3">Tablero</label>
        <div className="relative">
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="appearance-none bg-zinc-50 dark:bg-[#13151A] rounded p-2.5 text-sm text-zinc-900 dark:text-zinc-100 w-full outline-none border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 cursor-pointer"
          >
            {Object.entries(groupedBoards).map(([workspaceName, workspaceBoards]) => (
              <optgroup key={workspaceName} label={workspaceName}>
                {workspaceBoards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name} {board.id === currentBoardId ? '(Actual)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-1">
        <div className="flex-[2]">
          <label className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">Lista</label>
          <div className="relative">
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="appearance-none bg-zinc-50 dark:bg-[#13151A] rounded p-2.5 text-sm text-zinc-900 dark:text-zinc-100 w-full outline-none border border-zinc-200 dark:border-white/10 focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 cursor-pointer"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} {list.id === currentListId ? '(Actual)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500"
            />
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
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 p-3">
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Incluir en la copia</p>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { checked: copyAssignees, onChange: setCopyAssignees, label: 'Responsables' },
            { checked: copyLabels, onChange: setCopyLabels, label: 'Etiquetas' },
            { checked: copyChecklists, onChange: setCopyChecklists, label: 'Checklists' },
            { checked: copyDates, onChange: setCopyDates, label: 'Fechas' },
            { checked: copyStatusFlags, onChange: setCopyStatusFlags, label: 'Estado (hecha/bloqueada)' },
          ].map((item) => (
            <label
              key={item.label}
              className="inline-flex items-center gap-2 text-[12px] text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.onChange(e.target.checked)}
                className="accent-[#6C5DD3]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleDuplicate}
        disabled={isDuplicating || !selectedListId || !selectedBoardId}
        className="w-full bg-[#6C5DD3] text-white font-bold py-2.5 rounded mt-5 hover:bg-[#312e81] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#6C5DD3]/20"
      >
        {isDuplicating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
        Duplicar
      </button>

      <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5">
        <CheckSquare size={12} className="mt-0.5" />
        Solo se conservarán responsables que tengan acceso al tablero destino.
      </p>
    </div>
  );
};

export default DuplicateCardPopover;
