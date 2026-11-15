import React, { useState, useEffect } from 'react';
import LuminsLogoLoader from './ui/LuminsLogoLoader';
import { format, parseISO } from 'date-fns';
import {
  X,
  ArrowLeft,
  Users,
  Mail,
  Plus,
  Check,
  Shield,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api-client';
import { GoogleMeetIcon } from './ui/GoogleIcons';
import TimeSelector12h from './TimeSelector12h';
import { formatTime12h, parseTime12h } from '../lib/calendar-utils';
import UserAvatar from './ui/UserAvatar';

export interface CardMeetingAssignee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export type MeetRsvpStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction';

export interface CardMeetingData {
  meetUrl: string;
  googleEventId?: string | null;
  calendarId?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  inviteAssignees: boolean;
  invitedAssigneeIds: string[];
  invitedAssignees: CardMeetingAssignee[];
  externalGuests: string[];
  attendeeStatuses?: Record<string, MeetRsvpStatus>;
  hideInternalDetails: boolean;
  agendaNote?: string | null;
  organizerUserId: string;
  organizerName?: string;
  organizerEmail?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW';
  completedAt?: string | null;
  completedByUserId?: string | null;
  completedByName?: string | null;
  rescheduledCount?: number;
  updatedAt: string;
}

const RSVP_BADGE_MAP: Record<MeetRsvpStatus, { label: string; className: string }> = {
  accepted: {
    label: 'Confirmado',
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  },
  declined: {
    label: 'Rechazado',
    className: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25',
  },
  tentative: {
    label: 'Tal vez',
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  needsAction: {
    label: 'Pendiente',
    className: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-zinc-400 border-slate-200 dark:border-white/10',
  },
};

interface GoogleMeetScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardTitle: string;
  defaultDate?: string | null;
  assignees: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }>;
  existingMeeting?: CardMeetingData | null;
  onScheduled: (meetingData: CardMeetingData | null) => void;
  backLabel?: string;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GoogleMeetScheduleModal: React.FC<GoogleMeetScheduleModalProps> = ({
  isOpen,
  onClose,
  cardId,
  cardTitle,
  defaultDate,
  assignees,
  existingMeeting,
  onScheduled,
  backLabel,
}) => {
  const navigate = useNavigate();
  const [isMeetGloballyDisabled, setIsMeetGloballyDisabled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    apiClient
      .get<{ data: { integrations?: { googleMeet?: boolean } } }>('/api/system/settings/public')
      .then((res) => {
        setIsMeetGloballyDisabled(res?.data?.integrations?.googleMeet === false);
      })
      .catch(() => {});
  }, [isOpen]);

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isMeetConnected, setIsMeetConnected] = useState(false);
  const [canQuickLink, setCanQuickLink] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | undefined>();
  const [isActivatingQuickLink, setIsActivatingQuickLink] = useState(false);

  const getNextQuarterHour = (base = new Date()) => {
    const d = new Date(base);
    const nextQuarter = Math.floor(d.getMinutes() / 15) * 15 + 15;
    d.setMinutes(nextQuarter, 0, 0);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      time12h: formatTime12h(d) || '12:00 PM',
    };
  };

  const [dateStr, setDateStr] = useState<string>(() => {
    const fallback = getNextQuarterHour();
    if (existingMeeting?.scheduledStart) {
      try {
        const d = parseISO(existingMeeting.scheduledStart);
        if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
      } catch {}
    }
    if (defaultDate) {
      try {
        const d = parseISO(defaultDate);
        if (!isNaN(d.getTime())) {
          const formatted = format(d, 'yyyy-MM-dd');
          return formatted >= fallback.dateStr ? formatted : fallback.dateStr;
        }
      } catch {}
    }
    return fallback.dateStr;
  });

  const [startTime12h, setStartTime12h] = useState<string>(() => {
    if (existingMeeting?.scheduledStart) {
      try {
        const d = parseISO(existingMeeting.scheduledStart);
        if (!isNaN(d.getTime())) return formatTime12h(d) || getNextQuarterHour().time12h;
      } catch {}
    }
    if (defaultDate) {
      try {
        const d = parseISO(defaultDate);
        if (!isNaN(d.getTime()) && d.getTime() > Date.now()) {
          return formatTime12h(d) || getNextQuarterHour().time12h;
        }
      } catch {}
    }
    return getNextQuarterHour().time12h;
  });

  const [durationMinutes, setDurationMinutes] = useState<number>(
    existingMeeting?.durationMinutes || 45
  );

  const [inviteAssignees, setInviteAssignees] = useState<boolean>(
    existingMeeting ? existingMeeting.inviteAssignees : true
  );

  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(() => {
    if (existingMeeting?.invitedAssigneeIds) {
      return existingMeeting.invitedAssigneeIds;
    }
    return assignees.map(a => a.id);
  });

  const [externalGuests, setExternalGuests] = useState<string[]>(
    existingMeeting?.externalGuests || []
  );
  const [guestEmailInput, setGuestEmailInput] = useState('');

  const [hideInternalDetails, setHideInternalDetails] = useState<boolean>(
    existingMeeting ? existingMeeting.hideInternalDetails : false
  );

  const [agendaNote, setAgendaNote] = useState<string>(existingMeeting?.agendaNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    checkMeetIntegration();
    if (!existingMeeting) {
      const nextSlot = getNextQuarterHour();
      if (defaultDate) {
        try {
          const d = parseISO(defaultDate);
          if (!isNaN(d.getTime()) && d.getTime() > Date.now()) {
            setDateStr(format(d, 'yyyy-MM-dd'));
            setStartTime12h(formatTime12h(d) || nextSlot.time12h);
            return;
          }
        } catch {}
      }
      setDateStr(nextSlot.dateStr);
      setStartTime12h(nextSlot.time12h);
    }
  }, [isOpen]);

  useEffect(() => {
    if (existingMeeting) {
      try {
        const d = parseISO(existingMeeting.scheduledStart);
        if (!isNaN(d.getTime())) {
          setDateStr(format(d, 'yyyy-MM-dd'));
          setStartTime12h(formatTime12h(d) || '10:00 AM');
        }
      } catch {}
      setDurationMinutes(existingMeeting.durationMinutes || 45);
      setInviteAssignees(existingMeeting.inviteAssignees);
      setSelectedAssigneeIds(existingMeeting.invitedAssigneeIds || []);
      setExternalGuests(existingMeeting.externalGuests || []);
      setHideInternalDetails(existingMeeting.hideInternalDetails);
      setAgendaNote(existingMeeting.agendaNote || '');
    } else {
      setSelectedAssigneeIds(assignees.map(a => a.id));
    }
  }, [existingMeeting, assignees]);

  const checkMeetIntegration = async () => {
    try {
      setIsCheckingStatus(true);
      const res: any = await apiClient.get('/api/integrations/google-meet/status');
      const payload = res?.status !== undefined ? res : res?.data;
      if (payload?.status) {
        setIsMeetConnected(Boolean(payload.status.connected));
        setCanQuickLink(Boolean(payload.status.canQuickLinkFromCalendar));
        setConnectedEmail(payload.status.accountEmail);
      }
    } catch {
      setIsMeetConnected(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleQuickActivate = async () => {
    try {
      setIsActivatingQuickLink(true);
      const res: any = await apiClient.post('/api/integrations/google-meet/quick-link');
      const payload = res?.success !== undefined ? res : res?.data;
      if (payload?.success) {
        setIsMeetConnected(true);
        setConnectedEmail(payload.accountEmail);
        toast.success('¡Google Meet activado!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo activar Google Meet');
    } finally {
      setIsActivatingQuickLink(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddExternalGuest = () => {
    const raw = guestEmailInput.trim().toLowerCase();
    if (!raw) return;

    const parts = raw
      .split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const validNew: string[] = [];
    for (const email of parts) {
      if (!EMAIL_REGEX.test(email)) {
        toast.error(`El correo "${email}" no tiene un formato válido`);
        return;
      }
      if (!externalGuests.includes(email) && !validNew.includes(email)) {
        validNew.push(email);
      }
    }

    if (validNew.length > 0) {
      const next = [...externalGuests, ...validNew];
      setExternalGuests(next);
      if (externalGuests.length === 0) {
        setHideInternalDetails(true);
      }
    }
    setGuestEmailInput('');
  };

  const handleGuestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddExternalGuest();
    }
  };

  const handleRemoveExternalGuest = (email: string) => {
    setExternalGuests(prev => prev.filter(item => item !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-add any pending typed email before submitting
    let finalExternalGuests = [...externalGuests];
    if (guestEmailInput.trim()) {
      const candidate = guestEmailInput.trim().toLowerCase();
      if (!EMAIL_REGEX.test(candidate)) {
        toast.error(`El correo "${candidate}" no es válido`);
        return;
      }
      if (!finalExternalGuests.includes(candidate)) {
        finalExternalGuests.push(candidate);
      }
      setGuestEmailInput('');
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) {
      toast.error('Selecciona una fecha válida para la reunión');
      return;
    }

    const parsedTime = parseTime12h(startTime12h) || { hours: 10, minutes: 0 };
    const startDateObj = new Date(y, m - 1, d, parsedTime.hours, parsedTime.minutes, 0, 0);

    if (startDateObj.getTime() < Date.now() - 60_000) {
      toast.error('No puedes agendar una reunión en una fecha u hora pasada.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res: any = await apiClient.post(
        `/api/integrations/google-meet/cards/${cardId}/schedule`,
        {
          scheduledStart: startDateObj.toISOString(),
          durationMinutes,
          inviteAssignees,
          invitedAssigneeIds: inviteAssignees ? selectedAssigneeIds : [],
          externalGuests: finalExternalGuests,
          hideInternalDetails,
          agendaNote,
        }
      );

      const payload = res?.data || res;
      const meetingData = payload?.meetingData || payload?.data?.meetingData;
      const totalInvited =
        (inviteAssignees ? selectedAssigneeIds.length : 0) + finalExternalGuests.length;

      toast.success(
        existingMeeting ? 'Reunión de Google Meet actualizada' : '¡Google Meet agendado!',
        {
          description:
            totalInvited > 0
              ? `Se enviaron invitaciones de calendario a ${totalInvited} participante${
                  totalInvited === 1 ? '' : 's'
                }.`
              : 'El enlace de la videollamada ha sido añadido a la tarjeta.',
        }
      );

      onScheduled(meetingData);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al agendar la reunión de Google Meet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMeet = async () => {
    setIsRemoving(true);
    try {
      await apiClient.delete(`/api/integrations/google-meet/cards/${cardId}`);
      toast.success('Reunión de Google Meet desvinculada de la tarjeta');
      onScheduled(null);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar la reunión');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-[#1C1F26] rounded-t-[28px] sm:rounded-2xl shadow-2xl border-t sm:border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div
          className="sm:hidden w-full flex items-center justify-center pt-2.5 pb-0.5 bg-zinc-50/60 dark:bg-black/20 shrink-0 cursor-pointer"
          onClick={onClose}
        >
          <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/60 dark:bg-black/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {backLabel && (
              <button
                type="button"
                onClick={onClose}
                title={backLabel}
                className="p-1.5 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#13151A] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
              <GoogleMeetIcon size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                {existingMeeting ? 'Configurar Google Meet' : 'Agendar Google Meet'}
              </h3>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                {cardTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {isMeetGloballyDisabled ? (
          <div className="p-7 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF665E]/12 text-[#FF665E] flex items-center justify-center mx-auto">
              <GoogleMeetIcon size={24} />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                Google Meet deshabilitado
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                El administrador de la plataforma deshabilitó temporalmente la programación de reuniones con Google Meet.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : isCheckingStatus ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <LuminsLogoLoader size="xs" />
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Verificando conexión con Google Meet...
            </p>
          </div>
        ) : !isMeetConnected ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <GoogleMeetIcon size={28} />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                Vincula tu cuenta de Google Meet
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Para generar enlaces de videollamada e invitar a asignados o correos externos automáticamente, activa Google Meet en tus integraciones.
              </p>
            </div>

            <div className="flex items-center justify-center pt-2">
              {canQuickLink ? (
                <button
                  type="button"
                  onClick={handleQuickActivate}
                  disabled={isActivatingQuickLink}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {isActivatingQuickLink ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <GoogleMeetIcon size={15} />
                  )}
                  <span>Activar Google Meet</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/settings/integrations');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all whitespace-nowrap cursor-pointer"
                >
                  <GoogleMeetIcon size={15} />
                  <span>Vincular Google Meet</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
            {existingMeeting?.meetUrl && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Sala activa
                  </span>
                  <a
                    href={existingMeeting.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline truncate block"
                  >
                    {existingMeeting.meetUrl}
                  </a>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(existingMeeting.meetUrl);
                      toast.success('Enlace de Google Meet copiado');
                    }}
                    className="p-2 rounded-lg bg-white/80 dark:bg-black/30 text-zinc-700 dark:text-zinc-200 hover:bg-white transition-colors"
                    title="Copiar enlace"
                  >
                    <Copy size={13} />
                  </button>
                  <a
                    href={existingMeeting.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <span>Unirse</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {/* 1. Date, Time & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  <CalendarIcon size={11} /> Fecha
                </label>
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={dateStr}
                  onChange={e => {
                    const nextDate = e.target.value;
                    setDateStr(nextDate);
                    const now = new Date();
                    if (nextDate === format(now, 'yyyy-MM-dd')) {
                      const parsed = parseTime12h(startTime12h);
                      const nowMins = now.getHours() * 60 + now.getMinutes();
                      if (!parsed || parsed.hours * 60 + parsed.minutes < nowMins) {
                        setStartTime12h(getNextQuarterHour(now).time12h);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-zinc-800 dark:text-zinc-200 outline-none focus:border-[#12A9A8]"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  <Clock size={11} /> Hora de inicio
                </label>
                <TimeSelector12h
                  value={startTime12h}
                  onChange={setStartTime12h}
                  direction="down"
                  className="w-full"
                  minMinutesFromMidnight={
                    dateStr === format(new Date(), 'yyyy-MM-dd')
                      ? new Date().getHours() * 60 + new Date().getMinutes()
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  <Clock size={11} /> Duración
                </label>
                <select
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-zinc-800 dark:text-zinc-200 outline-none focus:border-emerald-500"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Confirmation of Card Assignees */}
            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-[#13151A]/60 space-y-3">
              <div className="flex items-start sm:items-center justify-between gap-2.5">
                <label
                  onClick={() => setInviteAssignees(!inviteAssignees)}
                  className="flex items-start sm:items-center gap-2.5 cursor-pointer select-none min-w-0 flex-1"
                >
                  <div
                    className={`w-4 h-4 mt-0.5 sm:mt-0 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      inviteAssignees
                        ? 'bg-[#12A9A8] border-[#12A9A8] text-white'
                        : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-black/20'
                    }`}
                  >
                    {inviteAssignees && <Check size={11} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Users size={13} className="text-[#12A9A8] dark:text-[#4ED4D2] shrink-0" />
                      <span className="sm:hidden truncate">Invitar asignados</span>
                      <span className="hidden sm:inline">Invitar a los asignados de la tarjeta</span>
                    </span>
                    <span className="text-[11px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-snug">
                      <span className="sm:hidden">Elige quiénes recibirán la invitación</span>
                      <span className="hidden sm:inline">Confirma quiénes del equipo asignado recibirán invitación a esta reunión</span>
                    </span>
                  </div>
                </label>

                {assignees.length > 0 && inviteAssignees && (
                  <span className="shrink-0 whitespace-nowrap text-[11px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#12A9A8]/12 border border-[#12A9A8]/25 text-[#0E8786] dark:text-[#4ED4D2] tabular-nums">
                    {selectedAssigneeIds.length}/{assignees.length}
                    <span className="hidden sm:inline"> seleccionados</span>
                  </span>
                )}
              </div>

              {assignees.length === 0 ? (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic pl-6">
                  Esta tarjeta aún no tiene miembros asignados. Puedes agregar invitados por correo abajo.
                </p>
              ) : (
                inviteAssignees && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {assignees.map(member => {
                      const isSelected = selectedAssigneeIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => toggleAssignee(member.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-[#12A9A8]/12 border-[#12A9A8] text-[#0E8786] dark:text-[#4ED4D2] shadow-2xs'
                              : 'bg-white dark:bg-[#1C1F26] border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 opacity-65'
                          }`}
                        >
                          <UserAvatar
                            name={member.name}
                            avatarUrl={member.avatarUrl}
                            size="xs"
                          />
                          <span className="truncate max-w-[140px]">{member.name}</span>
                          {isSelected && <Check size={11} className="text-[#12A9A8] dark:text-[#4ED4D2] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* 3. External / Additional Email Guests */}
            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-[#13151A]/60 space-y-2.5">
              <div>
                <label className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Mail size={13} className="text-[#12A9A8]" />
                  Correos adicionales (Invitados externos o clientes)
                </label>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Agrega correos de personas externas que no están en el tablero para enviarles la invitación de Google Meet.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={guestEmailInput}
                  onChange={e => setGuestEmailInput(e.target.value)}
                  onKeyDown={handleGuestKeyDown}
                  placeholder="ejemplo@cliente.com (presiona Enter)"
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#12A9A8]"
                />
                <button
                  type="button"
                  onClick={handleAddExternalGuest}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#12A9A8]/10 text-[#12A9A8] dark:text-[#4ED4D2] hover:bg-[#12A9A8] hover:text-white transition-colors inline-flex items-center gap-1 shrink-0"
                >
                  <Plus size={13} />
                  <span>Agregar</span>
                </button>
              </div>

              {externalGuests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {externalGuests.map(email => {
                    const rsvp = existingMeeting?.attendeeStatuses?.[email.toLowerCase()];
                    const rsvpMeta = rsvp ? RSVP_BADGE_MAP[rsvp] : null;
                    return (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#12A9A8]/10 text-[#12A9A8] dark:text-[#4ED4D2] border border-[#12A9A8]/25"
                      >
                        <Mail size={11} />
                        <span>{email}</span>
                        {rsvpMeta && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${rsvpMeta.className}`}>
                            {rsvpMeta.label}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExternalGuest(email)}
                          className="hover:text-rose-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Privacy option when external guests are present */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => setHideInternalDetails(!hideInternalDetails)}
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                    hideInternalDetails
                      ? 'bg-[#12A9A8] border-[#12A9A8] text-white'
                      : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-black/20'
                  }`}
                >
                  {hideInternalDetails && <Check size={10} strokeWidth={3} />}
                </button>
                <div
                  onClick={() => setHideInternalDetails(!hideInternalDetails)}
                  className="cursor-pointer select-none"
                >
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1">
                    <Shield size={11} className="text-[#12A9A8]" />
                    Ocultar detalles internos del tablero en la invitación de correo
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                    Evita exponer nombres de listas, prioridades o enlaces internos a invitados externos.
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Optional Agenda Note */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 block">
                Nota o agenda para la videollamada (Opcional)
              </label>
              <textarea
                rows={2}
                value={agendaNote}
                onChange={e => setAgendaNote(e.target.value)}
                placeholder="Puntos a tratar en la sesión de Google Meet..."
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-zinc-100 dark:border-white/10 bg-white dark:bg-[#1C1F26] shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-center justify-between sm:justify-start">
                {existingMeeting ? (
                  <button
                    type="button"
                    onClick={handleRemoveMeet}
                    disabled={isRemoving || isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span>Quitar Meet</span>
                  </button>
                ) : connectedEmail ? (
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 truncate max-w-[240px]">
                    Organizador: {connectedEmail}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isRemoving}
                  className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 sm:bg-transparent dark:bg-white/5 sm:dark:bg-transparent transition-colors shrink-0"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isRemoving}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <GoogleMeetIcon size={15} />
                      <span>{existingMeeting ? 'Actualizar reunión' : 'Crear y enviar invitaciones'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GoogleMeetScheduleModal;
