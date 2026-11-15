import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings2,
  Lock,
  Building2,
  Check,
  ChevronRight,
  Palette,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Archive,
  Loader2,
  Sparkles,
  Pencil,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from './ui/Skeleton';
import {
  BOARD_BACKGROUND_PRESETS,
  DEFAULT_BOARD_BACKGROUND,
  fetchBoardBackgroundGallery,
  isValidBoardBackground,
  normalizeBoardBackground,
  preloadImageUrl,
  parseBackgroundConfig,
  isPresetBackground,
  type BoardBackgroundImage,
} from '../lib/board-backgrounds';
import { compressImage } from '../lib/image-utils';

export interface BoardOptionsMenuProps {
  board: {
    id: string;
    name: string;
    workspaceId: string;
    ownerId?: string;
    description?: string;
    background?: string;
    backgroundType?: 'PRESET' | 'IMAGE';
    backgroundImageUrl?: string | null;
    backgroundThumbUrl?: string | null;
    backgroundStorageKey?: string | null;
    backgroundVersion?: number;
    visibility: 'PRIVATE' | 'WORKSPACE';
  };
  onUpdate: () => void;
  onUpdateBoard?: (data: Partial<any>) => void;
  workspaceRole?: string;
  externalOpen?: boolean;
  onExternalClose?: () => void;
  mobileOnly?: boolean;
}

