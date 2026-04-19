import React, { useState } from 'react';
import { Search, Edit2, X, ChevronLeft, Check } from 'lucide-react';

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
  '#10B981', '#D97706', '#F59E0B', '#EF4444', '#7A5AF8',
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
      <div className="w-72 bg-white rounded-[16px] shadow-[0_20px_60px_-15px_rgba(122,90,248,0.3)] border border-purple-50 p-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setCurrentView('list')}
            className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="text-[10px] tracking-[0.4em] font-extrabold text-[#806F9B] uppercase">
            {isEdit ? 'Editar Etiqueta' : 'Crear Etiqueta'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="bg-slate-50 rounded-xl p-6 flex justify-center mb-4">
          <div 
            style={{ backgroundColor: labelColor }}
            className="px-4 py-1.5 rounded-md text-sm font-bold text-white shadow-sm transition-all"
          >
            {labelName || 'Nombre de etiqueta...'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">Título</label>
            <input 
              type="text"
              autoFocus
              placeholder="Ej: Frontend, Urgente..."
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              className="bg-[#F3E8FF] rounded-lg p-2 text-sm text-zinc-900 w-full outline-none focus:ring-2 focus:ring-[#7A5AF8]/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-2">Selecciona un color</label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLabelColor(color)}
                  style={{ backgroundColor: color }}
                  className={`
                    h-8 rounded-md transition-all flex items-center justify-center
                    ${labelColor === color ? 'ring-2 ring-zinc-400 ring-offset-2 scale-110 shadow-md' : 'hover:opacity-80'}
                  `}
                >
                  {labelColor === color && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="submit"
              disabled={!labelName.trim()}
              className="flex-1 bg-[#7A5AF8] text-white font-bold py-2 rounded-lg hover:bg-[#694de3] transition-colors shadow-lg shadow-purple-100 disabled:opacity-50 disabled:shadow-none"
            >
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
            {isEdit && (
              <button 
                type="button"
                onClick={handleDelete}
                className="bg-rose-50 text-[#E91E63] px-4 rounded-lg font-bold hover:bg-rose-100 transition-colors"
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
    <div className="w-72 bg-white rounded-[16px] shadow-[0_20px_60px_-15px_rgba(122,90,248,0.3)] border border-purple-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-extrabold text-[#806F9B] tracking-[0.1em] uppercase">
          Etiquetas
        </h3>
        <button 
          onClick={onClose}
          className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <input 
          type="text"
          placeholder="Buscar etiquetas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#F3E8FF] rounded-[8px] p-2 pl-8 text-sm text-zinc-900 w-full outline-none focus:ring-2 focus:ring-[#7A5AF8]/50 transition-all"
        />
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#806F9B]" />
      </div>

      {/* Lista de Etiquetas */}
      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent custom-scrollbar">
        {filteredLabels.map((label) => (
          <div key={label.id} className="flex items-center gap-2 group">
            <input 
              type="checkbox"
              checked={selectedLabelIds.includes(label.id)}
              onChange={() => onToggleLabel(label.id)}
              className="accent-[#7A5AF8] w-4 h-4 cursor-pointer"
            />
            <div 
              onClick={() => onToggleLabel(label.id)}
              style={{ backgroundColor: label.color }}
              className="flex-1 h-8 rounded-md flex items-center px-3 text-sm font-bold text-white cursor-pointer transition-opacity hover:opacity-90 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {label.name}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openEditView(label);
              }}
              className="text-slate-400 hover:text-zinc-700 p-1 transition-colors"
            >
              <Edit2 size={14} />
            </button>
          </div>
        ))}

        {filteredLabels.length === 0 && (
          <p className="text-xs text-center text-[#806F9B] py-4">
            No se encontraron etiquetas.
          </p>
        )}
      </div>

      {/* Footer */}
      <hr className="border-purple-50 my-3" />
      <button 
        onClick={() => {
          setLabelName('');
          setLabelColor(PRESET_COLORS[0]);
          setCurrentView('create');
        }}
        className="w-full text-left text-sm font-bold text-[#806F9B] hover:text-[#7A5AF8] hover:bg-[#F3E8FF] p-2 rounded-lg transition-colors"
      >
        Crear una etiqueta nueva
      </button>
    </div>
  );
};

export default LabelsPopover;

