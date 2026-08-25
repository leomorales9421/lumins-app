import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import type { Checklist, ChecklistItem } from '../types/board';

interface ChecklistBlockProps {
  checklist: Checklist;
  onAddItem: (checklistId: string, title: string) => void;
  onToggleItem: (itemId: string, done: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onUpdateItemTitle: (itemId: string, title: string) => void;
  onUpdateChecklistTitle?: (checklistId: string, title: string) => void;
  isReadOnly?: boolean;
}

const ChecklistBlock: React.FC<ChecklistBlockProps> = ({
  checklist,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onDeleteChecklist,
  onUpdateItemTitle,
  onUpdateChecklistTitle,
  isReadOnly
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState(checklist.title);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setChecklistTitle(checklist.title);
  }, [checklist.title]);

  const completedItems = checklist.items.filter(item => item.done).length;
  const totalItems = checklist.items.length;
  const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newItemTitle, isAddingItem]);

  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.style.height = 'auto';
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [editingTitle, editingItemId]);

  const handleSaveTitle = () => {
    if (checklistTitle.trim() && checklistTitle !== checklist.title && onUpdateChecklistTitle) {
      onUpdateChecklistTitle(checklist.id, checklistTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemTitle.trim()) {
      onAddItem(checklist.id, newItemTitle.trim());
      setNewItemTitle('');
    }
  };

  const handleStartEditItem = (item: ChecklistItem) => {
    if (isReadOnly) return;
    setEditingItemId(item.id);
    setEditingTitle(item.title);
  };

  const handleSaveEditItem = (itemId: string) => {
    if (editingTitle.trim()) {
      onUpdateItemTitle(itemId, editingTitle.trim());
    }
    setEditingItemId(null);
  };

  return (
    <div className="space-y-4 mb-10 group/checklist">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0 text-zinc-900 dark:text-zinc-100">
          <CheckSquare size={20} className="text-[#6C5DD3] flex-shrink-0" />
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                ref={titleInputRef}
                autoFocus
                type="text"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setChecklistTitle(checklist.title);
                    setIsEditingTitle(false);
                  }
                }}
                onBlur={handleSaveTitle}
                className="flex-1 bg-white dark:bg-[#13151A] border border-[#6C5DD3] rounded px-2.5 py-1 text-base font-bold text-zinc-900 dark:text-zinc-100 outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="p-1.5 rounded bg-[#6C5DD3] text-white hover:bg-[#5b4ebf] transition-colors"
                title="Guardar título"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <h3 
              onClick={() => !isReadOnly && setIsEditingTitle(true)}
              className={`text-lg font-extrabold tracking-tight truncate ${!isReadOnly ? 'cursor-pointer hover:text-[#6C5DD3] transition-colors' : ''}`}
              title={checklist.title}
            >
              {checklist.title}
            </h3>
          )}
        </div>

        {!isReadOnly && !isEditingTitle && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button 
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-[#6C5DD3] dark:hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-zinc-200/60 dark:border-white/5"
              title="Editar título del checklist"
            >
              <Edit2 size={12} />
              <span>Editar</span>
            </button>
            <button 
              type="button"
              onClick={() => onDeleteChecklist(checklist.id)}
              className="bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-zinc-200/60 dark:border-white/5"
              title="Eliminar checklist"
            >
              <Trash2 size={12} />
              <span>Eliminar</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 w-8 text-right">{progress}%</span>
        <div className="flex-1 h-2 bg-zinc-200 dark:bg-white/5 rounded overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded transition-all duration-500 ease-out ${
              progress === 100 ? 'bg-emerald-500' : 'bg-[#6C5DD3]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 group/item p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
            <div className="mt-1 relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={item.done}
                disabled={isReadOnly}
                onChange={(e) => onToggleItem(item.id, e.target.checked)}
                className={`peer w-4 h-4 accent-[#6C5DD3] rounded border-zinc-300 dark:border-white/10 transition-all bg-white dark:bg-[#1C1F26] ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              {editingItemId === item.id ? (
                <textarea
                  ref={editInputRef}
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleSaveEditItem(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEditItem(item.id);
                    }
                    if (e.key === 'Escape') setEditingItemId(null);
                  }}
                  className="w-full bg-white dark:bg-[#13151A] border border-[#6C5DD3] rounded px-2.5 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none resize-none overflow-hidden min-h-[32px] shadow-sm leading-relaxed"
                  rows={1}
                />
              ) : (
                <p 
                  onClick={() => handleStartEditItem(item)}
                  className={`text-sm text-zinc-900 dark:text-zinc-100 break-words transition-all whitespace-pre-wrap leading-relaxed py-0.5 ${
                    item.done ? 'line-through text-zinc-400 dark:text-zinc-500 opacity-70' : ''
                  } ${!isReadOnly ? 'cursor-text hover:text-[#6C5DD3]' : ''}`}
                >
                  {item.title}
                </p>
              )}
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button 
                  type="button"
                  onClick={() => handleStartEditItem(item)}
                  className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-[#6C5DD3] dark:hover:text-[#8E82E3] transition-all hover:bg-zinc-100 dark:hover:bg-white/10 rounded"
                  title="Editar elemento"
                >
                  <Edit2 size={13} />
                </button>
                <button 
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded"
                  title="Eliminar elemento"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Item Area */}
      {!isReadOnly && (
        <div className="pt-2">
          {isAddingItem ? (
            <form onSubmit={handleAddItem} className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <textarea
                ref={textareaRef}
                autoFocus
                placeholder="Añadir un elemento (Enter para añadir)..."
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
                className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-[#6C5DD3]/15 focus:border-[#6C5DD3]/40 transition-all resize-none overflow-hidden shadow-sm min-h-[44px] leading-relaxed"
                rows={1}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="bg-[#6C5DD3] text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-[#312e81] transition-colors shadow-lg shadow-[#6C5DD3]/20"
                >
                  Añadir
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="text-zinc-500 dark:text-zinc-400 text-sm font-bold hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Listo
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingItem(true)}
              className="text-sm font-bold text-zinc-500 dark:text-zinc-300 hover:text-[#6C5DD3] dark:hover:text-[#8E82E3] hover:bg-zinc-100 dark:hover:bg-white/5 px-4 py-2 rounded transition-all flex items-center gap-2 group/btn"
            >
              <span className="text-lg leading-none group-hover/btn:scale-125 transition-transform">+</span>
              Añadir un elemento
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChecklistBlock;
