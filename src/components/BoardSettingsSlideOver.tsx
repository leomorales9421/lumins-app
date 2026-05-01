import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trash2, Save, AlertCircle, Settings, CheckCircle2, Loader2, Image as ImageIcon, Lock, Building2 } from 'lucide-react';
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
    ownerId: string;
    description?: string;
    background?: string;
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
  const latestBackgroundRequestRef = useRef(0);
  const confirmedBackgroundRef = useRef<string | null>(normalizeBoardBackground(board.background));

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
    onUpdateBoard?.({ background: normalizedSelected });

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
      onUpdateBoard?.({ background: previousConfirmed });
      setBackgroundError('No pudimos guardar el fondo. Se restauro el valor anterior.');
      toast.error('No se pudo actualizar el fondo');
    } finally {
      if (latestBackgroundRequestRef.current === requestId) {
        setIsSavingBackground(false);
      }
    }
  }, [board.id, onUpdateBoard, selectedBackground]);

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
                        disabled={isSavingBackground}
                        className={`
                          w-full h-16 rounded cursor-pointer transition-all hover:scale-[1.03] border-2 relative group
                          ${bg.value}
                          ${(selectedBackground === bg.value || (!selectedBackground && bg.id === 'default')) 
                            ? 'border-[#6C5DD3] shadow-md ring-4 ring-[#6C5DD3]/15' 
                            : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                          } ${isSavingBackground ? 'opacity-70 cursor-not-allowed' : ''}
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

                  {isSavingBackground && (
                    <div className="mb-3 ml-1 flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      <Loader2 size={12} className="animate-spin" />
                      Guardando fondo...
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
                          disabled={isSavingBackground}
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
