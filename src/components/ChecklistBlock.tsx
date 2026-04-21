import React, { useState } from 'react';
import { CheckSquare, Trash2, X } from 'lucide-react';
import type { Checklist, ChecklistItem } from '../types/board';

interface ChecklistBlockProps {
  checklist: Checklist;
  onAddItem: (checklistId: string, title: string) => void;
  onToggleItem: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onUpdateItemTitle: (itemId: string, title: string) => void;
}

const ChecklistBlock: React.FC<ChecklistBlockProps> = ({
  checklist,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onDeleteChecklist,
  onUpdateItemTitle
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const completedItems = checklist.items.filter(item => item.done).length;
  const totalItems = checklist.items.length;
  const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemTitle.trim()) {
      onAddItem(checklist.id, newItemTitle.trim());
      setNewItemTitle('');
      setIsAddingItem(false);
    }
  };

  return (
    <div className="space-y-4 mb-10 group/checklist">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
          <CheckSquare size={20} className="text-[#6C5DD3]" />
          <h3 className="text-lg font-extrabold tracking-tight">{checklist.title}</h3>
        </div>
        <button 
          onClick={() => onDeleteChecklist(checklist.id)}
          className="bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover/checklist:opacity-100"
        >
          Eliminar
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 w-8 text-right">{progress}%</span>
        <div className="flex-1 h-2 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              progress === 100 ? 'bg-emerald-500' : 'bg-[#6C5DD3]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 group/item p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
            <div className="mt-1 relative flex items-center justify-center">
               <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => onToggleItem(item.id, e.target.checked)}
                className="peer w-4 h-4 cursor-pointer accent-[#6C5DD3] rounded border-zinc-300 dark:border-white/10 transition-all hover:scale-110 active:scale-95 bg-white dark:bg-[#1C1F26]"
              />
            </div>
                        <div className="flex-1 min-w-0">
              <p 
                className={`text-sm text-zinc-900 dark:text-zinc-100 break-words transition-all ${
                  item.done ? 'line-through text-zinc-400 dark:text-zinc-500 opacity-70' : ''
                }`}
              >
                {item.title}
              </p>
            </div>

             <button 
              onClick={() => onDeleteItem(item.id)}
              className="opacity-0 group-hover/item:opacity-100 p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Item Area */}
      <div className="pt-2">
        {isAddingItem ? (
          <form onSubmit={handleAddItem} className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <textarea
              autoFocus
              placeholder="Añadir un elemento..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddItem(e);
                }
                if (e.key === 'Escape') {
                  setIsAddingItem(false);
                }
              }}
               className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-md p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 transition-all resize-none shadow-sm"
              rows={2}
            />
             <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-[#6C5DD3] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#312e81] transition-colors shadow-lg shadow-[#6C5DD3]/20"
              >
                Añadir
              </button>
               <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-zinc-500 dark:text-zinc-400 text-sm font-bold hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
         ) : (
          <button
            onClick={() => setIsAddingItem(true)}
            className="text-sm font-bold text-zinc-500 dark:text-zinc-300 hover:text-[#6C5DD3] dark:hover:text-[#8E82E3] hover:bg-zinc-100 dark:hover:bg-white/5 px-4 py-2 rounded-lg transition-all flex items-center gap-2 group/btn"
          >
            <span className="text-lg leading-none group-hover/btn:scale-125 transition-transform">+</span>
            Añadir un elemento
          </button>
        )}
      </div>
    </div>
  );
};

export default ChecklistBlock;
