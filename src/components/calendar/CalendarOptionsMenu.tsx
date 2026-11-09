import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  Calendar as CalendarIcon,
  Printer,
  Palette,
  CalendarRange,
  RefreshCw,
  ExternalLink,
  Check,
  ChevronRight,
  Bookmark,
  Plus,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import { GoogleCalendarIcon } from '../ui/GoogleCalendarIcon';
import type { CalendarViewMode, CalendarColorBy } from '../../lib/calendar-utils';
import type { CalendarSavedView } from './CalendarSavedViewsDropdown';

interface GoogleCalendarStatus {
  connected: boolean;
  calendarName?: string;
  accountEmail?: string;
  lastSyncAt?: string | null;
}


interface CalendarOptionsMenuProps {
  workspaceId: string;
  currentView: CalendarViewMode;
  colorBy: CalendarColorBy;
  onChangeColorBy: (colorBy: CalendarColorBy) => void;
  hideWeekends: boolean;
  onToggleWeekends: () => void;
  currentFilters: {
    board: string;
    member: string;
    status: string;
    priority: string;
    label: string;
    mine: boolean;
  };
  onApplyView: (view: CalendarSavedView) => void;
  onOpenIcalModal: () => void;
  onOpenExportModal: () => void;
  onOpenLegendPopover: () => void;
  onSyncCompleted?: () => void;
}

