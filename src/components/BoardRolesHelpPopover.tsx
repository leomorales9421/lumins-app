import React from 'react';
import { HelpCircle, Check, X } from 'lucide-react';
import Popover from './ui/Popover';
import { Badge, type BadgeTone } from './ui/Badge';
import { LuminsInfoIcon } from './icons/LuminsIcons';

interface BoardRoleDoc {
  key: 'admin' | 'editor' | 'viewer' | 'none';
  label: string;
  tone: BadgeTone;
  summary: string;
  capabilities: string[];
  restrictions?: string[];
}

const BOARD_ROLE_DOCS: BoardRoleDoc[] = [
  {
    key: 'admin',
    label: 'Admin',
    tone: 'teal',
    summary: 'Control total del tablero',
    capabilities: [
      'Crea, edita, archiva y elimina listas, tarjetas y etiquetas',
      'Gestiona miembros del tablero, visibilidad y fondo',
      'Por defecto en Administradores del espacio',
    ],
  },
  {
    key: 'editor',
    label: 'Editor',
    tone: 'neutral',
    summary: 'Colaborador operativo',
    capabilities: [
      'Crea, edita, mueve y duplica tarjetas y listas',
      'Comenta, adjunta archivos y gestiona checklists/etiquetas',
      'Por defecto en Miembros del espacio',
    ],
    restrictions: ['No elimina listas ni administra ajustes o miembros del tablero'],
  },
  {
    key: 'viewer',
    label: 'Lector',
    tone: 'amber',
    summary: 'Solo lectura (visualización)',
    capabilities: [
      'Visualiza listas, tarjetas, comentarios, checklists y adjuntos',
      'Por defecto en Invitados del espacio',
    ],
    restrictions: [
      'No puede crear, editar, mover, comentar, adjuntar ni eliminar contenido',
    ],
  },
  {
    key: 'none',
    label: 'Sin acceso',
    tone: 'coral',
    summary: 'Desvinculado del tablero',
    capabilities: ['No puede ver ni abrir este tablero'],
  },
];

interface BoardRolesHelpPopoverProps {
  align?: 'start' | 'center' | 'end';
}

/**
 * Guía interactiva ("?") que explica qué puede ejecutar cada permiso por tablero.
 */
export const BoardRolesHelpPopover: React.FC<BoardRolesHelpPopoverProps> = ({
  align = 'start',
}) => {
  return (
    <Popover
      align={align}
      side="bottom"
      sideOffset={8}
      trigger={
        <button
          type="button"
          title="Ver qué puede hacer cada permiso de tablero"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-[#12A9A8] hover:bg-[#12A9A8]/10 transition-colors"
        >
          <HelpCircle size={14} className="text-[#12A9A8]" />
        </button>
      }
    >
      <div className="w-[340px] sm:w-[400px] max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-[#1C1F26] border border-slate-200/90 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2.5 bg-slate-50/70 dark:bg-white/[0.03]">
          <LuminsInfoIcon size={20} />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Permisos por Tablero
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Qué puede ejecutar cada rol dentro de un tablero
            </p>
          </div>
        </div>

        <div className="p-3 space-y-2 max-h-[min(500px,70vh)] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {BOARD_ROLE_DOCS.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-2.5"
            >
              <div className="flex items-center gap-2">
                <Badge tone={item.tone} variant="dot" size="xs">
                  {item.label}
                </Badge>
                <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                  {item.summary}
                </span>
              </div>

              <ul className="mt-1.5 space-y-1">
                {item.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400 leading-snug"
                  >
                    <Check size={12} className="text-[#12A9A8] shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
                {item.restrictions?.map((res) => (
                  <li
                    key={res}
                    className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 leading-snug"
                  >
                    <X size={12} className="text-[#FF665E] shrink-0 mt-0.5" />
                    <span>{res}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Popover>
  );
};
