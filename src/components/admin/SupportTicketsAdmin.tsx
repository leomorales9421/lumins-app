import React, { useState, useEffect, useCallback } from 'react';
import { 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquareWarning, 
  Lightbulb, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Mail, 
  FileText, 
  Check, 
  Loader2,
  ChevronDown,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';

export interface SupportTicket {
  id: string;
  ticketCode: string;
  userId?: string | null;
  userName: string;
  userEmail: string;
  category: 'problema' | 'duda' | 'sugerencia' | 'queja';
  subject: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentType?: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SupportCounts {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  problema: {
    label: 'Problema',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    icon: <AlertCircle size={14} />,
  },
  duda: {
    label: 'Duda',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: <HelpCircle size={14} />,
  },
  sugerencia: {
    label: 'Sugerencia',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    icon: <Lightbulb size={14} />,
  },
  queja: {
    label: 'Queja',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: <MessageSquareWarning size={14} />,
  },
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  open: {
    label: 'Abierto',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  in_progress: {
    label: 'En Proceso',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  resolved: {
    label: 'Resuelto',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  closed: {
    label: 'Cerrado',
    badge: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
    dot: 'bg-zinc-400',
  },
};

export const SupportTicketsAdmin: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState<SupportCounts>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'problema' | 'duda' | 'sugerencia' | 'queja'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{
        success: boolean;
        data: {
          tickets: SupportTicket[];
          counts: SupportCounts;
          pagination: { totalPages: number; page: number; totalCount: number };
        };
      }>('/api/support/tickets', {
        params: {
          status: statusFilter,
          category: categoryFilter,
          search: searchTerm,
          page,
          limit: 15,
        },
      });

      if (res.data) {
        setTickets(res.data.tickets || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      toast.error('Error al cargar los tickets de soporte');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchTerm, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      const res = await apiClient.patch<{
        success: boolean;
        data: { ticket: SupportTicket };
      }>(
        `/api/support/tickets/${ticketId}/status`,
        { status: newStatus }
      );
      const updated = res.data?.ticket;
      if (updated) {
        setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(updated);
        }
        toast.success(`Estado del ticket ${updated.ticketCode} actualizado`);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setSavingNotes(true);
    try {
      const res = await apiClient.patch<{
        success: boolean;
        data: { ticket: SupportTicket };
      }>(
        `/api/support/tickets/${selectedTicket.id}/status`,
        { 
          status: selectedTicket.status,
          adminNotes: adminNotes.trim(),
        }
      );
      const updated = res.data?.ticket;
      if (updated) {
        setSelectedTicket(updated);
        setTickets(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        toast.success('Notas guardadas correctamente');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const openTicketDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.adminNotes || '');
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#6C5DD3] font-bold text-xs uppercase tracking-widest mb-1">
              <HelpCircle size={16} />
              Soporte y Atención al Usuario
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Gestión de Tickets de Soporte
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Revisa problemas técnicos, quejas, dudas y sugerencias reportadas por los usuarios.
            </p>
          </div>
          <button
            onClick={() => fetchTickets()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* KPI metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-100 dark:border-white/5">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              <span>Total Tickets</span>
              <FileText size={16} className="text-zinc-400" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {counts.total}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-500/10">
            <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
              <span>Abiertos</span>
              <AlertCircle size={16} />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {counts.open}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/60 dark:border-blue-500/10">
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              <span>En Proceso</span>
              <Clock size={16} />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {counts.in_progress}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/10">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <span>Resueltos</span>
              <CheckCircle2 size={16} />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {counts.resolved}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-[#1C1F26] border border-zinc-200/80 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Status tabs */}
          <div className="flex overflow-x-auto gap-1 bg-zinc-100 dark:bg-[#13151A] p-1 rounded-2xl">
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(s => {
              const isActive = statusFilter === s;
              const countVal = s === 'all' ? counts.total : counts[s];
              const labelMap: Record<string, string> = {
                all: 'Todos',
                open: 'Abiertos',
                in_progress: 'En Proceso',
                resolved: 'Resueltos',
                closed: 'Cerrados',
              };

              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5
                    ${isActive 
                      ? 'bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-zinc-100 shadow-xs' 
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}
                  `}
                >
                  <span>{labelMap[s]}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]' : 'bg-zinc-200/60 dark:bg-white/5 text-zinc-500'}`}>
                    {countVal}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-center">
            {/* Category selector */}
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value as any); setPage(1); }}
              className="w-full sm:w-auto py-2 px-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              <option value="problema">Problemas / Errores</option>
              <option value="duda">Dudas o Consultas</option>
              <option value="sugerencia">Sugerencias</option>
              <option value="queja">Quejas o Reclamos</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                placeholder="Buscar ticket, usuario..."
                className="w-full py-2 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {loading && tickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 size={24} className="animate-spin text-[#6C5DD3]" />
            <p className="text-xs font-bold text-zinc-400">Cargando tickets de soporte...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.01]">
            <CheckCircle2 size={32} className="text-zinc-300 dark:text-zinc-600" />
            <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              No hay tickets en este estado
            </div>
            <p className="text-xs text-zinc-400 max-w-sm">
              No se encontraron solicitudes que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-white/5 text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Asunto & Mensaje</th>
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-xs">
                {tickets.map(ticket => {
                  const cat = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG.duda;
                  const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  const dateStr = new Date(ticket.createdAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr 
                      key={ticket.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => openTicketDetail(ticket)}
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {ticket.ticketCode}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${cat.badge}`}>
                          {cat.icon}
                          <span>{cat.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                          <span className="truncate">{ticket.subject}</span>
                          {ticket.attachmentUrl && (
                            <span title={ticket.attachmentName || 'Contiene archivo adjunto'} className="shrink-0 text-[#6C5DD3] bg-[#6C5DD3]/10 p-0.5 rounded">
                              <Paperclip size={12} />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {ticket.message}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">
                          {ticket.userName}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {ticket.userEmail}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={ticket.status}
                            disabled={updatingId === ticket.id}
                            onChange={e => handleUpdateStatus(ticket.id, e.target.value)}
                            className={`
                              appearance-none py-1 pl-2.5 pr-7 rounded-lg text-[10px] font-extrabold border outline-none cursor-pointer
                              ${st.badge}
                            `}
                          >
                            <option value="open">Abierto</option>
                            <option value="in_progress">En Proceso</option>
                            <option value="resolved">Resuelto</option>
                            <option value="closed">Cerrado</option>
                          </select>
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openTicketDetail(ticket);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-[#6C5DD3] hover:bg-[#6C5DD3]/10 transition-colors"
                        >
                          Ver Detalle &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5 text-xs">
            <span className="text-zinc-400">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-white/10 font-bold disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-white/10 font-bold disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-white dark:bg-[#1C1F26] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${CATEGORY_CONFIG[selectedTicket.category]?.badge}`}>
                  {CATEGORY_CONFIG[selectedTicket.category]?.icon}
                  <span>{CATEGORY_CONFIG[selectedTicket.category]?.label}</span>
                </span>
                <span className="text-sm font-mono font-bold text-zinc-500">
                  {selectedTicket.ticketCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
              {/* Title & Info */}
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                  {selectedTicket.subject}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                  <span>Enviado por: <strong className="text-zinc-700 dark:text-zinc-200">{selectedTicket.userName}</strong></span>
                  <span>·</span>
                  <a 
                    href={`mailto:${selectedTicket.userEmail}?subject=Re: [${selectedTicket.ticketCode}] ${selectedTicket.subject}`}
                    className="text-[#6C5DD3] dark:text-[#A599F9] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Mail size={12} />
                    {selectedTicket.userEmail}
                  </a>
                  <span>·</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString('es-ES')}</span>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                  Mensaje del usuario
                </label>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Archivo adjunto */}
              {selectedTicket.attachmentUrl && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                    Archivo Adjunto
                  </label>
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedTicket.attachmentType?.startsWith('image/') ? (
                        <img 
                          src={selectedTicket.attachmentUrl} 
                          alt={selectedTicket.attachmentName || 'Captura'} 
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-white/10 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(selectedTicket.attachmentUrl!, '_blank')}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center shrink-0">
                          <Paperclip size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          {selectedTicket.attachmentName || 'archivo_adjunto'}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {selectedTicket.attachmentSize ? `${(selectedTicket.attachmentSize / 1024).toFixed(1)} KB` : 'Adjunto'}
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedTicket.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                    >
                      <ExternalLink size={13} />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Status Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                  Cambiar Estado del Ticket
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['open', 'in_progress', 'resolved', 'closed'] as const).map(stKey => {
                    const cfg = STATUS_CONFIG[stKey];
                    const isCurrent = selectedTicket.status === stKey;

                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => handleUpdateStatus(selectedTicket.id, stKey)}
                        disabled={updatingId === selectedTicket.id}
                        className={`
                          py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all
                          ${isCurrent 
                            ? `${cfg.badge} border-2 shadow-xs ring-2 ring-current/10` 
                            : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-[#13151A]'}
                        `}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                  Notas Internas de Administración (Solo visible por Super Admins)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Escribe notas sobre la resolución, seguimiento o llamada con el usuario..."
                  rows={3}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none resize-none"
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-4 py-1.5 rounded-lg bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {savingNotes ? 'Guardando...' : 'Guardar Notas'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
              <a
                href={`mailto:${selectedTicket.userEmail}?subject=Re: [${selectedTicket.ticketCode}] ${encodeURIComponent(selectedTicket.subject)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white text-xs font-extrabold shadow-md shadow-[#6C5DD3]/20 transition-all active:scale-95"
              >
                <Mail size={14} />
                <span>Responder por Correo al Usuario</span>
              </a>

              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketsAdmin;

