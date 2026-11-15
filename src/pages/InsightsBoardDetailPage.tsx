import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  ListTodo,
  Loader2,
  Search,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import { useModuleLoading } from '../contexts/NavigationLoaderContext';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { LuminsBoardIcon, LuminsSuccessIcon } from '../components/icons/LuminsIcons';

interface CardData {
  id: string;
  title: string;
  isDone: boolean;
  status: string;
  list: { id: string; name: string };
  assignees: { user: { id: string; name: string; avatarUrl: string | null } }[];
  labels: { label: { name: string; color: string } }[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  events?: { user: { name: string; avatarUrl: string | null } }[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

export default function InsightsBoardDetailPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();

  const [cards, setCards] = useState<CardData[]>([]);
  const [boardName, setBoardName] = useState<string>('Cargando...');
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  useModuleLoading(isInitialLoading, 'insights-board-detail');
  const [isFetchingPage, setIsFetchingPage] = useState(false);

  // Server-side Filter, Sort & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'done-active' | 'done-archived' | 'archived-all'>('all');
  const [sortBy, setSortBy] = useState<'updatedDesc' | 'updatedAsc' | 'createdDesc' | 'createdAsc'>('updatedDesc');
  const [dateFilterType, setDateFilterType] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!boardId) return;
    apiClient
      .get<any>(`/api/boards/${boardId}`)
      .then((res) => {
        if (res.data?.board?.name) {
          setBoardName(res.data.board.name);
        }
      })
      .catch((error) => {
        console.error('Error fetching board name:', error);
      });
  }, [boardId]);

  const fetchCards = useCallback(async () => {
    if (!boardId) return;
    setIsFetchingPage(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        filterType,
        sortBy,
        dateFilterType,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await apiClient.get<any>(`/api/cards/boards/${boardId}/cards?${params.toString()}`);
      setCards(Array.isArray(res.data?.cards) ? res.data.cards : []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      } else {
        const list = res.data?.cards || [];
        setPagination({ page: 1, limit, total: list.length, totalPages: 1 });
      }
    } catch (error) {
      console.error('Error fetching board cards:', error);
      toast.error('Error al cargar las tareas del proyecto');
    } finally {
      setIsInitialLoading(false);
      setIsFetchingPage(false);
    }
  }, [boardId, page, limit, filterType, sortBy, dateFilterType, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const hasActiveFilters =
    filterType !== 'all' ||
    sortBy !== 'updatedDesc' ||
    Boolean(searchTerm) ||
    Boolean(startDate) ||
    Boolean(endDate);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setFilterType('all');
    setSortBy('updatedDesc');
    setDateFilterType('createdAt');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const goBack = () => {
    navigate(workspaceId ? `/w/${workspaceId}/insights` : '/insights');
  };

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6F9] dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-5 py-3">
        <div className="max-w-[1440px] mx-auto space-y-3">
          {/* Compact Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={goBack}
                title="Volver a Insights"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-[var(--lumins-accent-fg)] hover:border-[var(--lumins-accent-border)] transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 items-center justify-center shrink-0">
                <LuminsBoardIcon size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                    {boardName}
                  </h1>
                  <Badge tone="teal" variant="dot" size="sm">
                    {pagination.total} {pagination.total === 1 ? 'tarea' : 'tareas'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  Detalle de tareas del proyecto · Paginación en servidor
                </p>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#FF665E] hover:border-[#FF665E]/40 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Limpiar filtros</span>
              </button>
            )}
          </header>

          {/* Compact Filter Toolbar */}
          <div className="bg-white dark:bg-[#1C1F26] px-3.5 py-3 rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
              <div className="lg:col-span-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por título..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/90 dark:border-white/10 text-xs font-medium text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)]"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Estado
                </label>
                <Select
                  uiSize="sm"
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="all">Todas las tareas</option>
                  <option value="pending">Pendientes (Activas)</option>
                  <option value="done-active">Completadas (Activas)</option>
                  <option value="done-archived">Completadas (Archivadas)</option>
                  <option value="archived-all">Todas las archivadas</option>
                </Select>
              </div>

              <div className="lg:col-span-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Ordenar por
                </label>
                <Select
                  uiSize="sm"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="updatedDesc">Modificación (Más reciente)</option>
                  <option value="updatedAsc">Modificación (Más antigua)</option>
                  <option value="createdDesc">Creación (Más reciente)</option>
                  <option value="createdAsc">Creación (Más antigua)</option>
                </Select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Rango de fechas
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="w-28 shrink-0">
                    <Select
                      uiSize="sm"
                      value={dateFilterType}
                      onChange={(e) => {
                        setDateFilterType(e.target.value as any);
                        setPage(1);
                      }}
                    >
                      <option value="createdAt">Creación</option>
                      <option value="updatedAt">Modific.</option>
                    </Select>
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/90 dark:border-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)]"
                  />
                  <span className="text-zinc-400 text-xs font-bold">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-white dark:bg-[#13151A] border border-zinc-200/90 dark:border-white/10 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dense Architectural Task List */}
          <div className="bg-white dark:bg-[#1C1F26] rounded-xl border border-zinc-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                {pagination.total > 0
                  ? `Mostrando ${startItem}–${endItem} de ${pagination.total} resultados`
                  : '0 resultados'}
                {isFetchingPage && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--lumins-accent)]" />}
              </span>

              <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                <span className="mr-1 font-medium">Por página:</span>
                {[10, 20, 50].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setLimit(size);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      limit === size
                        ? 'text-[var(--lumins-accent-fg)] bg-[var(--lumins-accent-soft)]'
                        : 'hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {isInitialLoading ? null : cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-zinc-500">
                <ListTodo className="w-12 h-12 mb-3 opacity-25 text-[var(--lumins-accent)]" />
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No se encontraron tareas</p>
                <p className="text-xs text-zinc-400 mt-0.5">Prueba ajustando los filtros superiores</p>
              </div>
            ) : (
              <div className={`divide-y divide-zinc-100 dark:divide-white/5 transition-opacity duration-200 ${isFetchingPage ? 'opacity-60' : 'opacity-100'}`}>
                {cards.map((card) => {
                  const lastModifier = card.events?.[0]?.user || card.assignees?.[0]?.user;
                  return (
                    <div
                      key={card.id}
                      className="px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {card.isDone ? (
                            <LuminsSuccessIcon size={18} />
                          ) : (
                            <span className="w-[18px] h-[18px] rounded-md border-2 border-zinc-300 dark:border-zinc-600 block" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {card.title}
                            </h4>
                            <Badge tone="neutral" variant="dot" size="xs">
                              {card.list?.name || 'Sin lista'}
                            </Badge>
                            {card.isDone && (
                              <Badge tone="teal" variant="inline" size="xs">
                                Completada
                              </Badge>
                            )}
                            {card.status === 'closed' && (
                              <Badge tone="amber" variant="inline" size="xs">
                                Archivada
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1" title="Fecha de Creación">
                              <Calendar size={12} className="text-zinc-400" />
                              Creada: {formatDateTime(card.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1" title="Última modificación">
                              <Clock size={12} className="text-zinc-400" />
                              Modificada: {formatDateTime(card.updatedAt)}
                            </span>
                            {lastModifier && (
                              <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-300">
                                {lastModifier.avatarUrl ? (
                                  <img
                                    src={lastModifier.avatarUrl}
                                    alt={lastModifier.name}
                                    className="w-3.5 h-3.5 rounded-full object-cover"
                                  />
                                ) : (
                                  <User size={11} className="text-zinc-400" />
                                )}
                                <span className="truncate max-w-[140px]">{lastModifier.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/boards/${boardId}?cardId=${card.id}`)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--lumins-accent-fg)] hover:bg-[var(--lumins-accent-soft)] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>Ver en tablero</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Server-side Pagination Footer */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500 font-medium">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1 || isFetchingPage}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                    const p = start + i;
                    return p <= pagination.totalPages ? (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          p === pagination.page
                            ? 'bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)]'
                            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {p}
                      </button>
                    ) : null;
                  })}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages || isFetchingPage}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