export const BoardOptionsMenu: React.FC<BoardOptionsMenuProps> = ({
  board,
  onUpdate,
  onUpdateBoard,
  workspaceRole,
  externalOpen = false,
  onExternalClose,
  mobileOnly = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showGallerySubmenu, setShowGallerySubmenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [visibility, setVisibility] = useState(board.visibility);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedBackground, setSelectedBackground] = useState<string | null>(
    normalizeBoardBackground(board.background)
  );
  const [apiImages, setApiImages] = useState<BoardBackgroundImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isSavingBackground, setIsSavingBackground] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [backgroundUploadProgress, setBackgroundUploadProgress] = useState<number | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(null);
  const [lava, setLava] = useState<boolean>(true);

  const latestBackgroundRequestRef = useRef(0);
  const confirmedBackgroundRef = useRef<string | null>(normalizeBoardBackground(board.background));
  const isBackgroundBusy = isSavingBackground || isUploadingBackground;
  const currentCustomBackgroundPreview =
    backgroundPreviewUrl || board.backgroundThumbUrl || board.backgroundImageUrl || null;

  const effectiveOpen = isOpen || externalOpen;

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    onExternalClose?.();
  }, [onExternalClose]);

  useEffect(() => {
    return () => {
      if (backgroundPreviewUrl) {
        URL.revokeObjectURL(backgroundPreviewUrl);
      }
    };
  }, [backgroundPreviewUrl]);

  useEffect(() => {
    if (!effectiveOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileOnly) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [effectiveOpen, closeMenu, mobileOnly]);

  useEffect(() => {
    if (effectiveOpen) {
      const normalizedBackground = normalizeBoardBackground(board.background);
      setName(board.name);
      setDescription(board.description || '');
      setVisibility(board.visibility);
      setShowDeleteConfirm(false);
      setIsEditingInfo(false);
      setSelectedBackground(normalizedBackground);
      confirmedBackgroundRef.current = normalizedBackground;
      setBackgroundError(null);
      setIsSavingBackground(false);
      setIsUploadingBackground(false);
      setBackgroundUploadProgress(null);

      if (normalizedBackground) {
        const config = parseBackgroundConfig(normalizedBackground);
        setLava(config.lava);
      }
    }
  }, [effectiveOpen, board]);

  useEffect(() => {
    if (!effectiveOpen || !showGallerySubmenu || apiImages.length > 0) return;
    const abortController = new AbortController();
    let mounted = true;

    const loadGallery = async () => {
      setIsLoadingImages(true);
      try {
        const images = await fetchBoardBackgroundGallery(abortController.signal);
        if (mounted) setApiImages(images);
      } catch (error) {
        if (mounted) {
          console.error('Error al cargar imágenes de fondo', error);
          setApiImages([]);
        }
      } finally {
        if (mounted) setIsLoadingImages(false);
      }
    };

    void loadGallery();
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [effectiveOpen, showGallerySubmenu, apiImages.length]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdating(true);
    try {
      await apiClient.patch(`/api/boards/${board.id}`, {
        name: name.trim(),
        description: description.trim(),
        visibility,
      });
      onUpdate();
      setIsEditingInfo(false);
      toast.success('Tablero actualizado');
    } catch (err) {
      console.error('Error updating board', err);
      toast.error('No se pudo actualizar el tablero');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackgroundChange = useCallback(
    async (selectedValue: string) => {
      const normalizedSelected = normalizeBoardBackground(selectedValue) || DEFAULT_BOARD_BACKGROUND;

      if (!isValidBoardBackground(normalizedSelected)) {
        toast.error('Fondo no válido', {
          description: 'Selecciona un fondo de la galería o un color disponible.',
        });
        return;
      }

      if (normalizedSelected === selectedBackground) return;

      const previousConfirmed = confirmedBackgroundRef.current;
      const requestId = ++latestBackgroundRequestRef.current;

      setSelectedBackground(normalizedSelected);
      setIsSavingBackground(true);
      setBackgroundError(null);
      onUpdateBoard?.({
        background: normalizedSelected,
        backgroundType: /^https?:\/\//.test(normalizedSelected) ? 'IMAGE' : 'PRESET',
        backgroundImageUrl: null,
        backgroundThumbUrl: null,
        backgroundStorageKey: null,
      });

      try {
        await apiClient.patch(`/api/boards/${board.id}`, {
          background: normalizedSelected,
        });

        if (latestBackgroundRequestRef.current !== requestId) return;
        confirmedBackgroundRef.current = normalizedSelected;
      } catch (err) {
        console.error('Error updating background', err);
        if (latestBackgroundRequestRef.current !== requestId) return;

        setSelectedBackground(previousConfirmed);
        onUpdateBoard?.({
          background: previousConfirmed,
          backgroundType: board.backgroundType,
          backgroundImageUrl: board.backgroundImageUrl,
          backgroundThumbUrl: board.backgroundThumbUrl,
          backgroundStorageKey: board.backgroundStorageKey,
        });
        setBackgroundError('No pudimos guardar el fondo. Se restauró el anterior.');
        toast.error('No se pudo actualizar el fondo');
      } finally {
        if (latestBackgroundRequestRef.current === requestId) {
          setIsSavingBackground(false);
        }
      }
    },
    [
      board.backgroundImageUrl,
      board.backgroundStorageKey,
      board.backgroundThumbUrl,
      board.backgroundType,
      board.id,
      onUpdateBoard,
      selectedBackground,
    ]
  );

  const handleLavaChange = useCallback(
    (newLava: boolean) => {
      setLava(newLava);
      if (selectedBackground && isPresetBackground(selectedBackground)) {
        const config = parseBackgroundConfig(selectedBackground);
        void handleBackgroundChange(`${config.base}?tone=dark&lava=${newLava}`);
      }
    },
    [selectedBackground, handleBackgroundChange]
  );

  const handleCustomBackgroundUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.type.startsWith('image/')) {
        setBackgroundError('Selecciona una imagen válida para el fondo.');
        event.target.value = '';
        return;
      }

      try {
        setBackgroundError(null);
        setIsUploadingBackground(true);
        setBackgroundUploadProgress(0);

        const compressedFile = await compressImage(selectedFile, {
          maxSizeMB: 2.5,
          maxWidthOrHeight: 2560,
          fileType: 'image/webp',
        });

        setBackgroundPreviewUrl((currentPreview) => {
          if (currentPreview) URL.revokeObjectURL(currentPreview);
          return URL.createObjectURL(compressedFile);
        });

        const formData = new FormData();
        formData.append('background', compressedFile);

        const response = await apiClient.post<{ success: boolean; data: { board: Record<string, unknown> } }>(
          `/api/boards/${board.id}/background-image`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (!progressEvent.total) return;
              setBackgroundUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
            },
          }
        );

        const updatedBoard = response.data.board;
        onUpdateBoard?.(updatedBoard);
        setSelectedBackground(normalizeBoardBackground((updatedBoard as { background?: string }).background));
        setBackgroundUploadProgress(100);
        toast.success('Fondo personalizado actualizado');
      } catch (error) {
        console.error('Error uploading custom board background', error);
        setBackgroundError('No se pudo subir la imagen del fondo.');
        toast.error('No se pudo subir el fondo personalizado');
      } finally {
        setIsUploadingBackground(false);
        event.target.value = '';
        setTimeout(() => setBackgroundUploadProgress(null), 600);
      }
    },
    [board.id, onUpdateBoard]
  );

  const handleRemoveCustomBackground = useCallback(async () => {
    try {
      setBackgroundError(null);
      setIsUploadingBackground(true);
      setBackgroundUploadProgress(null);

      const response = await apiClient.delete<{ success: boolean; data: { board: Record<string, unknown> } }>(
        `/api/boards/${board.id}/background-image`
      );
      const updatedBoard = response.data.board;
      onUpdateBoard?.(updatedBoard);
      setSelectedBackground(normalizeBoardBackground((updatedBoard as { background?: string }).background));
      setBackgroundPreviewUrl((currentPreview) => {
        if (currentPreview) URL.revokeObjectURL(currentPreview);
        return null;
      });
      toast.success('Fondo personalizado eliminado');
    } catch (error) {
      console.error('Error removing custom board background', error);
      setBackgroundError('No se pudo eliminar el fondo personalizado.');
      toast.error('No se pudo eliminar el fondo');
    } finally {
      setIsUploadingBackground(false);
    }
  }, [board.id, onUpdateBoard]);

  const handleArchive = async () => {
    setIsDeleting(true);
    try {
      const res = await apiClient.patch<{ data?: { cancelledMeetsCount?: number } }>(
        `/api/boards/${board.id}/archive`
      );
      const cancelledMeets = res.data?.cancelledMeetsCount || 0;
      toast.success(
        cancelledMeets > 0
          ? `Tablero archivado (${cancelledMeets} Meet(s) cancelados)`
          : 'Tablero archivado'
      );
      closeMenu();
      navigate(`/w/${board.workspaceId}/dashboard`);
    } catch (err) {
      console.error('Error archiving board', err);
      toast.error('No se pudo archivar el tablero');
    } finally {
      setIsDeleting(false);
    }
  };

  const canChangeVisibility =
    board.ownerId === user?.id || workspaceRole === 'ADMIN' || workspaceRole === 'OWNER' || workspaceRole === 'admin';

  const menuContent = (
    <>
            {/* Header del Menú */}
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5 border-b border-zinc-100 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Settings2 size={13} className="text-[var(--lumins-accent-fg)]" />
                Opciones del Tablero
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            {/* SECCIÓN 1: GENERAL Y VISIBILIDAD */}
            <div className="p-2.5 bg-zinc-50 dark:bg-black/20 rounded-xl space-y-2 border border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-extrabold text-zinc-800 dark:text-zinc-200 truncate">{board.name}</div>
                  <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                    {board.visibility === 'PRIVATE' ? <Lock size={10} /> : <Building2 size={10} />}
                    <span>{board.visibility === 'PRIVATE' ? 'Tablero privado' : 'Visible para el espacio'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo((prev) => !prev)}
                  className="text-[11px] font-bold text-[var(--lumins-accent-fg)] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Pencil size={11} />
                  {isEditingInfo ? 'Cerrar' : 'Editar'}
                </button>
              </div>

              {isEditingInfo && (
                <form onSubmit={handleUpdate} className="pt-2 border-t border-zinc-200/60 dark:border-white/5 space-y-2.5">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-8 px-2.5 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[var(--lumins-accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Propósito del tablero..."
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 outline-none focus:border-[var(--lumins-accent)] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-1">
                      Visibilidad
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={!canChangeVisibility}
                        onClick={() => setVisibility('PRIVATE')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          visibility === 'PRIVATE'
                            ? 'bg-[var(--lumins-accent-soft)] border-[var(--lumins-accent-border)] text-[var(--lumins-accent-fg)]'
                            : 'bg-white dark:bg-[#1C1F26] border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <Lock size={11} />
                        Privado
                      </button>
                      <button
                        type="button"
                        disabled={!canChangeVisibility}
                        onClick={() => setVisibility('WORKSPACE')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                          visibility === 'WORKSPACE'
                            ? 'bg-[var(--lumins-accent-soft)] border-[var(--lumins-accent-border)] text-[var(--lumins-accent-fg)]'
                            : 'bg-white dark:bg-[#1C1F26] border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <Building2 size={11} />
                        Espacio
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isUpdating ||
                      !name.trim() ||
                      (name === board.name && description === (board.description || '') && visibility === board.visibility)
                    }
                    className="w-full py-1.5 px-2.5 bg-[var(--lumins-accent)] hover:brightness-95 text-[var(--lumins-accent-on)] rounded-lg text-[11px] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Guardar cambios
                  </button>
                </form>
              )}
            </div>

            {/* SECCIÓN 2: APARIENCIA Y FONDO */}
            <div className="p-2.5 bg-zinc-50/60 dark:bg-white/[0.02] rounded-xl space-y-2.5 border border-zinc-200/50 dark:border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-400 flex items-center gap-1">
                  <Palette size={12} className="text-[var(--lumins-accent-fg)]" />
                  Fondo del Tablero
                </span>
                {isBackgroundBusy && (
                  <span className="text-[10px] font-semibold text-[var(--lumins-accent-fg)] flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    {isUploadingBackground && backgroundUploadProgress !== null
                      ? `${backgroundUploadProgress}%`
                      : 'Aplicando...'}
                  </span>
                )}
              </div>

              {/* Presets de color y gradientes */}
              <div className="grid grid-cols-3 gap-1.5">
                {BOARD_BACKGROUND_PRESETS.map((bg) => {
                  const isActive =
                    (selectedBackground && selectedBackground.startsWith(bg.value)) ||
                    (!selectedBackground && bg.id === 'default');
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => void handleBackgroundChange(`${bg.value}?tone=dark&lava=${lava}`)}
                      disabled={isBackgroundBusy}
                      title={bg.name}
                      className={`relative h-9 rounded-lg cursor-pointer transition-all border-2 ${bg.value} ${
                        isActive
                          ? 'border-[var(--lumins-accent)] ring-2 ring-[var(--lumins-accent)]/20'
                          : 'border-transparent hover:border-zinc-300 dark:hover:border-white/20'
                      } disabled:opacity-60`}
                    >
                      {isActive && (
                        <span
                          style={{
                            backgroundColor: 'var(--lumins-accent)',
                            color: 'var(--lumins-accent-on)',
                          }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                        >
                          <Check size={9} strokeWidth={3.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Efecto Lava */}
              {selectedBackground && isPresetBackground(selectedBackground) && (
                <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-white/5">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-500" />
                    Efecto Lava
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLavaChange(!lava)}
                    style={lava ? { backgroundColor: 'var(--lumins-accent)' } : undefined}
                    className={`relative w-8 h-4.5 rounded-full transition-colors cursor-pointer ${
                      lava ? '' : 'bg-zinc-300 dark:bg-white/20'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform ${
                        lava ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Imagen personalizada */}
              <div className="pt-1.5 border-t border-zinc-200/50 dark:border-white/5 flex items-center gap-1.5">
                <input
                  ref={backgroundFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleCustomBackgroundUpload}
                />
                <button
                  type="button"
                  onClick={() => backgroundFileInputRef.current?.click()}
                  disabled={isBackgroundBusy}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:border-[var(--lumins-accent)] hover:text-[var(--lumins-accent-fg)] text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Upload size={12} />
                  {currentCustomBackgroundPreview ? 'Cambiar imagen propia' : 'Subir imagen propia'}
                </button>
                {board.backgroundType === 'IMAGE' && (board.backgroundImageUrl || backgroundPreviewUrl) && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomBackground}
                    disabled={isBackgroundBusy}
                    title="Quitar imagen personalizada"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1C1F26] text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>

              {/* Submenú Galería de Fotos */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowGallerySubmenu((prev) => !prev)}
                  className="w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-white/5 font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon size={13} className="text-[var(--lumins-accent-fg)]" />
                    Galería de Fotos (Picsum)
                  </span>
                  <ChevronRight
                    size={13}
                    className={`text-zinc-400 transition-transform ${showGallerySubmenu ? 'rotate-90' : ''}`}
                  />
                </button>

                {showGallerySubmenu && (
                  <div className="pt-2 space-y-2">
                    {backgroundError && (
                      <p className="text-[10.5px] font-medium text-rose-600 dark:text-rose-400 px-1">
                        {backgroundError}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                      {isLoadingImages
                        ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-full h-11 rounded-md" />)
                        : apiImages.map((img) => {
                            const isActive = selectedBackground === img.fullUrl;
                            return (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => void handleBackgroundChange(img.fullUrl)}
                                onMouseEnter={() => void preloadImageUrl(img.fullUrl)}
                                disabled={isBackgroundBusy}
                                className={`relative h-11 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                                  isActive
                                    ? 'border-[var(--lumins-accent)] ring-2 ring-[var(--lumins-accent)]/20'
                                    : 'border-transparent hover:border-zinc-300 dark:hover:border-white/20'
                                }`}
                              >
                                <img
                                  src={img.thumbUrl}
                                  alt={`Fondo ${img.id}`}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                                {isActive && (
                                  <span
                                    style={{
                                      backgroundColor: 'var(--lumins-accent)',
                                      color: 'var(--lumins-accent-on)',
                                    }}
                                    className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                  >
                                    <Check size={8} strokeWidth={3.5} />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: ADMINISTRACIÓN */}
            <div className="pt-1.5 border-t border-zinc-100 dark:border-white/5">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Archive size={13} />
                    Archivar este tablero
                  </span>
                </button>
              ) : (
                <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 space-y-2">
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200 leading-snug">
                    Se ocultará de tableros activos, estadísticas y recordatorios. Además, se cancelarán los Google Meets programados y se quitarán sus eventos de Google Calendar.
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1 rounded-md bg-white dark:bg-[#1C1F26] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 font-bold text-[11px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={isDeleting}
                      className="flex-1 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer disabled:opacity-60"
                    >
                      {isDeleting ? 'Archivando...' : 'Sí, archivar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
    </>
  );

  return (
    <div className={mobileOnly ? 'md:hidden' : 'relative'} ref={menuRef}>
      {!mobileOnly && (
        <button
          type="button"
          onClick={() => (effectiveOpen ? closeMenu() : setIsOpen(true))}
          title="Opciones y Configuración del Tablero"
          className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-95 cursor-pointer ${
            effectiveOpen
              ? 'bg-white/20 text-white'
              : 'text-white/80 hover:text-white hover:bg-white/15'
          }`}
        >
          <Settings2 size={15} className={effectiveOpen ? 'text-[var(--lumins-accent)]' : ''} />
        </button>
      )}

      <AnimatePresence>
        {effectiveOpen && (
          mobileOnly ? (
            <motion.div
              key="mobile-board-settings-root"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[150] flex items-end justify-center"
            >
              <div className="fixed inset-0 bg-black/50" onClick={closeMenu} />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.22)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-zinc-200/80 dark:border-white/10 max-h-[88dvh] flex flex-col overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              >
                <div
                  className="w-full flex items-center justify-center pt-3 pb-1 cursor-pointer shrink-0"
                  onClick={closeMenu}
                >
                  <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-white/20" />
                </div>
                <div className="p-3 pt-1.5 space-y-2.5 text-xs overflow-y-auto custom-scrollbar">
                  {menuContent}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="desktop-board-settings-popover"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-2.5 z-[150] space-y-2.5 text-xs max-h-[82vh] overflow-y-auto custom-scrollbar"
            >
              {menuContent}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default BoardOptionsMenu;
