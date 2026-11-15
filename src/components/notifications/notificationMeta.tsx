import React from 'react';
import {
  LuminsBellIcon,
  LuminsSparkleUpdateIcon,
  LuminsMembersIcon,
  LuminsClockIcon,
  LuminsMentionIcon,
  LuminsWarningIcon,
} from '../icons/LuminsIcons';
import { GoogleMeetIcon } from '../ui/GoogleIcons';

export interface NotificationTypeVisual {
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
  iconWrapperClass: string;
}

const DEFAULT_META: NotificationTypeVisual = {
  label: 'Aviso',
  icon: <LuminsBellIcon size={17} />,
  badgeClass: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300',
  iconWrapperClass: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-200',
};

// Registro extensible por tipo de notificación usando iconos propios de Lumins
const NOTIFICATION_TYPE_META: Record<string, NotificationTypeVisual> = {
  PRODUCT_UPDATE: {
    label: 'Novedad',
    icon: <LuminsSparkleUpdateIcon size={18} />,
    badgeClass: 'bg-[#12A9A8]/12 text-[#0f8b8a] dark:bg-[#12A9A8]/20 dark:text-[#4fd1cf]',
    iconWrapperClass: 'bg-[#12A9A8]/12 text-[#12A9A8]',
  },
  CARD_ASSIGNED: {
    label: 'Asignación',
    icon: <LuminsMembersIcon size={17} />,
    badgeClass: 'bg-[#FF665E]/12 text-[#e04c45] dark:bg-[#FF665E]/20 dark:text-[#ff8b85]',
    iconWrapperClass: 'bg-[#FF665E]/12 text-slate-700 dark:text-zinc-200',
  },
  CARD_REMINDER: {
    label: 'Recordatorio',
    icon: <LuminsClockIcon size={19} />,
    badgeClass: 'bg-[#FFCC40]/20 text-[#9c6f00] dark:bg-[#FFCC40]/20 dark:text-[#FFCC40]',
    iconWrapperClass: 'bg-[#FFCC40]/18 text-slate-700 dark:text-zinc-200',
  },
  MENTION: {
    label: 'Mención',
    icon: <LuminsMentionIcon size={17} />,
    badgeClass: 'bg-[#12A9A8]/12 text-[#0f8b8a] dark:bg-[#12A9A8]/20 dark:text-[#4fd1cf]',
    iconWrapperClass: 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-200',
  },
  SYSTEM_ALERT: {
    label: 'Alerta',
    icon: <LuminsWarningIcon size={17} />,
    badgeClass: 'bg-[#FF665E]/15 text-[#e04c45] dark:bg-[#FF665E]/20 dark:text-[#ff8b85]',
    iconWrapperClass: 'bg-[#FFCC40]/15 text-[#d99b00] dark:text-[#FFCC40]',
  },
  MEET_RSVP: {
    label: 'Google Meet',
    icon: <GoogleMeetIcon size={17} />,
    badgeClass: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    iconWrapperClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
};

export const getNotificationMeta = (type: string): NotificationTypeVisual => {
  return NOTIFICATION_TYPE_META[type] || DEFAULT_META;
};

export const formatNotificationTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Ahora';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} d`;

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: diffDays > 300 ? 'numeric' : undefined,
  });
};
