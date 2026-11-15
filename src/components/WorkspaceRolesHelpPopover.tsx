import React from 'react';
import { HelpCircle, Check } from 'lucide-react';
import Popover from './ui/Popover';
import { Badge } from './ui/Badge';
import { LuminsInfoIcon } from './icons/LuminsIcons';
import { WORKSPACE_ROLE_META, WORKSPACE_ROLE_ORDER } from '../lib/workspace-roles';
import type { WorkspaceRole } from '../types/workspace';

interface WorkspaceRolesHelpPopoverProps {
  currentUserRole?: WorkspaceRole;
  align?: 'start' | 'center' | 'end';
  triggerLabel?: string;
  compact?: boolean;
}

/**
 * Guía interactiva ("?") que explica la jerarquía interna de roles y qué puede ejecutar cada uno en el espacio.
 */
export const WorkspaceRolesHelpPopover: React.FC<WorkspaceRolesHelpPopoverProps> = ({
  currentUserRole,
  align = 'end',
  triggerLabel,
  compact = false,
}) => {
  return (
    <Popover
      align={align}
      side="bottom"
      sideOffset={8}
      trigger={
        <button
          type="button"
          title="Ver jerarquía de roles y permisos"
          className={
            compact
              ? 'inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-[#12A9A8] hover:bg-[#12A9A8]/10 transition-colors'
              : 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#1C1F26] text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:border-[#12A9A8]/50 hover:text-[#12A9A8] transition-colors shadow-xs'
          }
        >
          <HelpCircle size={compact ? 14 : 15} className="text-[#12A9A8]" />
          {triggerLabel && <span>{triggerLabel}</span>}
        </button>
      }
    >
      <div className="w-[360px] sm:w-[440px] max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-[#1C1F26] border border-slate-200/90 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2.5 bg-slate-50/70 dark:bg-white/[0.03]">
          <LuminsInfoIcon size={20} />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Jerarquía y Roles del Espacio
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Ordenados de mayor a menor nivel de autoridad
            </p>
          </div>
        </div>

        <div className="p-3 space-y-2 max-h-[min(540px,75vh)] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {WORKSPACE_ROLE_ORDER.map((roleKey) => {
            const meta = WORKSPACE_ROLE_META[roleKey];
            const isCurrentUserRole = currentUserRole === roleKey;

            return (
              <div
                key={roleKey}
                className={`rounded-lg p-2.5 border transition-colors ${
                  isCurrentUserRole
                    ? 'bg-white dark:bg-[#1C1F26] border-slate-200 dark:border-white/10 border-l-[3px] border-l-[#12A9A8] shadow-xs'
                    : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 w-3.5 shrink-0">
                      {meta.level}.
                    </span>
                    <Badge
                      tone={meta.tone}
                      variant="dot"
                      size="xs"
                    >
                      {meta.label}
                    </Badge>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {meta.shortDesc}
                    </span>
                  </div>
                  {isCurrentUserRole && (
                    <Badge tone="teal" variant="inline" size="xs" className="shrink-0">
                      Tu rol
                    </Badge>
                  )}
                </div>

                <ul className="space-y-1 pl-5">
                  {meta.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="text-[11px] text-slate-600 dark:text-zinc-300 flex items-start gap-1.5 leading-snug"
                    >
                      <Check size={11} className="text-[#12A9A8] shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </Popover>
  );
};

export default WorkspaceRolesHelpPopover;
