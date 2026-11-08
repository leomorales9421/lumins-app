export interface ReleaseHighlight {
  title: string;
  description: string;
  tag?: string;
  iconName?: 'calendar' | 'mail' | 'download' | 'sparkles' | 'smartphone' | 'shield';
}

export interface ProductRelease {
  id: string; // Identificador único de versión (cambiar este ID hace que se dispare para todos los usuarios)
  version: string;
  releaseDate: string;
  badge: string;
  badgeColor?: 'purple' | 'emerald' | 'blue' | 'amber';
  title: string;
  subtitle: string;
  highlights: ReleaseHighlight[];
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * REGISTRO CENTRAL DE NOVEDADES Y MEJORAS DE LUMINS
 * Para publicar una nueva actualización en el futuro:
 * 1. Agrega un nuevo objeto al inicio del arreglo `PRODUCT_RELEASES` con un nuevo `id` único.
 * 2. Automáticamente todos los usuarios que inicien sesión o refresquen verán el modal una sola vez.
 * 3. La campana de notificaciones mostrará el indicador de novedades pendientes hasta que lo revisen.
 */
export const PRODUCT_RELEASES: ProductRelease[] = [
  {
    id: 'release-2026-11-calendar-and-notifications-v2',
    version: 'v2.4.0',
    releaseDate: 'Noviembre 2026',
    badge: 'Gran Actualización',
    badgeColor: 'purple',
    title: 'Nuevo Calendario Ejecutivo, Exportaciones y Notificaciones Inteligentes',
    subtitle: 'Hemos transformado la planificación en Lumins para ofrecer una experiencia ejecutiva, rápida y sin saturación visual.',
    highlights: [
      {
        iconName: 'calendar',
        tag: 'Planificación',
        title: 'Calendario con 5 Vistas y Sincronización',
        description:
          'Planifica con vistas de Mes, Semana, Agenda, Carga de Trabajo del Equipo y Cronograma Timeline. Conéctate con Google Calendar en tiempo real o suscríbete vía iCal.',
      },
      {
        iconName: 'download',
        tag: 'Reportes',
        title: 'Exportación Directa a PDF, PNG y Excel',
        description:
          'Genera documentos ejecutivos en PDF apaisado A4 con membrete corporativo y métricas sin cuadros de diálogo molestos, además de capturas Retina y planillas CSV.',
      },
      {
        iconName: 'mail',
        tag: 'Automatización',
        title: 'Notificaciones y Resumen Diario Inteligente',
        description:
          'Avisos por correo cuando te asignan tareas, recordatorios de vencimiento con 24h de anticipación y un resumen matinal que solo se envía si hay novedades para hoy (cero spam).',
      },
      {
        iconName: 'smartphone',
        tag: 'Móvil',
        title: 'Experiencia Móvil Estilo App Nativa',
        description:
          'Navegación compacta y tarjetas interactivas adaptadas para smartphones y tablets sin columnas recortadas.',
      },
    ],
    ctaText: 'Explorar el Calendario',
    ctaUrl: '/calendar',
  },
];

export const LATEST_RELEASE = PRODUCT_RELEASES[0];

