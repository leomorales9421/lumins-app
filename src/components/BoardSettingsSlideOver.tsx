import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, Save, AlertCircle, Settings, CheckCircle2, Loader2, Image as ImageIcon, Lock, Building2, Upload, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from './ui/Skeleton';
import apiClient from '../lib/api-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  BOARD_BACKGROUND_PRESETS,
  DEFAULT_BOARD_BACKGROUND,
  fetchBoardBackgroundGallery,
  isValidBoardBackground,
  normalizeBoardBackground,
  preloadImageUrl,
  type BoardBackgroundImage,
} from '../lib/board-backgrounds';
import { compressImage } from '../lib/image-utils';

const ImageOption = ({
  img,
  currentBackground,
  onSelect,
  disabled,
}: {
  img: BoardBackgroundImage;
  currentBackground: string | null;
  onSelect: (value: string) => void;
  disabled: boolean;
  key?: React.Key;
}) => {
  const isActive = currentBackground === img.fullUrl;

  const handleMouseEnter = () => {
    void preloadImageUrl(img.fullUrl);
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(img.fullUrl)}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      className={`relative w-full h-16 rounded overflow-hidden border-2 transition-all hover:scale-[1.03] group ${
        isActive ? 'border-[#6C5DD3] shadow-md ring-4 ring-[#6C5DD3]/15' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
      } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <div className="absolute inset-0 bg-zinc-200 dark:bg-white/5 animate-pulse -z-10" />

      <img
        src={img.thumbUrl}
        alt={`Fondo ${img.id}`}
        loading="lazy"
        className="w-full h-full object-cover"
      />

      {isActive && (
        <div className="absolute top-1 right-1 bg-white dark:bg-[#1C1F26] rounded p-0.5 shadow-sm z-10">
          <CheckCircle2 size={12} className="text-[#6C5DD3]" />
        </div>
      )}

      <div className="absolute inset-0 bg-black/10 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
          Seleccionar
        </span>
      </div>
    </button>
  );
};

interface BoardSettingsSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
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
}

const BoardSettingsSlideOver: React.FC<BoardSettingsSlideOverProps> = ({ 
  isOpen, 
  onClose, 
  board, 
  onUpdate,
  onUpdateBoard,
  workspaceRole
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [visibility, setVisibility] = useState(board.visibility);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  const latestBackgroundRequestRef = useRef(0);
  const confirmedBackgroundRef = useRef<string | null>(normalizeBoardBackground(board.background));
  const backgroundFileInputRef = useRef<HTMLInputElement | null>(null);
  const isBackgroundBusy = isSavingBackground || isUploadingBackground;
  const currentCustomBackgroundPreview = backgroundPreviewUrl || board.backgroundThumbUrl || board.backgroundImageUrl || null;

  useEffect(() => {
    return () => {
      if (backgroundPreviewUrl) {
        URL.revokeObjectURL(backgroundPreviewUrl);
      }
    };
  }, [backgroundPreviewUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const abortController = new AbortController();
    let mounted = true;

    const loadGallery = async () => {
      setIsLoadingImages(true);
      try {
        const images = await fetchBoardBackgroundGallery(abortController.signal);
        if (!mounted) return;
        setApiImages(images);
      } catch (error) {
        if (!mounted) return;
        console.error('Error al cargar imagenes de fondo', error);
        setApiImages([]);
      } finally {
        if (mounted) setIsLoadingImages(false);
      }
    };

    void loadGallery();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const normalizedBackground = normalizeBoardBackground(board.background);
      setName(board.name);
      setDescription(board.description || '');
      setVisibility(board.visibility);
      setShowDeleteConfirm(false);
      setSelectedBackground(normalizedBackground);
      confirmedBackgroundRef.current = normalizedBackground;
      setBackgroundError(null);
      setIsSavingBackground(false);
      setIsUploadingBackground(false);
      setBackgroundUploadProgress(null);
      setBackgroundPreviewUrl((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview);
        }
        return null;
      });
    }
  }, [isOpen, board]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsUpdating(true);
    try {
      await apiClient.patch(`/api/boards/${board.id}`, { 
        name: name.trim(),
        description: description.trim(),
        visibility: visibility
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating board', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackgroundChange = useCallback(async (selectedValue: string) => {
    const normalizedSelected = normalizeBoardBackground(selectedValue) || DEFAULT_BOARD_BACKGROUND;

    if (!isValidBoardBackground(normalizedSelected)) {
      toast.error('Fondo no valido', { description: 'Selecciona un fondo de la galeria o un color disponible.' });
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
      setBackgroundError('No pudimos guardar el fondo. Se restauro el valor anterior.');
      toast.error('No se pudo actualizar el fondo');
    } finally {
      if (latestBackgroundRequestRef.current === requestId) {
        setIsSavingBackground(false);
      }
    }
  }, [board.backgroundImageUrl, board.backgroundStorageKey, board.backgroundThumbUrl, board.backgroundType, board.id, onUpdateBoard, selectedBackground]);

  const handleCustomBackgroundUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setBackgroundError('Selecciona una imagen valida para el fondo del tablero.');
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
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview);
        }
        return URL.createObjectURL(compressedFile);
      });

      const formData = new FormData();
      formData.append('background', compressedFile);

      const response = await apiClient.post<{ success: boolean; data: { board: Record<string, unknown> } }>(
        `/api/boards/${board.id}/background-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
      setBackgroundError('No se pudo subir la imagen del fondo. Intenta con otra imagen o vuelve a intentar.');
      toast.error('No se pudo subir el fondo personalizado');
    } finally {
      setIsUploadingBackground(false);
      event.target.value = '';
      setTimeout(() => setBackgroundUploadProgress(null), 600);
    }
  }, [board.id, onUpdateBoard]);

  const handleRemoveCustomBackground = useCallback(async () => {
    try {
      setBackgroundError(null);
      setIsUploadingBackground(true);
      setBackgroundUploadProgress(null);

      const response = await apiClient.delete<{ success: boolean; data: { board: Record<string, unknown> } }>(`/api/boards/${board.id}/background-image`);
      const updatedBoard = response.data.board;
      onUpdateBoard?.(updatedBoard);
      setSelectedBackground(normalizeBoardBackground((updatedBoard as { background?: string }).background));
      setBackgroundPreviewUrl((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview);
        }
        return null;
      });
      toast.success('Fondo personalizado eliminado');
    } catch (error) {
      console.error('Error removing custom board background', error);
      setBackgroundError('No se pudo eliminar el fondo personalizado.');
      toast.error('No se pudo eliminar el fondo personalizado');
    } finally {
      setIsUploadingBackground(false);
    }
  }, [board.id, onUpdateBoard]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/boards/${board.id}`);
      navigate(`/w/${board.workspaceId}/dashboard`);
    } catch (err) {
      console.error('Error deleting board', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/60 z-[100] backdrop-blur-[2px]"
          />

          {/* Slide Over */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[400px] bg-white dark:bg-[#1C1F26] shadow-[-10px_0_40px_rgba(0,0,0,0.15)] border-l border-zinc-200 dark:border-white/10 z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center shadow-sm">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Ajustes del Tablero</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Gestiona preferencias y visibilidad</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-white/10 rounded text-zinc-400 dark:text-zinc-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Nombre del Tablero</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Descripción</label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el propósito de este tablero..."
                    className="w-full bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] outline-none transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Visibilidad</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibility('PRIVATE')}
                      className={`flex items-center gap-3 p-3 rounded border-2 transition-all ${
                        visibility === 'PRIVATE' 
                          ? 'border-[#6C5DD3] bg-[#6C5DD3]/5 text-[#6C5DD3]' 
                          : 'border-zinc-100 dark:border-white/5 text-zinc-500 hover:border-zinc-200'
                      }`}
                    >
                      <Lock size={16} />
                      <div className="text-left">
                        <div className="text-[13px] font-bold">Privado</div>
                        <div className="text-[10px] opacity-70">Solo miembros</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility('WORKSPACE')}
                      className={`flex items-center gap-3 p-3 rounded border-2 transition-all ${
                        visibility === 'WORKSPACE' 
                          ? 'border-[#6C5DD3] bg-[#6C5DD3]/5 text-[#6C5DD3]' 
                          : 'border-zinc-100 dark:border-white/5 text-zinc-500 hover:border-zinc-200'
                      }`}
                    >
                      <Building2 size={16} />
                      <div className="text-left">
                        <div className="text-[13px] font-bold">Espacio</div>
                        <div className="text-[10px] opacity-70">Todo el equipo</div>
                      </div>
                    </button>
                  </div>
                  {board.ownerId !== user?.id && workspaceRole !== 'ADMIN' && workspaceRole !== 'OWNER' && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-1">
                      * Solo el propietario o administradores del espacio pueden cambiar la visibilidad
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isUpdating || !name.trim() || (name === board.name && description === board.description && visibility === board.visibility)}
                  className="w-full justify-center bg-[#6C5DD3] hover:bg-[#312e81] text-white py-3 rounded font-bold shadow-lg shadow-[#6C5DD3]/20 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      <Save size={18} />
                      Guardar cambios
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-zinc-100 dark:border-white/5 space-y-6">
                <div>
                  <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 ml-1">Colores y Gradientes</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {BOARD_BACKGROUND_PRESETS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => handleBackgroundChange(bg.value)}
                        disabled={isBackgroundBusy}
                        className={`
                          w-full h-16 rounded cursor-pointer transition-all hover:scale-[1.03] border-2 relative group
                          ${bg.value}
                          ${(selectedBackground === bg.value || (!selectedBackground && bg.id === 'default')) 
                            ? 'border-[#6C5DD3] shadow-md ring-4 ring-[#6C5DD3]/15' 
                            : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                          } ${isBackgroundBusy ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                        title={bg.name}
                      >
                        {(selectedBackground === bg.value || (!selectedBackground && bg.id === 'default')) && (
                          <div className="absolute top-1 right-1 bg-white dark:bg-[#1C1F26] rounded p-0.5 shadow-sm z-10">
                            <CheckCircle2 size={12} className="text-[#6C5DD3]" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                             {bg.name}
                           </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-6 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Imagen personalizada</h3>
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1">
                          Sube una imagen propia. La convertimos a WebP para que pese menos y cargue rapido.
                        </p>
                      </div>
                      <input
                        ref={backgroundFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleCustomBackgroundUpload}
                      />
                    </div>

                    <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13151A] min-h-[132px]">
                      {currentCustomBackgroundPreview ? (
                        <div className="relative h-[132px]">
                          <img
                            src={currentCustomBackgroundPreview}
                            alt="Preview del fondo personalizado"
                            className="w-full h-full object-cover"
                          />
                          {(isUploadingBackground || isSavingBackground) && (
                            <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center">
                              <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-white">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-[11px] font-bold">
                                  {isUploadingBackground
                                    ? backgroundUploadProgress !== null
                                      ? `Subiendo ${backgroundUploadProgress}%`
                                      : 'Procesando fondo...'
                                    : 'Aplicando fondo...'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-[132px] flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500">
                          <ImageIcon size={22} />
                          <span className="text-[12px] font-medium">Todavia no has subido una imagen personalizada</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => backgroundFileInputRef.current?.click()}
                        disabled={isBackgroundBusy}
                        className="flex-1 h-10 rounded-lg bg-[#6C5DD3] text-white font-bold text-sm hover:bg-[#312e81] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isUploadingBackground ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                        {currentCustomBackgroundPreview ? 'Reemplazar imagen' : 'Subir imagen'}
                      </button>
                      {board.backgroundType === 'IMAGE' && (board.backgroundImageUrl || backgroundPreviewUrl) && (
                        <button
                          type="button"
                          onClick={handleRemoveCustomBackground}
                          disabled={isBackgroundBusy}
                          className="h-10 px-4 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#13151A] text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:border-[#6C5DD3] hover:text-[#6C5DD3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={15} />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 ml-1">
                    <h3 className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Galería de Fotos</h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400">
                      <ImageIcon size={10} />
                      <span className="text-[10px] font-bold">Picsum</span>
                    </div>
                  </div>

                  {backgroundError && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mb-3 ml-1">
                      {backgroundError}
                    </p>
                  )}

                  {isBackgroundBusy && (
                    <div className="mb-3 ml-1 flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      <Loader2 size={12} className="animate-spin" />
                      {isUploadingBackground ? 'Procesando fondo...' : 'Guardando fondo...'}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2">
                    {isLoadingImages ? (
                      Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} className="w-full h-16 rounded" />
                      ))
                    ) : (
                      apiImages.map((img) => (
                        <ImageOption 
                          key={img.id} 
                          img={img} 
                          currentBackground={selectedBackground} 
                          onSelect={handleBackgroundChange} 
                          disabled={isBackgroundBusy}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 border-t border-zinc-200 dark:border-white/10 bg-rose-50/30 dark:bg-rose-500/5">
              <h3 className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                <AlertCircle size={14} />
                Zona de Peligro
              </h3>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded border-2 border-rose-100 dark:border-rose-500/20 bg-white dark:bg-[#13151A] text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all font-bold text-sm"
                >
                  <Trash2 size={18} />
                  Eliminar este tablero
                </button>
              ) : (
                <div className="space-y-3 animate-in zoom-in-95">
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 text-center px-2 leading-relaxed">
                    ¿Estás seguro? Esta acción eliminará permanentemente todas las listas, tarjetas y archivos de este tablero.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 rounded bg-white dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 rounded bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none transition-all"
                    >
                      {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BoardSettingsSlideOver;
