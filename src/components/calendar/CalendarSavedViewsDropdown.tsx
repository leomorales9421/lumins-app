import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Plus, Trash2, Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { CalendarViewMode, CalendarColorBy } from '../../lib/calendar-utils';

export interface CalendarSavedView {
  id: string;
  name: string;
  view: CalendarViewMode;
  colorBy: CalendarColorBy;
  hideWeekends: boolean;
  filters: {
    board: string;
    member: string;
    status: string;
    priority: string;
    label: string;
    mine: boolean;
  };
}

interface CalendarSavedViewsDropdownProps {
  workspaceId: string;
  currentView: CalendarViewMode;
  currentColorBy: CalendarColorBy;
  currentHideWeekends: boolean;
  currentFilters: {
    board: string;
    member: string;
    status: string;
    priority: string;
    label: string;
    mine: boolean;
  };
  onApplyView: (view: CalendarSavedView) => void;
}

export const CalendarSavedViewsDropdown: React.FC<CalendarSavedViewsDropdownProps> = ({
  workspaceId,
  currentView,
  currentColorBy,
  currentHideWeekends,
  currentFilters,
  onApplyView,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<CalendarSavedView[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = `lumins_saved_views_${workspaceId}`;

  // Predefined system views
  const systemViews: CalendarSavedView[] = [
    {
      id: 'sys-all',
      name: 'Vista Completa (Todas)',
      view: 'month',
      colorBy: 'board',
      hideWeekends: false,
      filters: { board: 'all', member: 'all', status: 'all', priority: 'all', label: 'all', mine: false },
    },
    {
      id: 'sys-mine',
      name: 'Mis entregas pendientes',
      view: 'week',
      colorBy: 'priority',
      hideWeekends: false,
      filters: { board: 'all', member: 'all', status: 'pending', priority: 'all', label: 'all', mine: true },
    },
    {
      id: 'sys-critical',
      name: 'Entregas críticas (P0 - P1)',
      view: 'month',
      colorBy: 'priority',
      hideWeekends: false,
      filters: { board: 'all', member: 'all', status: 'pending', priority: 'P0', label: 'all', mine: false },
    },
  ];

  // Load custom views from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSavedViews(JSON.parse(raw));
      }
    } catch {
      setSavedViews([]);
    }
  }, [STORAGE_KEY]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSaveCurrentView = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newViewName.trim();
    if (!trimmed) return;

    const newView: CalendarSavedView = {
      id: `view-${Date.now()}`,
      name: trimmed,
      view: currentView,
      colorBy: currentColorBy,
      hideWeekends: currentHideWeekends,
      filters: { ...currentFilters },
    };

    const updated = [newView, ...savedViews];
    setSavedViews(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setActiveViewId(newView.id);
    setNewViewName('');
    setIsCreating(false);
    toast.success(`Vista "${trimmed}" guardada exitosamente`);
  };

  const handleDeleteView = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedViews.filter((v) => v.id !== id);
    setSavedViews(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (activeViewId === id) setActiveViewId(null);
    toast.info(`Vista "${name}" eliminada`);
  };

  const handleSelectView = (view: CalendarSavedView) => {
    setActiveViewId(view.id);
    onApplyView(view);
    setIsOpen(false);
    toast.success(`Vista aplicada: ${view.name}`);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Vistas guardadas del calendario"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
          activeViewId
            ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/30 text-[#6C5DD3]'
            : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300'
        }`}
      >
        <Bookmark size={13} className={activeViewId ? 'fill-[#6C5DD3]' : ''} />
        <span className="hidden sm:inline">Vistas</span>
        {activeViewId && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#6C5DD3]" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-[#1C1F26] rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 p-2 z-[130] space-y-2 text-xs"
          >
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-zinc-100 dark:border-white/5">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-400">
                Vistas Guardadas
              </span>
              {!isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="text-[11px] font-bold text-[#6C5DD3] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} />
                  Guardar actual
                </button>
              )}
            </div>

            {/* Create form */}
            {isCreating && (
              <form onSubmit={handleSaveCurrentView} className="p-2 bg-zinc-50 dark:bg-black/20 rounded-lg space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nombre de la vista..."
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="w-full bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:border-[#6C5DD3]"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-[#6C5DD3] text-white text-[11px] font-bold hover:bg-[#5b4eb8]"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {/* System Views */}
            <div className="space-y-0.5">
              <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Recomendadas
              </span>
              {systemViews.map((sv) => (
                <button
                  key={sv.id}
                  type="button"
                  onClick={() => handleSelectView(sv)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold transition-colors ${
                    activeViewId === sv.id
                      ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Sparkles size={12} className="text-amber-500 flex-shrink-0" />
                    <span className="truncate">{sv.name}</span>
                  </span>
                  {activeViewId === sv.id && <Check size={13} className="text-[#6C5DD3]" />}
                </button>
              ))}
            </div>

            {/* Custom Saved Views */}
            {savedViews.length > 0 && (
              <div className="space-y-0.5 pt-1 border-t border-zinc-100 dark:border-white/5">
                <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Mis Vistas
                </span>
                {savedViews.map((cv) => (
                  <div
                    key={cv.id}
                    onClick={() => handleSelectView(cv)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors group ${
                      activeViewId === cv.id
                        ? 'bg-[#6C5DD3]/10 text-[#6C5DD3] font-bold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate pr-1">{cv.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {activeViewId === cv.id && <Check size={13} className="text-[#6C5DD3]" />}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteView(cv.id, cv.name, e)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 p-0.5 transition-opacity"
                        title="Eliminar vista"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

