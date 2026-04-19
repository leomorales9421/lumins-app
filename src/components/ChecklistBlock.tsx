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
        <div className="flex items-center gap-3 text-zinc-900">
          <CheckSquare size={20} className="text-[#7A5AF8]" />
          <h3 className="text-lg font-extrabold tracking-tight">{checklist.title}</h3>
        </div>
        <button 
          onClick={() => onDeleteChecklist(checklist.id)}
          className="bg-slate-100 text-[#806F9B] hover:bg-red-50 hover:text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover/checklist:opacity-100"
        >
          Eliminar
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-[#806F9B] w-8 text-right">{progress}%</span>
        <div className="flex-1 h-2 bg-[#E8E9EC] rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              progress === 100 ? 'bg-emerald-500' : 'bg-[#7A5AF8]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 group/item p-1.5 rounded-lg hover:bg-slate-50/50 transition-colors">
            <div className="mt-1 relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => onToggleItem(item.id, e.target.checked)}
                className="peer w-4 h-4 cursor-pointer accent-[#7A5AF8] rounded border-zinc-300 transition-all hover:scale-110 active:scale-95"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p 
                className={`text-sm text-zinc-900 break-words transition-all ${
                  item.done ? 'line-through text-[#806F9B] opacity-70' : ''
                }`}
              >
                {item.title}
              </p>
            </div>

            <button 
              onClick={() => onDeleteItem(item.id)}
              className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 rounded"
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
              className="w-full bg-[#F4F5F7] border border-[#E8E9EC] rounded-md p-3 text-sm text-[#1A1A2E] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all resize-none shadow-sm"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-[#7A5AF8] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#6949d6] transition-colors shadow-lg "
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-[#806F9B] text-sm font-bold hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingItem(true)}
            className="text-sm font-bold text-[#806F9B] hover:text-[#7A5AF8] hover:bg-[#F4F5F7] px-4 py-2 rounded-lg transition-all flex items-center gap-2 group/btn"
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
