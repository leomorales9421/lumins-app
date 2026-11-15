import type { BadgeTone } from '../components/ui/Badge';
import type { WorkspaceRole } from '../types/workspace';

export interface WorkspaceRoleMeta {
  role: WorkspaceRole;
  level: number;
  label: string;
  shortDesc: string;
  tone: BadgeTone;
  accentHex: string;
  capabilities: string[];
}

/**
 * Jerarquía oficial de roles dentro de un espacio de trabajo Lumins (de mayor a menor privilegio).
 */
export const WORKSPACE_ROLE_ORDER: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];

export const WORKSPACE_ROLE_META: Record<WorkspaceRole, WorkspaceRoleMeta> = {
  OWNER: {
    role: 'OWNER',
    level: 1,
    label: 'Propietario',
    shortDesc: 'Autoridad máxima y dueño del espacio',
    tone: 'amber',
    accentHex: '#FFCC40',
    capabilities: [
      'Acceso automático a todos los tableros (públicos y privados)',
      'Administra administradores, miembros e invitados',
      'Configura ajustes críticos y eliminación del espacio',
    ],
  },
  ADMIN: {
    role: 'ADMIN',
    level: 2,
    label: 'Administrador',
    shortDesc: 'Gestión operativa de equipo y tableros',
    tone: 'teal',
    accentHex: '#12A9A8',
    capabilities: [
      'Invita usuarios y gestiona roles de Miembro e Invitado',
      'Acceso a todos los tableros del espacio (privados por invitación)',
      'Configura parámetros generales del espacio',
    ],
  },
  MEMBER: {
    role: 'MEMBER',
    level: 3,
    label: 'Miembro',
    shortDesc: 'Colaborador con acceso estándar',
    tone: 'neutral',
    accentHex: '#64748B',
    capabilities: [
      'Crea tableros y gestiona listas, tarjetas y calendario',
      'Acceso automático a tableros visibles del espacio',
      'No puede cambiar roles ni eliminar miembros',
    ],
  },
  GUEST: {
    role: 'GUEST',
    level: 4,
    label: 'Invitado',
    shortDesc: 'Acceso limitado a tableros asignados',
    tone: 'coral',
    accentHex: '#FF665E',
    capabilities: [
      'Solo ve y participa en los tableros donde fue invitado',
      'No crea tableros nuevos ni ve miembros/ajustes globales',
    ],
  },
};

export function getRoleRank(role: WorkspaceRole): number {
  return WORKSPACE_ROLE_META[role]?.level ?? 99;
}