export const CalendarOptionsMenu: React.FC<CalendarOptionsMenuProps> = ({
  workspaceId,
  currentView,
  colorBy,
  onChangeColorBy,
  hideWeekends,
  onToggleWeekends,
  currentFilters,
  onApplyView,
  onOpenIcalModal,
  onOpenExportModal,
  onOpenLegendPopover,
  onSyncCompleted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'views' | 'settings'>('all');
  const [gcalStatus, setGcalStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [isSyncingGcal, setIsSyncingGcal] = useState(false);
  const [showColorSubmenu, setShowColorSubmenu] = useState(false);

  // Saved views state
  const [savedViews, setSavedViews] = useState<CalendarSavedView[]>([]);
  const [isCreatingView, setIsCreatingView] = useState(false);
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

  useEffect(() => {
    fetchGcalStatus();
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowColorSubmenu(false);
        setIsCreatingView(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchGcalStatus = async () => {
    try {
      const res: any = await apiClient.get('/api/integrations/google-calendar/status');
      const payload = res?.status !== undefined ? res : res?.data;
      if (payload?.status) {
        setGcalStatus(payload.status);
      }
    } catch {
      setGcalStatus({ connected: false });
    }
  };

  const handleSyncGcal = async () => {
    try {
      setIsSyncingGcal(true);
      const syncUrl = workspaceId
        ? `/api/integrations/google-calendar/sync/${workspaceId}`
        : `/api/integrations/google-calendar/sync`;

      const res: any = await apiClient.post(syncUrl);
      const payload = res?.data || res;
      if (payload?.success) {
        const syncData = payload.data || payload;
        toast.success(`Google Calendar sincronizado`, {
          description: `${syncData.syncedCount ?? 0} tarjetas actualizadas.`,
        });
        fetchGcalStatus();
        onSyncCompleted?.();
      }
    } catch {
      toast.error('Error al sincronizar con Google Calendar');
    } finally {
      setIsSyncingGcal(false);
    }
  };

  const handleConnectGcal = async () => {
    try {
      const res: any = await apiClient.get('/api/integrations/google-calendar/auth-url', {
        params: { returnUrl: window.location.pathname },
      });
      const url = res?.url || res?.data?.url;
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error('Error al conectar con Google Calendar');
    }
  };

  const handleCreateView = () => {
    const trimmed = newViewName.trim();
    if (!trimmed) {
      toast.error('Ingresa un nombre para la vista');
      return;
    }

    const newView: CalendarSavedView = {
      id: `view-${Date.now()}`,
      name: trimmed,
      view: currentView,
      colorBy,
      hideWeekends,
      filters: { ...currentFilters },
    };

    const updated = [newView, ...savedViews];
    setSavedViews(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setActiveViewId(newView.id);
    setNewViewName('');
    setIsCreatingView(false);
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

  const colorLabels: Record<CalendarColorBy, string> = {
    board: 'Por Tablero',
    priority: 'Por Prioridad',
    label: 'Por Etiqueta',
    status: 'Por Estado',
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Botón Principal "Opciones" */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setShowColorSubmenu(false);
        }}
        title="Opciones, Vistas e Integraciones"
        className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
          isOpen
            ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/40 text-[#6C5DD3]'
            : 'bg-white dark:bg-[#1C1F26] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5'
        }`}
      >
        <Settings2 size={14} className={isOpen ? 'text-[#6C5DD3]' : 'text-zinc-500'} />
        <span className="hidden sm:inline">Opciones</span>
      </button>

      {/* Menú Desplegable (Anclado a la derecha con right-0 para evitar cortes en pantalla) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            className="absolute right-0 mt-1.5 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-2.5 z-[150] space-y-2.5 text-xs max-h-[82vh] overflow-y-auto custom-scrollbar"
          >
            {/* Header del Menú */}
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-zinc-100 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Settings2 size={13} className="text-[#6C5DD3]" />
                Opciones del Calendario
              </span>
            </div>

            {/* SECCIÓN 1: GOOGLE CALENDAR */}
            <div className="p-2.5 bg-zinc-50 dark:bg-black/20 rounded-xl space-y-2 border border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <GoogleCalendarIcon size={16} />
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                    Google Calendar
                  </span>
                </div>
                {gcalStatus.connected ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                ) : (
                  <span className="text-[10px] text-zinc-400 font-bold">No vinculado</span>
                )}
              </div>

              {gcalStatus.connected ? (
                <>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {gcalStatus.accountEmail}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-white/5">
                    <button
                      type="button"
                      onClick={handleSyncGcal}
                      disabled={isSyncingGcal}
                      className="text-[11px] font-bold text-[#6C5DD3] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={isSyncingGcal ? 'animate-spin' : ''} />
                      {isSyncingGcal ? 'Sincronizando...' : 'Sincronizar ahora'}
                    </button>
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-0.5"
                    >
                      Abrir <ExternalLink size={10} />
                    </a>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGcal}
                  className="w-full py-1.5 px-2 bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs"
                >
                  Vincular con Google
                </button>
              )}
            </div>

            {/* SECCIÓN 2: VISTAS GUARDADAS */}
            <div className="p-2.5 bg-zinc-50/60 dark:bg-white/[0.02] rounded-xl space-y-2 border border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-400 flex items-center gap-1">
                  <Bookmark size={12} className="text-[#6C5DD3]" />
                  Vistas Guardadas
                </span>
                {!isCreatingView && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingView(true)}
                    className="text-[10px] font-bold text-[#6C5DD3] hover:underline flex items-center gap-0.5"
                  >
                    <Plus size={11} />
                    Guardar actual
                  </button>
                )}
              </div>

              {/* Crear nueva vista input */}
              {isCreatingView && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="Nombre de la vista..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateView();
                      if (e.key === 'Escape') setIsCreatingView(false);
                    }}
                    className="flex-1 px-2 py-1 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-md text-xs font-semibold outline-none focus:border-[#6C5DD3]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateView}
                    className="p-1 rounded bg-[#6C5DD3] text-white hover:bg-[#5b4eb8]"
                    title="Guardar"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingView(false)}
                    className="p-1 rounded bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-zinc-600"
                    title="Cancelar"
                  >
                    <Plus size={12} className="rotate-45" />
                  </button>
                </div>
              )}

              {/* Lista de Vistas Predefinidas */}
              <div className="space-y-0.5">
                {systemViews.map((sv) => (
                  <button
                    key={sv.id}
                    type="button"
                    onClick={() => handleSelectView(sv)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      activeViewId === sv.id
                        ? 'bg-[#6C5DD3]/15 text-[#6C5DD3] font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles size={11} className="text-amber-500 shrink-0" />
                      <span className="truncate">{sv.name}</span>
                    </div>
                    {activeViewId === sv.id && <Check size={12} className="shrink-0 text-[#6C5DD3]" />}
                  </button>
                ))}

                {/* Vistas Personalizadas */}
                {savedViews.map((cv) => (
                  <div
                    key={cv.id}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeViewId === cv.id
                        ? 'bg-[#6C5DD3]/15 text-[#6C5DD3] font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                    }`}
                    onClick={() => handleSelectView(cv)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Bookmark size={11} className="text-[#6C5DD3] shrink-0" />
                      <span className="truncate">{cv.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {activeViewId === cv.id && <Check size={12} className="text-[#6C5DD3]" />}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteView(cv.id, cv.name, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-rose-500 transition-opacity"
                        title="Eliminar vista"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 3: EXPORTACIÓN & SINCRONIZACIÓN */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block px-2 mb-1">
                Herramientas
              </span>

              {/* Suscripción iCal */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenIcalModal();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-[#6C5DD3]" />
                  <span>Suscripción iCal (.ics)</span>
                </div>
                <span className="text-[10px] text-zinc-400">Apple/Outlook</span>
              </button>

              {/* Exportar a PDF / Imprimir */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenExportModal();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Printer size={14} className="text-zinc-500" />
                  <span>Exportar a PDF / Imprimir</span>
                </div>
              </button>
            </div>

            {/* SECCIÓN 4: VISUALIZACIÓN & PREFERENCIAS */}
            <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block px-2 mb-1">
                Visualización
              </span>

              {/* Colorear por (Submenú) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowColorSubmenu((prev) => !prev)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-amber-500" />
                    <span>Color: {colorLabels[colorBy]}</span>
                  </div>
                  <ChevronRight size={13} className={`text-zinc-400 transition-transform ${showColorSubmenu ? 'rotate-90' : ''}`} />
                </button>

                {showColorSubmenu && (
                  <div className="ml-5 pl-2 border-l border-zinc-200 dark:border-white/10 space-y-0.5 py-1">
                    {(['board', 'priority', 'label', 'status'] as CalendarColorBy[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          onChangeColorBy(mode);
                          setShowColorSubmenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between ${
                          colorBy === mode
                            ? 'text-[#6C5DD3] font-bold bg-[#6C5DD3]/10'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                        }`}
                      >
                        <span>{colorLabels[mode]}</span>
                        {colorBy === mode && <Check size={12} />}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenLegendPopover();
                      }}
                      className="w-full text-left px-2 py-1 text-[10px] font-bold text-[#6C5DD3] hover:underline"
                    >
                      Ver Leyenda de Tableros
                    </button>
                  </div>
                )}
              </div>

              {/* Toggle Fines de semana */}
              <button
                type="button"
                onClick={onToggleWeekends}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarRange size={14} className="text-zinc-500" />
                  <span>Fines de semana</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300">
                  {hideWeekends ? 'Lun–Vie' : '7 días'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

