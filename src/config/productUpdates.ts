export interface ReleaseHighlight {
  title: string;
  description: string;
  tag?: string;
  iconName?:
    | 'calendar'
    | 'mail'
    | 'download'
    | 'sparkles'
    | 'smartphone'
    | 'shield'
    | 'video'
    | 'palette';
}

export interface ProductRelease {
  id: string;
  version: string;
  releaseDate: string;
  publishedAt: string; // ISO-8601 para calcular ventana de 3 días y orden cronológico
  badge: string;
  badgeColor?: 'purple' | 'emerald' | 'blue' | 'amber';
  title: string;
  subtitle: string;
  highlights: ReleaseHighlight[];
  ctaText?: string;
  ctaUrl?: string;
  ctaAction?: 'onboarding' | 'navigate';
}

/**
 * REGISTRO CENTRAL DE NOVEDADES Y MEJORAS DE LUMINS
 */
export const PRODUCT_RELEASES: ProductRelease[] = [
  {
    id: 'release-lumins-v2',
    version: 'v2.0.0',
    releaseDate: 'Noviembre 2026',
    publishedAt: '2026-11-14T00:00:00-04:00',
    badge: 'Lumins V2 · Nueva Identidad',
    badgeColor: 'emerald',
    title: 'Lumins V2: Identidad Renovada, Google Meet, Permisos Avanzados y Más',
    subtitle:
      'Estrenamos refrescamiento gráfico con iconografía propia Lumins y mejoras clave para planificar, personalizar tu entorno y trabajar con mayor armonía.',
    highlights: [
      {
        iconName: 'video',
        tag: 'Reuniones',
        title: 'Integración con Google Meet en Tarjetas y Calendario',
        description:
          'Agenda videollamadas de Google Meet directamente desde cualquier tarjeta o desde la vista de Calendario, con enlaces automáticos e invitados sincronizados.',
      },
      {
        iconName: 'shield',
        tag: 'Seguridad',
        title: 'Módulo de Permisos Avanzados',
        description:
          'Control granular sobre quién puede ver, editar o administrar tableros y espacios de trabajo, manteniendo cada entorno protegido según la jerarquía del equipo.',
      },
      {
        iconName: 'palette',
        tag: 'Personalización',
        title: 'Contrastes y Posición del Menú Configurables',
        description:
          'Adapta Lumins a tu flujo de trabajo eligiendo entre barra superior o menú lateral, ajustando tema claro/oscuro y colores de acento con mejor contraste.',
      },
      {
        iconName: 'sparkles',
        tag: 'Experiencia V2',
        title: 'Mayor Armonía de Navegación Interna',
        description:
          'Iconografía propia multicolor, transiciones fluidas entre módulos, centro de notificaciones en tiempo real y una interfaz más limpia en cada pantalla.',
      },
    ],
    ctaText: 'Probar novedades (Tour guiado)',
    ctaAction: 'onboarding',
  },
  {
    id: 'release-2026-11-calendar-and-notifications-v2',
    version: 'v1.9.0',
    releaseDate: 'Octubre 2026',
    publishedAt: '2026-10-15T00:00:00-04:00',
    badge: 'Actualización Anterior',
    badgeColor: 'blue',
    title: 'Calendario Ejecutivo, Exportaciones y Notificaciones Inteligentes',
    subtitle:
      'Planificación ejecutiva en Lumins con 5 vistas, exportación directa y resúmenes inteligentes.',
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
          'Genera documentos ejecutivos en PDF apaisado A4 con membrete corporativo y métricas, además de capturas Retina y planillas CSV.',
      },
      {
        iconName: 'mail',
        tag: 'Automatización',
        title: 'Notificaciones y Resumen Diario Inteligente',
        description:
          'Avisos cuando te asignan tareas, recordatorios de vencimiento con 24h de anticipación y un resumen matinal sin spam.',
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
    ctaAction: 'navigate',
  },
];

export const LATEST_RELEASE = PRODUCT_RELEASES[0];
