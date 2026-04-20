import React, { useState, useEffect } from 'react';
import { X, Layout, Trash2, Save, AlertCircle, ChevronRight, Settings, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import apiClient from '../lib/api-client';
import { useNavigate } from 'react-router-dom';

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
  { id: 'amethyst', value: 'bg-gradient-to-br from-fuchsia-500 to-purple-600', name: 'Amatista' },
  { id: 'midnight', value: 'bg-gradient-to-br from-slate-800 to-zinc-900', name: 'Medianoche' },
  { id: 'candy', value: 'bg-gradient-to-br from-rose-400 to-pink-600', name: 'Gominola' },
  { id: 'morning', value: 'bg-gradient-to-br from-yellow-200 to-orange-400', name: 'Mañana' },
  { id: 'deep-sea', value: 'bg-gradient-to-br from-blue-600 to-indigo-900', name: 'Mar Profundo' },
  { id: 'cyberpunk', value: 'bg-gradient-to-br from-violet-500 to-fuchsia-600', name: 'Cyberpunk' },
  { id: 'mint', value: 'bg-gradient-to-br from-emerald-300 to-cyan-500', name: 'Menta' },
  { id: 'peach', value: 'bg-gradient-to-br from-orange-300 to-rose-400', name: 'Melocotón' },
  { id: 'autumn', value: 'bg-gradient-to-br from-amber-500 to-orange-700', name: 'Otoño' },
  { id: 'spring', value: 'bg-gradient-to-br from-lime-400 to-emerald-500', name: 'Primavera' },
  { id: 'galaxy', value: 'bg-gradient-to-br from-indigo-500 to-purple-800', name: 'Galaxia' },
  { id: 'mars', value: 'bg-gradient-to-br from-red-500 to-rose-800', name: 'Marte' },
  { id: 'silver', value: 'bg-gradient-to-br from-slate-300 to-slate-500', name: 'Plata' },
  { id: 'lavender', value: 'bg-gradient-to-br from-violet-200 to-indigo-400', name: 'Lavanda' },
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
      // onUpdate(); // We don't strictly need this if state is already updated, but good for sync
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
            className="fixed inset-0 bg-black/5 z-[100] backdrop-blur-[2px]"
          />

          {/* Slide Over */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[400px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-zinc-100 z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-[#7A5AF8] flex items-center justify-center shadow-sm">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 leading-tight">Ajustes del Tablero</h2>
                  <p className="text-[11px] text-zinc-500 font-medium">Gestiona preferencias y visibilidad</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded-xl text-zinc-400 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Nombre del Tablero</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-100/50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-900 focus:bg-white focus:ring-4 focus:ring-violet-50 focus:border-[#7A5AF8] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Descripción</label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el propósito de este tablero..."
                    className="w-full bg-zinc-100/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 focus:bg-white focus:ring-4 focus:ring-violet-50 focus:border-[#7A5AF8] outline-none transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating || !name.trim() || (name === board.name && description === board.description)}
                  className="w-full justify-center bg-[#7A5AF8] hover:bg-[#6949d6] text-white py-3 rounded-xl font-bold shadow-lg shadow-violet-100 flex items-center gap-2"
                >
                  {isUpdating ? 'Guardando...' : (
                    <>
                      <Save size={18} />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-4 border-t border-zinc-100">
                <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider mb-4 ml-1">Fondo del Tablero</h3>
                <div className="grid grid-cols-3 gap-3">
                  {BOARD_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => handleBackgroundChange(bg.value)}
                      className={`
                        w-full h-16 rounded-xl cursor-pointer transition-all hover:scale-[1.03] border-2 relative group
                        ${bg.value}
                        ${(board.background === bg.value || (!board.background && bg.id === 'default')) 
                          ? 'border-[#7A5AF8] shadow-md ring-4 ring-violet-50' 
                          : 'border-transparent hover:border-zinc-300'
                        }
                      `}
                      title={bg.name}
                    >
                      {(board.background === bg.value || (!board.background && bg.id === 'default')) && (
                        <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 size={12} className="text-[#7A5AF8]" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[10px] font-bold text-white bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                           {bg.name}
                         </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 border-t border-zinc-100 bg-rose-50/30">
              <h3 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                <AlertCircle size={14} />
                Zona de Peligro
              </h3>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-rose-100 bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-all font-bold text-sm"
                >
                  <Trash2 size={18} />
                  Eliminar este tablero
                </button>
              ) : (
                <div className="space-y-3 animate-in zoom-in-95">
                  <p className="text-xs font-medium text-rose-600 text-center px-2 leading-relaxed">
                    ¿Estás seguro? Esta acción eliminará permanentemente todas las listas, tarjetas y archivos de este tablero.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-600 font-bold text-xs hover:bg-zinc-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-lg shadow-rose-100"
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
