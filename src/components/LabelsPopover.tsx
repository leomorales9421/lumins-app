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
  onEditLabel: (label: Label) => void;
  onCreateLabel: (name: string, color: string) => void;
}

const PRESET_COLORS = [
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#F97316', // Orange 500
  '#E91E63', // Brand Pink / Crimson
  '#7A5AF8', // Brand Purple
  '#3B82F6', // Blue 500
];

const LabelsPopover: React.FC<LabelsPopoverProps> = ({ 
  onClose, 
  selectedLabelIds, 
  labels,
  onToggleLabel,
  onEditLabel,
  onCreateLabel
}) => {
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create form state
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    onCreateLabel(newLabelName, newLabelColor);
    setNewLabelName('');
    setCurrentView('list');
  };

  if (currentView === 'create') {
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
            Crear Etiqueta
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
            style={{ backgroundColor: newLabelColor }}
            className="px-4 py-1.5 rounded-md text-sm font-bold text-white shadow-sm transition-all"
          >
            {newLabelName || 'Nombre de etiqueta...'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-1">Título</label>
            <input 
              type="text"
              autoFocus
              placeholder="Ej: Frontend, Urgente..."
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="bg-[#F3E8FF] rounded-lg p-2 text-sm text-zinc-900 w-full outline-none focus:ring-2 focus:ring-[#7A5AF8]/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-900 mb-2">Selecciona un color</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewLabelColor(color)}
                  style={{ backgroundColor: color }}
                  className={`
                    h-8 rounded-md transition-all flex items-center justify-center
                    ${newLabelColor === color ? 'ring-2 ring-zinc-400 ring-offset-2 scale-110 shadow-md' : 'hover:opacity-80'}
                  `}
                >
                  {newLabelColor === color && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={!newLabelName.trim()}
            className="w-full bg-[#7A5AF8] text-white font-bold py-2 rounded-lg mt-4 hover:bg-[#694de3] transition-colors shadow-lg shadow-purple-100 disabled:opacity-50 disabled:shadow-none"
          >
            Crear etiqueta
          </button>
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
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
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
              className="flex-1 h-8 rounded-md flex items-center px-3 text-sm font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
            >
              {label.name}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEditLabel(label);
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
        onClick={() => setCurrentView('create')}
        className="w-full text-left text-sm font-bold text-[#806F9B] hover:text-[#7A5AF8] hover:bg-[#F3E8FF] p-2 rounded-lg transition-colors"
      >
        Crear una etiqueta nueva
      </button>
    </div>
  );
};

export default LabelsPopover;

