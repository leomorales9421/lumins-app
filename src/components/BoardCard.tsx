import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Board } from '../types/board';
import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Calendar,
  ExternalLink,
  Star,
  Globe,
  Lock,
  Pencil,
  Users,
  Link2,
  Archive,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import UserAvatar from './ui/UserAvatar';
import { LuminsBoardIcon } from './icons/LuminsIcons';
import Badge from './ui/Badge';
import MembersModal from './MembersModal';
import ConfirmActionModal from './ConfirmActionModal';

interface BoardCardProps {
  board: Board;
}

const STARRED_STORAGE_KEY = 'lumins_starred_boards';

export function getStarredBoardIds(): string[] {
  try {
    const raw = localStorage.getItem(STARRED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleStarredBoardId(boardId: string): boolean {
  const current = new Set(getStarredBoardIds());
  let nextStarred = false;
  if (current.has(boardId)) {
    current.delete(boardId);
    nextStarred = false;
  } else {
    current.add(boardId);
    nextStarred = true;
  }
  localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(Array.from(current)));
  window.dispatchEvent(new CustomEvent('lumins:starred-updated'));
  return nextStarred;
}

const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isStarred, setIsStarred] = useState<boolean>(() =>
    Boolean(board.starred) || getStarredBoardIds().includes(board.id)
  );
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(board.name);
  const [editDesc, setEditDesc] = useState(board.description || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncStar = () => {
      setIsStarred(Boolean(board.starred) || getStarredBoardIds().includes(board.id));
    };
    window.addEventListener('lumins:starred-updated', syncStar);
    return () => window.removeEventListener('lumins:starred-updated', syncStar);
  }, [board.id, board.starred]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const handleScroll = () => setMenuOpen(false);

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  const totalCards = board._count?.cards || 0;
  const completedCards = Math.min(totalCards, Math.max(0, board.completedCardsCount || 0));
  const progress = totalCards === 0 ? 0 : Math.min(100, Math.max(0, Math.round((completedCards / totalCards) * 100)));

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 216;
      const left = Math.min(
        Math.max(12, rect.right - menuWidth),
        window.innerWidth - menuWidth - 12
      );
      const top = Math.min(rect.bottom + 6, window.innerHeight - 280);
      setMenuCoords({ top, left });
    }
    setMenuOpen(true);
  };

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleStarredBoardId(board.id);
    setIsStarred(next);
    setMenuOpen(false);
    toast.success(next ? 'Tablero destacado' : 'Quitado de destacados');
  };

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdatingVisibility) return;
    const nextVisibility = board.visibility === 'WORKSPACE' ? 'PRIVATE' : 'WORKSPACE';
    setIsUpdatingVisibility(true);
    setMenuOpen(false);
    try {
      await apiClient.patch(`/api/boards/${board.id}/visibility`, { visibility: nextVisibility });
      toast.success(
        nextVisibility === 'WORKSPACE'
          ? 'Tablero ahora visible para el espacio'
          : 'Tablero cambiado a privado'
      );
      window.dispatchEvent(new CustomEvent('lumins:board-updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo cambiar la visibilidad');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    const url = `${window.location.origin}/boards/${board.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace del tablero copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editName.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await apiClient.patch(`/api/boards/${board.id}`, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      toast.success('Tablero actualizado');
      setIsEditOpen(false);
      window.dispatchEvent(new CustomEvent('lumins:board-updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar el tablero');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleArchiveBoard = async () => {
    setIsDeleting(true);
    try {
      const res = await apiClient.patch<{ data?: { cancelledMeetsCount?: number } }>(
        `/api/boards/${board.id}/archive`
      );
      const cancelledMeets = res.data?.cancelledMeetsCount || 0;
      toast.success(
        cancelledMeets > 0
          ? `Tablero "${board.name}" archivado (${cancelledMeets} Meet(s) cancelados)`
          : `Tablero "${board.name}" archivado`
      );
      setIsDeleteOpen(false);
      window.dispatchEvent(new CustomEvent('lumins:board-updated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo archivar el tablero');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={() => navigate(`/boards/${board.id}`)}
        className="group flex flex-col cursor-pointer bg-white dark:bg-[#212632] dark:hover:bg-[#262C3A] border border-slate-200/90 dark:border-white/[0.11] rounded-2xl overflow-hidden transition-all duration-200 shadow-card hover:shadow-card-hover hover:border-[var(--lumins-accent-border)] hover:-translate-y-0.5 min-h-[124px]"
      >
        {/* Subtle Trello-style top brand accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--lumins-accent)] via-[var(--lumins-accent)]/80 to-[#FFCC40]/80 opacity-85 group-hover:opacity-100 transition-opacity" />

        <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
          {/* Top Row: Icon + Title + Visibility + Options */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center group-hover:bg-[var(--lumins-accent-soft)] group-hover:border-[var(--lumins-accent-border)] transition-all shrink-0">
                <LuminsBoardIcon size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight group-hover:text-[var(--lumins-accent-fg)] transition-colors truncate">
                    {board.name}
                  </h3>
                  {isStarred && (
                    <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                  )}
                </div>
                <p
                  className="text-[11px] font-medium text-slate-400 dark:text-zinc-300/80 truncate leading-tight"
                  title={board.description || ''}
                >
                  {board.description || 'Sin descripción disponible.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="dot"
                size="xs"
                tone={board.visibility === 'WORKSPACE' ? 'teal' : 'amber'}
              >
                {board.visibility === 'WORKSPACE' ? 'Público' : 'Privado'}
              </Badge>
              <button
                ref={triggerRef}
                type="button"
                aria-label="Opciones del tablero"
                onClick={openMenu}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  menuOpen
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-zinc-100'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-zinc-100'
                }`}
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Compact Progress + Avatar & Year */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="h-1.5 flex-1 max-w-[110px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--lumins-accent)] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[var(--lumins-accent-fg)] shrink-0">
                {progress}%
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(() => {
                const members =
                  board.displayMembers && board.displayMembers.length > 0
                    ? board.displayMembers
                    : board.owner
                    ? [board.owner]
                    : user
                    ? [user]
                    : [];
                const visibleMembers = members.slice(0, 4);
                const extraCount = members.length - visibleMembers.length;

                return (
                  <div className="flex items-center">
                    <div className="flex items-center -space-x-1.5">
                      {visibleMembers.map((member) => (
                        <div
                          key={member.id}
                          title={member.name || member.email}
                          className="rounded-md ring-1 ring-white dark:ring-[#212632] shadow-xs"
                        >
                          <UserAvatar
                            user={member}
                            size="xs"
                            className="rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                    {extraCount > 0 && (
                      <span
                        title={`${extraCount} miembros más`}
                        className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-md bg-slate-100 dark:bg-white/10 text-[9px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10"
                      >
                        +{extraCount}
                      </span>
                    )}
                  </div>
                );
              })()}
              <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                <Calendar size={12} />
                <span className="text-[10px] font-semibold">
                  {board.createdAt ? new Date(board.createdAt).getFullYear() : '2026'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Dropdown Menu */}
      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{ top: menuCoords.top, left: menuCoords.left }}
            className="fixed z-[150] w-54 rounded-xl bg-white dark:bg-[#212632] border border-slate-200/90 dark:border-white/[0.12] shadow-xl py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                window.open(`/boards/${board.id}`, '_blank', 'noopener,noreferrer');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <ExternalLink size={14} className="text-slate-400 dark:text-zinc-400 shrink-0" />
              <span>Abrir en nueva pestaña</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStar}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Star
                size={14}
                className={isStarred ? 'text-amber-400 fill-amber-400 shrink-0' : 'text-slate-400 dark:text-zinc-400 shrink-0'}
              />
              <span>{isStarred ? 'Quitar de destacados' : 'Destacar tablero'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={isUpdatingVisibility}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              {board.visibility === 'WORKSPACE' ? (
                <Lock size={14} className="text-slate-400 dark:text-zinc-400 shrink-0" />
              ) : (
                <Globe size={14} className="text-slate-400 dark:text-zinc-400 shrink-0" />
              )}
              <span>
                {board.visibility === 'WORKSPACE' ? 'Cambiar a privado' : 'Hacer público'}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditName(board.name);
                setEditDesc(board.description || '');
                setMenuOpen(false);
                setIsEditOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Pencil size={14} className="text-slate-400 dark:text-zinc-400 shrink-0" />
              <span>Editar título y descripción</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setIsMembersOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Users size={14} className="text-slate-400 dark:text-zinc-400 shrink-0" />
              <span>Miembros del tablero</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
            >
              <Link2 size={14} className="text-slate-400 dark:text-zinc-400 shrink-0" />
              <span>Copiar enlace</span>
            </button>

            {board.canArchive && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-white/10" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setIsDeleteOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer text-left"
                >
                  <Archive size={14} className="shrink-0" />
                  <span>Archivar tablero</span>
                </button>
              </>
            )}
          </div>,
          document.body
        )}

      {/* Edit Board Modal */}
      {isEditOpen &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsEditOpen(false);
            }}
            className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <form
              onSubmit={handleSaveEdit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-[#212632] border border-slate-200 dark:border-white/[0.12] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Editar tablero
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#181B24] border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[var(--lumins-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Describe el objetivo de este tablero..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#181B24] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[var(--lumins-accent)] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="h-9 px-3.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim() || isSavingEdit}
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-[var(--lumins-accent)] text-[var(--lumins-accent-on)] hover:bg-[var(--lumins-accent-hover)] disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Board Members Modal */}
      {isMembersOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <MembersModal
            isOpen={isMembersOpen}
            onClose={() => setIsMembersOpen(false)}
            boardId={board.id}
            boardName={board.name}
            workspaceId={board.workspaceId}
          />
        </div>
      )}

      {/* Archive Board Confirmation */}
      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Archivar tablero"
        description={`¿Archivar "${board.name}"? Dejará de mostrarse en tableros activos, estadísticas y recordatorios. Además, se cancelarán los Google Meets programados y se quitarán sus eventos sincronizados de Google Calendar.`}
        confirmLabel="Sí, archivar"
        cancelLabel="Cancelar"
        variant="warning"
        isLoading={isDeleting}
        onConfirm={handleArchiveBoard}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  );
};

export default BoardCard;
