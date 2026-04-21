import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, AlertCircle, Settings, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import apiClient from '../lib/api-client';
import { useNavigate } from 'react-router-dom';

const CACHE_KEY = 'lumins_board_bg_cache';

const ImageOption = ({ img, currentBackground, onSelect }: any) => {
  const thumbUrl = `https://picsum.photos/id/${img.id}/200/150`;
  const fullUrl = `https://picsum.photos/id/${img.id}/2560/1440`;
  const isActive = currentBackground === fullUrl;

  // TRUCO PRO: Pre-cargar la alta resolución cuando el usuario pone el mouse encima
  const handleMouseEnter = () => {
    const imgPreload = new Image();
    imgPreload.src = fullUrl;
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(fullUrl)}
      onMouseEnter={handleMouseEnter}
      className={`relative w-full h-16 rounded overflow-hidden border-2 transition-all hover:scale-[1.03] group ${
        isActive ? 'border-[#6C5DD3] shadow-md ring-4 ring-[#6C5DD3]/15' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      {/* Skeleton de fondo color sólido mientras carga la imagen */}
      <div className="absolute inset-0 bg-zinc-200 dark:bg-white/5 animate-pulse -z-10" />
      
      {/* Imagen con lazy loading */}
      <img 
        src={thumbUrl} 
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
    description?: string;
    background?: string;
  };
  onUpdate: () => void;
  onUpdateBoard?: (data: Partial<any>) => void;
}

export const BOARD_BACKGROUNDS = [
  { id: 'default', value: 'bg-[#F4F6F9]', name: 'Por defecto' },
  { id: 'ocean', value: 'bg-gradient-to-br from-cyan-500 to-blue-600', name: 'Océano' },
  { id: 'sunset', value: 'bg-gradient-to-br from-orange-400 to-rose-500', name: 'Atardecer' },
  { id: 'forest', value: 'bg-gradient-to-br from-emerald-400 to-teal-600', name: 'Bosque' },
  { id: 'amethyst', value: 'bg-gradient-to-br from-fuchsia-500 to-indigo-600', name: 'Amatista' },
  { id: 'midnight', value: 'bg-gradient-to-br from-slate-800 to-zinc-900', name: 'Medianoche' },
  { id: 'candy', value: 'bg-gradient-to-br from-rose-400 to-pink-600', name: 'Gominola' },
  { id: 'morning', value: 'bg-gradient-to-br from-yellow-200 to-orange-400', name: 'Mañana' },
  { id: 'deep-sea', value: 'bg-gradient-to-br from-blue-600 to-indigo-900', name: 'Mar Profundo' },
  { id: 'cyberpunk', value: 'bg-gradient-to-br from-indigo-500 to-fuchsia-600', name: 'Cyberpunk' },
  { id: 'mint', value: 'bg-gradient-to-br from-emerald-300 to-cyan-500', name: 'Menta' },
  { id: 'peach', value: 'bg-gradient-to-br from-orange-300 to-rose-400', name: 'Melocotón' },
  { id: 'autumn', value: 'bg-gradient-to-br from-amber-500 to-orange-700', name: 'Otoño' },
  { id: 'spring', value: 'bg-gradient-to-br from-lime-400 to-emerald-500', name: 'Primavera' },
  { id: 'galaxy', value: 'bg-gradient-to-br from-indigo-500 to-indigo-800', name: 'Galaxia' },
  { id: 'mars', value: 'bg-gradient-to-br from-red-500 to-rose-800', name: 'Marte' },
  { id: 'silver', value: 'bg-gradient-to-br from-slate-300 to-slate-500', name: 'Plata' },
  { id: 'lavender', value: 'bg-gradient-to-br from-indigo-200 to-indigo-400', name: 'Lavanda' },
];

const BoardSettingsSlideOver: React.FC<BoardSettingsSlideOverProps> = ({ 
  isOpen, 
  onClose, 
  board, 
  onUpdate,
  onUpdateBoard
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [apiImages, setApiImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // 1. Revisar Caché local
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          setApiImages(JSON.parse(cached));
          setIsLoadingImages(false);
          return;
        }

        // 2. Si no hay caché, llamar a la API
        const res = await fetch('https://picsum.photos/v2/list?page=3&limit=12');
        const data = await res.json();
        
        // 3. Guardar en estado y en caché
        setApiImages(data);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Error al cargar imágenes", error);
      } finally {
        setIsLoadingImages(false);
      }
    };
    
    fetchImages();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(board.name);
      setDescription(board.description || '');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, board]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsUpdating(true);
    try {
      await apiClient.patch(`/api/boards/${board.id}`, { 
        name: name.trim(),
        description: description.trim()
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating board', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackgroundChange = async (selectedValue: string) => {
    // Store original for rollback
    const originalBackground = board.background;
    
    // Optimistic Update
    if (onUpdateBoard) {
      onUpdateBoard({ background: selectedValue });
    }
    
    try {
      await apiClient.patch(`/api/boards/${board.id}`, { 
        background: selectedValue 
      });
    } catch (err) {
      console.error('Error updating background', err);
      // Rollback
      if (onUpdateBoard) {
        onUpdateBoard({ background: originalBackground });
      }
    }
  };

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

                <button
                  type="submit"
                  disabled={isUpdating || !name.trim() || (name === board.name && description === board.description)}
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
                    {BOARD_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => handleBackgroundChange(bg.value)}
                        className={`
                          w-full h-16 rounded cursor-pointer transition-all hover:scale-[1.03] border-2 relative group
                          ${bg.value}
                          ${(board.background === bg.value || (!board.background && bg.id === 'default')) 
                            ? 'border-[#6C5DD3] shadow-md ring-4 ring-[#6C5DD3]/15' 
                            : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                          }
                        `}
                        title={bg.name}
                      >
                        {(board.background === bg.value || (!board.background && bg.id === 'default')) && (
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
                      <span className="text-[10px] font-bold">Unsplash / Picsum</span>
                    </div>
                  </div>
                  
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
                          currentBackground={board.background} 
                          onSelect={handleBackgroundChange} 
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
