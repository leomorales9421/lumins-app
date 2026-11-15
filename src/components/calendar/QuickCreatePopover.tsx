import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  Layers,
  List as ListIcon,
  Flag,
  Users,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import {
  type CalendarBoardInfo,
  type CalendarCardEvent,
  type CalendarWorkspaceMember,
  PRIORITY_COLORS,
  parseCalendarDate,
  toSafeCalendarISO,
  parseTime12h,
} from '../../lib/calendar-utils';
import { getAvatarUrl } from './CalendarCardPreviewPopover';
import { GoogleMeetIcon } from '../ui/GoogleIcons';
import TimeSelector12h from '../TimeSelector12h';

interface QuickCreatePopoverProps {
  workspaceId: string;
  initialStartDate: Date;
  initialDueDate?: Date;
  boards: CalendarBoardInfo[];
  members: CalendarWorkspaceMember[];
  onClose: () => void;
  onCreated: (newEvent: CalendarCardEvent) => void;
}

const STORAGE_LAST_BOARD_PREFIX = 'lumins_cal_last_board:';

const QuickCreatePopover: React.FC<QuickCreatePopoverProps> = ({
  workspaceId,
  initialStartDate,
  initialDueDate,
  boards,
  members,
  onClose,
  onCreated,
}) => {
  const editableBoards = boards.filter(b => b.canEdit && (b.lists?.length || 0) > 0);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [boardId, setBoardId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_LAST_BOARD_PREFIX}${workspaceId}`);
      if (saved && editableBoards.some(b => b.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return editableBoards[0]?.id || '';
  });

  const selectedBoard = editableBoards.find(b => b.id === boardId) || editableBoards[0];
  const availableLists = selectedBoard?.lists || [];

  const [listId, setListId] = useState<string>(() => availableLists[0]?.id || '');
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [startDateStr, setStartDateStr] = useState<string>(() =>
    format(initialStartDate, 'yyyy-MM-dd')
  );
  const [dueDateStr, setDueDateStr] = useState<string>(() =>
    format(initialDueDate || initialStartDate, 'yyyy-MM-dd')
  );
  const [useStartDate, setUseStartDate] = useState<boolean>(() => {
    if (!initialDueDate) return false;
    return format(initialStartDate, 'yyyy-MM-dd') !== format(initialDueDate, 'yyyy-MM-dd');
  });
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [includeMeet, setIncludeMeet] = useState<boolean>(false);
  const [meetTime12h, setMeetTime12h] = useState<string>('10:00 AM');
  const [meetDuration, setMeetDuration] = useState<number>(45);
  const [inviteAssigneesToMeet, setInviteAssigneesToMeet] = useState<boolean>(true);
  const [externalMeetGuests, setExternalMeetGuests] = useState<string[]>([]);
  const [guestEmailInput, setGuestEmailInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const board = editableBoards.find(b => b.id === boardId);
    if (board && board.lists && board.lists.length > 0) {
      if (!board.lists.some(l => l.id === listId)) {
        setListId(board.lists[0].id);
      }
    } else {
      setListId('');
    }
  }, [boardId, editableBoards, listId]);

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error('El título debe tener al menos 2 caracteres');
      return;
    }
    if (!selectedBoard || !listId) {
      toast.error('Selecciona un tablero y una lista destino');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedDue = parseCalendarDate(dueDateStr) || initialStartDate;
      const parsedStart = useStartDate
        ? parseCalendarDate(startDateStr) || parsedDue
        : null;

      const finalStart =
        parsedStart && parsedStart.getTime() <= parsedDue.getTime()
          ? parsedStart
          : parsedStart
          ? parsedDue
          : null;
      const finalDue =
        parsedStart && parsedStart.getTime() > parsedDue.getTime()
          ? parsedStart
          : parsedDue;

      const payload: Record<string, any> = {
        title: trimmed,
        priority,
        dueDate: toSafeCalendarISO(finalDue),
        ...(finalStart ? { startDate: toSafeCalendarISO(finalStart) } : {}),
        ...(selectedAssigneeIds.length > 0 ? { assigneeIds: selectedAssigneeIds } : {}),
      };

      const res = await apiClient.post<{
        success: boolean;
        data: { card: any };
      }>(`/api/cards/lists/${listId}/cards`, payload);

      try {
        localStorage.setItem(`${STORAGE_LAST_BOARD_PREFIX}${workspaceId}`, selectedBoard.id);
      } catch {
        // ignore
      }

      const createdCard = res.data?.card;
      let scheduledMeetingData: any = null;

      if (includeMeet && createdCard?.id) {
        const finalGuests = [...externalMeetGuests];
        if (guestEmailInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmailInput.trim())) {
          finalGuests.push(guestEmailInput.trim().toLowerCase());
        }

        try {
          const [y, m, d] = dueDateStr.split('-').map(Number);
          const parsedTime = parseTime12h(meetTime12h) || { hours: 10, minutes: 0 };
          const meetStart = new Date(y, m - 1, d, parsedTime.hours, parsedTime.minutes, 0, 0);

          const meetRes: any = await apiClient.post(
            `/api/integrations/google-meet/cards/${createdCard.id}/schedule`,
            {
              scheduledStart: meetStart.toISOString(),
              durationMinutes: meetDuration,
              inviteAssignees: inviteAssigneesToMeet,
              invitedAssigneeIds: inviteAssigneesToMeet ? selectedAssigneeIds : [],
              externalGuests: finalGuests,
              hideInternalDetails: finalGuests.length > 0,
            }
          );
          const meetPayload = meetRes?.data || meetRes;
          scheduledMeetingData =
            meetPayload?.meetingData || meetPayload?.data?.meetingData || null;
        } catch (meetErr: any) {
          toast.info(
            'Tarjeta creada. Vincula Google Meet en Configuración > Integraciones para generar la videollamada.'
          );
        }
      }

      const chosenList = availableLists.find(l => l.id === listId);
      const assignedUsers = members
        .filter(m => selectedAssigneeIds.includes(m.id))
        .map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          avatarUrl: m.avatarUrl,
        }));

      const newEvent: CalendarCardEvent = {
        id: createdCard?.id || `temp-${Date.now()}`,
        title: trimmed,
        start: finalStart ? toSafeCalendarISO(finalStart) : toSafeCalendarISO(finalDue),
        end: toSafeCalendarISO(finalDue),
        backgroundColor: selectedBoard.accentColor,
        extendedProps: {
          boardId: selectedBoard.id,
          boardName: selectedBoard.name,
          boardBackground: selectedBoard.background,
          boardAccentColor: selectedBoard.accentColor,
          listId,
          listName: chosenList?.name || createdCard?.list?.name || 'Lista',
          isDone: false,
          isDueDateDone: false,
          priority,
          blocked: false,
          blockedReason: null,
          checklistTotal: 0,
          checklistCompleted: 0,
          commentsCount: 0,
          attachmentsCount: 0,
          canEdit: true,
          labels: [],
          assignees: assignedUsers,
          startDate: finalStart ? toSafeCalendarISO(finalStart) : null,
          dueDate: toSafeCalendarISO(finalDue),
          meetingData: scheduledMeetingData,
        },
      };

      toast.success('Tarjeta creada en el calendario');
      window.dispatchEvent(new CustomEvent('lumins:card-created', { detail: { card: createdCard, newEvent } }));
      onCreated(newEvent);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear la tarjeta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#12A9A8]/12 text-[#12A9A8] dark:text-[#4ED4D2] flex items-center justify-center">
              <Plus size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Crear tarjeta rápida
              </h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Se añadirá directamente al tablero seleccionado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {editableBoards.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
              No tienes tableros con listas activas para editar
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Crea primero un tablero con al menos una lista para poder programar tarjetas desde el calendario.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
            {/* Title */}
            <div>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="¿Qué hay que hacer? (Presiona Enter para guardar)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#13161C] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#12A9A8]/30 focus:border-[#12A9A8]"
              />
            </div>

            {/* Board & List Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
                  <Layers size={11} />
                  Tablero
                </label>
                <div className="relative">
                  <select
                    value={boardId}
                    onChange={e => setBoardId(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl bg-zinc-50 dark:bg-[#13161C] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#12A9A8]"
                  >
                    {editableBoards.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1">
                  <ListIcon size={11} />
                  Lista
                </label>
                <select
                  value={listId}
                  onChange={e => setListId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl bg-zinc-50 dark:bg-[#13161C] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#12A9A8]"
                >
                  {availableLists.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-[#13161C] border border-zinc-200/70 dark:border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <CalendarIcon size={12} className="text-[#12A9A8]" />
                  Fechas programadas
                </span>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useStartDate}
                    onChange={e => setUseStartDate(e.target.checked)}
                    className="rounded border-zinc-300 text-[#12A9A8] focus:ring-[#12A9A8]"
                  />
                  Rango de varios días
                </label>
              </div>

              <div className={`grid gap-2 ${useStartDate ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {useStartDate && (
                  <div>
                    <span className="block text-[10px] font-bold text-zinc-400 mb-0.5">
                      Inicio
                    </span>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={e => setStartDateStr(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                )}
                <div>
                  <span className="block text-[10px] font-bold text-zinc-400 mb-0.5">
                    {useStartDate ? 'Vencimiento' : 'Fecha de entrega'}
                  </span>
                  <input
                    type="date"
                    value={dueDateStr}
                    onChange={e => setDueDateStr(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                <Flag size={11} />
                Prioridad
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['P0', 'P1', 'P2', 'P3'] as const).map(p => {
                  const info = PRIORITY_COLORS[p];
                  const active = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                        active
                          ? `${info.badgeClass} ring-2 ring-[#12A9A8]/25`
                          : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: info.hex }}
                      />
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignees */}
            {members.length > 0 && (
              <div>
                <label className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                  <Users size={11} />
                  Asignar a ({selectedAssigneeIds.length})
                </label>
                <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto custom-scrollbar p-1">
                  {members.map(m => {
                    const selected = selectedAssigneeIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignee(m.id)}
                        className={`inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-[11px] font-bold border transition-all ${
                          selected
                            ? 'bg-[#12A9A8]/15 border-[#12A9A8] text-[#12A9A8] dark:text-[#4ED4D2]'
                            : 'bg-zinc-50 dark:bg-white/[0.04] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                        }`}
                      >
                        <img
                          src={getAvatarUrl(m)}
                          alt={m.name}
                          style={{ borderRadius: '9999px' }}
                          className="w-4 h-4 object-cover"
                        />
                        <span className="truncate max-w-[100px]">{m.name}</span>
                        {selected && <Check size={10} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Google Meet Optional Toggle */}
            <div className="p-3 rounded-xl bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] border border-emerald-500/20 space-y-2.5">
              <label className="flex items-center justify-between gap-2 cursor-pointer select-none">
                <span className="flex items-center gap-2 text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  <GoogleMeetIcon size={15} />
                  <span>Agendar videollamada de Google Meet</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeMeet}
                  onChange={e => setIncludeMeet(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              {includeMeet && (
                <div className="space-y-2.5 pt-2 border-t border-emerald-500/15">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-400 mb-0.5">
                        Hora de inicio
                      </span>
                      <TimeSelector12h
                        value={meetTime12h}
                        onChange={setMeetTime12h}
                        direction="up"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-400 mb-0.5">
                        Duración
                      </span>
                      <select
                        value={meetDuration}
                        onChange={e => setMeetDuration(Number(e.target.value))}
                        className="w-full h-9 px-2 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                      >
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>1 hora</option>
                        <option value={90}>1.5 horas</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inviteAssigneesToMeet}
                      onChange={e => setInviteAssigneesToMeet(e.target.checked)}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      Confirmar invitación a los asignados ({selectedAssigneeIds.length})
                    </span>
                  </label>

                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-zinc-400">
                      Correos adicionales (Invitados externos)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="email"
                        value={guestEmailInput}
                        onChange={e => setGuestEmailInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const email = guestEmailInput.trim().toLowerCase();
                            if (!email) return;
                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                              toast.error('Formato de correo inválido');
                              return;
                            }
                            if (!externalMeetGuests.includes(email)) {
                              setExternalMeetGuests(prev => [...prev, email]);
                            }
                            setGuestEmailInput('');
                          }
                        }}
                        placeholder="invitado@externo.com + Enter"
                        className="flex-1 h-8 px-2.5 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const email = guestEmailInput.trim().toLowerCase();
                          if (!email) return;
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                            toast.error('Formato de correo inválido');
                            return;
                          }
                          if (!externalMeetGuests.includes(email)) {
                            setExternalMeetGuests(prev => [...prev, email]);
                          }
                          setGuestEmailInput('');
                        }}
                        className="px-2.5 h-8 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                      >
                        +
                      </button>
                    </div>
                    {externalMeetGuests.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {externalMeetGuests.map(email => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() =>
                                setExternalMeetGuests(prev => prev.filter(e => e !== email))
                              }
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || title.trim().length < 2}
                className="px-4 py-2 rounded-xl bg-[#12A9A8] hover:bg-[#0E8786] disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-[#12A9A8]/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus size={14} strokeWidth={2.5} />
                    Crear tarjeta
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickCreatePopover;

