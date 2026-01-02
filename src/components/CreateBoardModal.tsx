import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CreateBoardRequest } from '../types/board';
import Button from './ui/Button';
import Input from './ui/Input';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (boardData: CreateBoardRequest) => Promise<void>;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState<CreateBoardRequest>({
    name: '',
    description: '',
    visibility: 'private',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('El nombre del tablero es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el tablero');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', visibility: 'private' });
    setError('');
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Content */}
        <div className="inline-block align-bottom bg-[#1c2327]/90 backdrop-blur-xl border border-white/5 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-6 pt-6 pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                Crear nuevo tablero
              </h3>
              <button
                onClick={handleClose}
                className="text-[#9db0b9] hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Nombre del tablero *"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Proyecto Marketing"
                  disabled={isSubmitting}
                  autoFocus
                  leftIcon={
                    <span className="material-symbols-outlined">dashboard</span>
                  }
                />

                <div className="flex flex-col gap-2">
                  <label htmlFor="description" className="text-white text-sm font-medium leading-normal">
                    Descripción (opcional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-[#3b4b54] bg-[#111618] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none placeholder:text-[#586872] transition-all duration-200"
                    placeholder="Describe el propósito de este tablero..."
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="visibility" className="text-white text-sm font-medium leading-normal">
                    Visibilidad
                  </label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#3b4b54] bg-[#111618] text-white rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    <option value="private">Privado (solo tú y miembros invitados)</option>
                    <option value="team">Equipo (todos los miembros del equipo)</option>
                    <option value="public">Público (cualquiera con el enlace)</option>
                  </select>
                  <p className="mt-2 text-sm text-[#9db0b9]">
                    {formData.visibility === 'private' && 'Solo tú y los miembros que invites podrán ver este tablero.'}
                    {formData.visibility === 'team' && 'Todos los miembros de tu equipo podrán ver y editar este tablero.'}
                    {formData.visibility === 'public' && 'Cualquiera con el enlace podrá ver este tablero.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear tablero'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBoardModal;
