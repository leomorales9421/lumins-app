import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

/**
 * Tableros: 3 columnas Kanban con proporciones redondeadas inspiradas en el logo Lumins
 */
export const LuminsBoardIcon: React.FC<IconProps> = ({ size = 18, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect
      x="3"
      y="4"
      width="4.5"
      height="10"
      rx="2"
      fill={active ? 'currentColor' : '#FF665E'}
      fillOpacity={active ? 0.85 : 0.9}
    />
    <rect
      x="9.75"
      y="4"
      width="4.5"
      height="16"
      rx="2"
      fill={active ? 'currentColor' : '#12A9A8'}
    />
    <rect
      x="16.5"
      y="4"
      width="4.5"
      height="13"
      rx="2"
      fill={active ? 'currentColor' : '#FFCC40'}
      fillOpacity={active ? 0.9 : 0.95}
    />
  </svg>
);

/**
 * Calendario: Cuadrícula suave con cabecera Coral/Turquesa y día destacado
 */
export const LuminsCalendarIcon: React.FC<IconProps> = ({ size = 18, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect
      x="3.5"
      y="5"
      width="17"
      height="15.5"
      rx="3.5"
      stroke="currentColor"
      strokeWidth="1.9"
    />
    <path
      d="M3.5 9.5H20.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path d="M8 3.2V6.2" stroke={active ? 'currentColor' : '#FF665E'} strokeWidth="2.1" strokeLinecap="round" />
    <path d="M16 3.2V6.2" stroke={active ? 'currentColor' : '#12A9A8'} strokeWidth="2.1" strokeLinecap="round" />
    <rect
      x="7.5"
      y="12.5"
      width="4"
      height="4"
      rx="1.2"
      fill={active ? 'currentColor' : '#FFCC40'}
    />
    <circle cx="15.5" cy="14.5" r="1.3" fill={active ? 'currentColor' : '#12A9A8'} />
  </svg>
);

/**
 * Actividad: Pulso fluido con nodos de acento
 */
export const LuminsActivityIcon: React.FC<IconProps> = ({ size = 18, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 13H6.8L9.5 6.5L13.8 17.5L16.8 11.5L18.5 13H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.5" cy="6.5" r="2" fill={active ? 'currentColor' : '#FF665E'} />
    <circle cx="13.8" cy="17.5" r="2" fill={active ? 'currentColor' : '#12A9A8'} />
  </svg>
);

/**
 * Insights: Barras ascendentes redondeadas (guiño directo al logo oficial)
 */
export const LuminsInsightsIcon: React.FC<IconProps> = ({ size = 18, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect
      x="3.5"
      y="13.5"
      width="4.2"
      height="6.5"
      rx="1.8"
      fill={active ? 'currentColor' : '#FF665E'}
      fillOpacity={active ? 0.85 : 1}
    />
    <rect
      x="9.9"
      y="8.5"
      width="4.2"
      height="11.5"
      rx="1.8"
      fill={active ? 'currentColor' : '#12A9A8'}
    />
    <rect
      x="16.3"
      y="4"
      width="4.2"
      height="16"
      rx="1.8"
      fill={active ? 'currentColor' : '#FFCC40'}
      fillOpacity={active ? 0.9 : 1}
    />
  </svg>
);

/**
 * Miembros: Siluetas geométricas suaves en duotono
 */
export const LuminsMembersIcon: React.FC<IconProps> = ({ size = 18, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="9.5" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.9" />
    <path
      d="M3.8 18.8C3.8 15.8 6.3 13.8 9.5 13.8C12.7 13.8 15.2 15.8 15.2 18.8"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <circle cx="16.8" cy="9.2" r="2.3" fill={active ? 'currentColor' : '#12A9A8'} fillOpacity={active ? 0.85 : 0.9} />
    <path
      d="M15.8 14.2C18.3 14.5 20.2 16.2 20.2 18.6"
      stroke={active ? 'currentColor' : '#FFCC40'}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Configuración: Controles deslizantes modernos y redondeados
 */
export const LuminsSettingsIcon: React.FC<IconProps> = ({ size = 18, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7.5H20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M4 12H20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M4 16.5H20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <circle cx="8.5" cy="7.5" r="2.2" fill={active ? 'currentColor' : '#12A9A8'} stroke={active ? 'currentColor' : '#12A9A8'} strokeWidth="1" />
    <circle cx="15.5" cy="12" r="2.2" fill={active ? 'currentColor' : '#FFCC40'} stroke={active ? 'currentColor' : '#FFCC40'} strokeWidth="1" />
    <circle cx="10" cy="16.5" r="2.2" fill={active ? 'currentColor' : '#FF665E'} stroke={active ? 'currentColor' : '#FF665E'} strokeWidth="1" />
  </svg>
);

/**
 * Soporte y Ayuda: Burbuja limpia con punto de acento
 */
export const LuminsSupportIcon: React.FC<IconProps> = ({ size = 18, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.9" />
    <path
      d="M9.6 9.6C9.9 8.4 10.9 7.7 12.1 7.7C13.5 7.7 14.5 8.6 14.5 9.8C14.5 11.1 13.1 11.5 12.4 12.2C12 12.6 12 13 12 13.5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.4" r="1.2" fill={active ? 'currentColor' : '#FFCC40'} />
  </svg>
);

/**
 * Cerrar sesión: Salida limpia con flecha en Coral
 */
export const LuminsLogoutIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 5.5H7.5C5.84315 5.5 4.5 6.84315 4.5 8.5V15.5C4.5 17.1569 5.84315 18.5 7.5 18.5H14"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <path
      d="M11.5 12H19.5M19.5 12L16.5 9M19.5 12L16.5 15"
      stroke="#FF665E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Éxito / Check: Squircle sólido en Turquesa Lumins con check blanco nítido y destello Ámbar
 */
export const LuminsSuccessIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="6.5" fill="var(--lumins-accent, #12A9A8)" />
    <path
      d="M7.6 12.4L10.6 15.3L16.5 9.1"
      stroke="var(--lumins-accent-on, #FFFFFF)"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Advertencia / Warning: Triángulo redondeado sólido en Ámbar Lumins con exclamación bicolor
 */
export const LuminsWarningIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.12 4.18C10.95 2.74 13.05 2.74 13.88 4.18L20.92 16.42C21.75 17.86 20.71 19.65 19.04 19.65H4.96C3.29 19.65 2.25 17.86 3.08 16.42L10.12 4.18Z"
      fill="#FFCC40"
    />
    <path d="M12 8.7V13.1" stroke="#1C1F26" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="12" cy="16.2" r="1.35" fill="#FF665E" />
  </svg>
);

/**
 * Error / Peligro: Squircle sólido en Coral Lumins con X blanca personalizada y acento Ámbar
 */
export const LuminsErrorIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="7" fill="#FF665E" />
    <path
      d="M8.8 8.8L15.2 15.2M15.2 8.8L8.8 15.2"
      stroke="#FFFFFF"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="17.8" cy="6.2" r="1.4" fill="#FFCC40" />
  </svg>
);

/**
 * Información: Squircle sólido en Turquesa Lumins con punto Ámbar y trazo blanco
 */
export const LuminsInfoIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="6.5" fill="var(--lumins-accent, #12A9A8)" />
    <circle cx="12" cy="7.8" r="1.4" fill="var(--lumins-accent-on, #FFFFFF)" />
    <path d="M12 11.4V16.6" stroke="var(--lumins-accent-on, #FFFFFF)" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * Papelera / Eliminar: Geometría limpia con acento Coral Lumins
 */
export const LuminsTrashIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 7H19.5" stroke="#FF665E" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M9.5 4.2H14.5" stroke="#FF665E" strokeWidth="1.9" strokeLinecap="round" />
    <path
      d="M7 7L7.8 18C7.9 19.1 8.8 20 9.9 20H14.1C15.2 20 16.1 19.1 16.2 18L17 7"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10.5 11V16M13.5 11V16" stroke="#FF665E" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/**
 * Espacio de Trabajo: Maletín/organización geométrica con acentos Turquesa y Amarillo
 */
export const LuminsWorkspaceIcon: React.FC<IconProps> = ({ size = 20, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.5 7V5.5C8.5 4.67 9.17 4 10 4H14C14.83 4 15.5 4.67 15.5 5.5V7"
      stroke={active ? 'currentColor' : '#12A9A8'}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <rect
      x="3.5"
      y="7"
      width="17"
      height="13"
      rx="3.5"
      stroke="currentColor"
      strokeWidth="1.9"
    />
    <path d="M3.5 12H20.5" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.4" />
    <rect
      x="10.25"
      y="10.5"
      width="3.5"
      height="3"
      rx="1"
      fill={active ? 'currentColor' : '#FFCC40'}
    />
  </svg>
);

/**
 * Candado / Privado: Geometría limpia con detalle en Turquesa/Coral
 */
export const LuminsLockIcon: React.FC<IconProps> = ({ size = 20, className = '', active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.5 10V7.5C7.5 5.01 9.51 3 12 3C14.49 3 16.5 5.01 16.5 7.5V10"
      stroke={active ? '#12A9A8' : 'currentColor'}
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <rect
      x="5"
      y="10"
      width="14"
      height="10.5"
      rx="3.2"
      fill={active ? '#12A9A8' : 'currentColor'}
      fillOpacity={active ? 0.14 : 0.06}
      stroke={active ? '#12A9A8' : 'currentColor'}
      strokeWidth="1.9"
    />
    <circle cx="12" cy="15.2" r="1.4" fill={active ? '#0E8786' : '#FF665E'} />
  </svg>
);

/**
 * Error 500 / Servidor: Bloque modular Lumins con indicador de fallo en Coral y Amarillo
 */
export const LuminsServerErrorIcon: React.FC<IconProps> = ({ size = 44, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="9" width="34" height="13" rx="4" fill="#12A9A8" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
    <rect x="7" y="26" width="34" height="13" rx="4" fill="#FF665E" fillOpacity="0.12" stroke="#FF665E" strokeWidth="2" />
    <circle cx="13.5" cy="15.5" r="2" fill="#12A9A8" />
    <circle cx="19.5" cy="15.5" r="2" fill="#FFCC40" />
    <path d="M26 15.5H34" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
    <circle cx="13.5" cy="32.5" r="2" fill="#FF665E" />
    <path d="M20 32.5H28" stroke="#FF665E" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 30.5L36 34.5M36 30.5L32 34.5" stroke="#E54D45" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/**
 * Error 404 / No encontrado: Tarjeta Lumins con lupa Turquesa y acento Amarillo
 */
export const LuminsNotFoundIcon: React.FC<IconProps> = ({ size = 44, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="26" height="28" rx="5" fill="#12A9A8" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" />
    <path d="M14 18H24" stroke="#FFCC40" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M14 24H20" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    <circle cx="31" cy="29" r="7.5" fill="white" className="dark:fill-[#1C1F26]" stroke="#12A9A8" strokeWidth="2.2" />
    <path d="M36.5 34.5L41 39" stroke="#12A9A8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M29 27L33 31M33 27L29 31" stroke="#FF665E" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

/**
 * Error de Red / Sin conexión: Onda geométrica con corte Coral
 */
export const LuminsNetworkErrorIcon: React.FC<IconProps> = ({ size = 44, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 21C17.8 14 30.2 14 38 21" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M15 27C20 22.4 28 22.4 33 27" stroke="#12A9A8" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="24" cy="34" r="2.6" fill="#FFCC40" />
    <path d="M12 36L36 12" stroke="#FF665E" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * Cohete / Bienvenida Lumins: Emblema sólido multicolor (Turquesa, Coral y Ámbar) sin trazos genéricos
 */
export const LuminsRocketIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Destellos orbitales Lumins */}
    <circle cx="11" cy="13" r="2" fill="#FFCC40" />
    <circle cx="38" cy="36" r="1.8" fill="#12A9A8" fillOpacity="0.55" />
    <path d="M15 9V12M13.5 10.5H16.5" stroke="#12A9A8" strokeWidth="1.8" strokeLinecap="round" />

    {/* Aletas Coral Lumins */}
    <path
      d="M18.5 23L11.5 24.5C10.3 24.8 9.8 26.2 10.6 27.1L14.5 31.2L20.5 27.5L18.5 23Z"
      fill="#FF665E"
    />
    <path
      d="M25 29.5L23.5 36.5C23.2 37.7 21.8 38.2 20.9 37.4L16.8 33.5L20.5 27.5L25 29.5Z"
      fill="#E54D45"
    />

    {/* Fuselaje Turquesa Lumins */}
    <path
      d="M17.2 24.8C21.2 16.4 28.6 10.4 39.2 8.8C37.6 19.4 31.6 26.8 23.2 30.8L17.2 24.8Z"
      fill="#12A9A8"
    />
    {/* Punta Coral / Contraste */}
    <path
      d="M32.4 10.6C34.7 9.7 37 9.1 39.2 8.8C38.9 11 38.3 13.3 37.4 15.6L32.4 10.6Z"
      fill="#FF665E"
    />

    {/* Ventana blanca con núcleo Ámbar */}
    <circle cx="29.2" cy="18.8" r="3.6" fill="#FFFFFF" />
    <circle cx="29.2" cy="18.8" r="1.8" fill="#FFCC40" />

    {/* Propulsión Ámbar Lumins */}
    <path
      d="M15.8 32.2L10.4 37.6M12.6 29.8L8.8 33.6M18.2 35.4L14.4 39.2"
      stroke="#FFCC40"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Filtro personalizado Lumins: tres líneas escalonadas con nodos Coral, Turquesa y Dorado
 */
export const LuminsFilterIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 7H20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M7 12H17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M10 17H14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <circle cx="8" cy="7" r="2" fill="#FF665E" />
    <circle cx="15" cy="12" r="2" fill="#12A9A8" />
    <circle cx="12" cy="17" r="2" fill="#FFCC40" />
  </svg>
);

/**
 * Reloj / Historial vacío Lumins: aro limpio con manecilla Turquesa y acento Coral
 */
export const LuminsClockIcon: React.FC<IconProps> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="12.5" stroke="currentColor" strokeWidth="2.1" />
    <path d="M18 11V18L22.5 21" stroke="#12A9A8" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="18" r="1.8" fill="#FF665E" />
    <circle cx="28" cy="8" r="2.2" fill="#FFCC40" />
  </svg>
);

/**
 * Campana de Notificaciones Lumins: trazo limpio con badajo Dorado y nodo Turquesa
 */
export const LuminsBellIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 8.5C18 5.46243 15.3137 3 12 3C8.68629 3 6 5.46243 6 8.5C6 12.6 4.2 14.8 3.5 16H20.5C19.8 14.8 18 12.6 18 8.5Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.6 18.2C10.15 19.4 11.02 20 12 20C12.98 20 13.85 19.4 14.4 18.2"
      stroke="#FFCC40"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
    <circle cx="17.5" cy="5.5" r="2" fill="#12A9A8" />
  </svg>
);

/**
 * Novedades Lumins: destello principal Turquesa con chispas Coral y Dorado
 */
export const LuminsSparkleUpdateIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11 3L12.75 7.75L17.5 9.5L12.75 11.25L11 16L9.25 11.25L4.5 9.5L9.25 7.75L11 3Z"
      fill="#12A9A8"
      fillOpacity="0.18"
      stroke="#12A9A8"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 14L19.4 16.1L21.5 17L19.4 17.9L18.5 20L17.6 17.9L15.5 17L17.6 16.1L18.5 14Z"
      fill="#FFCC40"
    />
    <circle cx="5.5" cy="18" r="1.6" fill="#FF665E" />
  </svg>
);

/**
 * Mención Lumins: burbuja de conversación con acentos Turquesa y Coral
 */
export const LuminsMentionIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 11.5C20 15.6421 16.4183 19 12 19C10.7 19 9.48 18.71 8.4 18.19L4.5 19.5L5.58 16.05C4.58 14.79 4 13.21 4 11.5C4 7.35786 7.58172 4 12 4C16.4183 4 20 7.35786 20 11.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="9.2" cy="11.5" r="1.3" fill="#FF665E" />
    <circle cx="12" cy="11.5" r="1.3" fill="#12A9A8" />
    <circle cx="14.8" cy="11.5" r="1.3" fill="#FFCC40" />
  </svg>
);
