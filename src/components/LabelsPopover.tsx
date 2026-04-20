import React, { useState } from 'react';
import { Search, Edit2, X, ChevronLeft, Check, Plus } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelsPopoverProps {
  onClose: () => void;
  selectedLabelIds: string[];
  labels: Label[];
  onToggleLabel: (id: string) => void;
  onEditLabel: (labelId: string, name: string, color: string) => void;
  onCreateLabel: (name: string, color: string) => void;
  onDeleteLabel: (labelId: string) => void;
}

const PRESET_COLORS = [
  // Fila 1: Tonos Oscuros Profundos
  '#064E3B', '#451A03', '#78350F', '#7F1D1D', '#4C1D95',
  // Fila 2: Tonos Tierra y Bosque
  '#065F46', '#92400E', '#B45309', '#991B1B', '#6D28D9',
  // Fila 3: Tonos Estándar Trello
  '#10B981', '#D97706', '#F59E0B', '#EF4444', '#6C5DD3',
  // Fila 4: Tonos Vibrantes
  '#34D399', '#FBBF24', '#FB923C', '#F87171', '#A78BFA',
  // Fila 5: Azules y Fríos
  '#1E3A8A', '#134E4A', '#0891B2', '#1E40AF', '#374151',
  // Fila 6: Tonos Pastel y Grises
  '#60A5FA', '#22D3EE', '#A3E635', '#F472B6', '#9CA3AF',
];

const LabelsPopover: React.FC<LabelsPopoverProps> = ({ 
  onClose, 
  selectedLabelIds, 
  labels,
  onToggleLabel,
  onEditLabel,
  onCreateLabel,
  onDeleteLabel
}) => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  
  // Form state
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState(PRESET_COLORS[0]);

  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelName.trim()) return;
    onCreateLabel(labelName, labelColor);
    setLabelName('');
    setCurrentView('list');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabel || !labelName.trim()) return;
    onEditLabel(editingLabel.id, labelName, labelColor);
    setCurrentView('list');
  };

  const openEditView = (label: Label) => {
    setEditingLabel(label);
    setLabelName(label.name);
    setLabelColor(label.color);
    setCurrentView('edit');
  };

  const handleDelete = () => {
    if (!editingLabel) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar esta etiqueta? Se quitará de todas las tarjetas.')) {
      onDeleteLabel(editingLabel.id);
      setCurrentView('list');
    }
  };

  if (currentView === 'create' || currentView === 'edit') {
    const isEdit = currentView === 'edit';
    return (
      <div className="w-72 bg-white dark:bg-[#1C1F26] rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10 p-4 animate-in fade-in zoom-in duration-200 max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setCurrentView('list')}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="text-[10px] tracking-[0.3em] font-black text-zinc-500 dark:text-zinc-500 uppercase">
            {isEdit ? 'Editar Etiqueta' : 'Crear Etiqueta'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="bg-zinc-50 dark:bg-[#13151A] rounded-2xl p-6 flex justify-center mb-6 border border-zinc-100 dark:border-white/5 shadow-inner">
          <div 
            style={{ backgroundColor: labelColor }}
            className="px-5 py-2 rounded-xl text-xs font-black text-white shadow-md transition-all uppercase tracking-wider"
          >
            {labelName || 'PREVISUALIZACIÓN'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Título</label>
            <input 
              type="text"
              autoFocus
              placeholder="Ej: Frontend, Urgente..."
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              className="bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 w-full outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Selecciona un color</label>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLabelColor(color)}
                  style={{ backgroundColor: color }}
                  className={`
                    h-8 rounded-lg transition-all flex items-center justify-center relative group
                    ${labelColor === color ? 'ring-2 ring-[#6C5DD3] ring-offset-2 dark:ring-offset-[#1C1F26] scale-110 z-10' : 'hover:scale-105'}
                  `}
                >
                  {labelColor === color && (
                    <div className="bg-white/20 rounded-full p-0.5">
                      <Check size={12} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="submit"
              disabled={!labelName.trim()}
              className="flex-1 bg-[#6C5DD3] hover:bg-[#5a4cb3] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#6C5DD3]/20 disabled:opacity-50 active:scale-[0.98] text-sm"
            >
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
            {isEdit && (
              <button 
                type="button"
                onClick={handleDelete}
                className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/20 active:scale-[0.98] text-sm"
              >
                Eliminar
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white dark:bg-[#1C1F26] rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10 flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-[10px] tracking-[0.3em] font-black text-zinc-500 dark:text-zinc-500 uppercase">
          Etiquetas
        </h3>
        <button 
          onClick={onClose}
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-3">
        <div className="relative group">
          <input 
            type="text"
            placeholder="Buscar etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 pl-9 text-xs font-bold text-zinc-900 dark:text-zinc-100 w-full outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3] transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#6C5DD3] transition-colors" />
        </div>
      </div>

      {/* Label List */}
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto px-2 pb-2 custom-scrollbar">
        {filteredLabels.map((label) => {
          const isSelected = selectedLabelIds.includes(label.id);
          return (
            <div key={label.id} className="flex items-center gap-2 group px-1">
              <div 
                onClick={() => onToggleLabel(label.id)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white' 
                    : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-[#13151A]'
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={4} />}
              </div>
              <div 
                onClick={() => onToggleLabel(label.id)}
                style={{ backgroundColor: label.color }}
                className="flex-1 h-8 rounded-lg flex items-center px-3 text-[11px] font-black text-white cursor-pointer transition-all hover:brightness-110 overflow-hidden text-ellipsis whitespace-nowrap shadow-sm uppercase tracking-wider"
              >
                {label.name}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openEditView(label);
                }}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-[#6C5DD3] dark:hover:text-[#6C5DD3] hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit2 size={14} />
              </button>
            </div>
          );
        })}

        {filteredLabels.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-zinc-300 dark:text-zinc-700" />
            </div>
            <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">
              Sin etiquetas encontradas
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5">
        <button 
          onClick={() => {
            setLabelName('');
            setLabelColor(PRESET_COLORS[0]);
            setCurrentView('create');
          }}
          className="w-full flex items-center gap-2 text-xs font-bold text-[#6C5DD3] hover:bg-white dark:hover:bg-[#1C1F26] p-2.5 rounded-xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10 hover:shadow-sm"
        >
          <Plus size={16} />
          Crear nueva etiqueta
        </button>
      </div>
    </div>
  );
};

export default LabelsPopover;
