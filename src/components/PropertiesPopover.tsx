import React, { useState, useEffect } from 'react';
import { ChevronLeft, X, Zap, Circle } from 'lucide-react';

interface PropertiesPopoverProps {
  onClose: () => void;
  onBack: () => void;
  currentPriority?: 'P0' | 'P1' | 'P2' | 'P3' | null;
  currentRiskLevel?: 'low' | 'med' | 'high' | null;
  currentModule?: string | null;
  onUpdate: (properties: { priority?: string | null; riskLevel?: string | null; module?: string | null }) => void;
}

const PRIORITIES = [
  { id: 'P0', label: 'P0 - Crítica', color: '#E91E63' },
  { id: 'P1', label: 'P1 - Alta', color: '#F97316' },
  { id: 'P2', label: 'P2 - Media', color: '#F59E0B' },
  { id: 'P3', label: 'P3 - Baja', color: '#806F9B' },
  { id: null, label: 'Sin prioridad', color: '#E2E8F0' },
];

const RISK_LEVELS = [
  { id: 'high', label: 'Alto', bg: 'bg-red-100', text: 'text-red-700' },
  { id: 'med', label: 'Medio', bg: 'bg-amber-100', text: 'text-amber-700' },
  { id: 'low', label: 'Bajo', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { id: null, label: 'No evaluado', bg: 'bg-zinc-100', text: 'text-zinc-700' },
];

const PropertiesPopover: React.FC<PropertiesPopoverProps> = ({
  onClose,
  onBack,
  currentPriority,
  currentRiskLevel,
  currentModule,
  onUpdate,
}) => {
  const [priority, setPriority] = useState(currentPriority);
  const [riskLevel, setRiskLevel] = useState(currentRiskLevel);
  const [module, setModule] = useState(currentModule || '');
  const [activeSelect, setActiveSelect] = useState<'priority' | 'risk' | null>(null);

  useEffect(() => {
    setPriority(currentPriority);
  }, [currentPriority]);

  useEffect(() => {
    setRiskLevel(currentRiskLevel);
  }, [currentRiskLevel]);

  useEffect(() => {
    setModule(currentModule || '');
  }, [currentModule]);

  const handlePrioritySelect = (p: 'P0' | 'P1' | 'P2' | 'P3' | null) => {
    setPriority(p);
    onUpdate({ priority: p });
    setActiveSelect(null);
  };

  const handleRiskSelect = (r: 'low' | 'med' | 'high' | null) => {
    setRiskLevel(r);
    onUpdate({ riskLevel: r });
    setActiveSelect(null);
  };

  const handleModuleBlur = () => {
    if (module !== currentModule) {
      onUpdate({ module: module || null });
    }
  };

  return (
    <div className="w-[300px] bg-white rounded-[16px] shadow-[0_20px_60px_-15px_rgba(122,90,248,0.3)] border border-purple-50 flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <button onClick={onBack} className="p-1 hover:bg-purple-50 rounded-full transition-colors">
          <ChevronLeft size={18} className="text-[#806F9B]" />
        </button>
        <span className="text-[10px] tracking-[0.4em] font-bold text-[#806F9B] uppercase">PROPIEDADES</span>
        <button onClick={onClose} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
          <X size={18} className="text-[#806F9B]" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        {/* Priority Select */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-xs font-bold text-zinc-900">Nivel de Prioridad</label>
          <button
            onClick={() => setActiveSelect(activeSelect === 'priority' ? null : 'priority')}
            className="bg-[#F3E8FF] rounded-lg p-2.5 text-sm text-zinc-900 w-full flex justify-between items-center hover:bg-purple-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Circle size={8} fill={PRIORITIES.find(p => p.id === priority)?.color || '#E2E8F0'} className="text-transparent" />
              <span>{PRIORITIES.find(p => p.id === priority)?.label || 'Sin prioridad'}</span>
            </div>
            <ChevronLeft size={16} className={`text-[#806F9B] transition-transform ${activeSelect === 'priority' ? '-rotate-90' : 'rotate-270'}`} />
          </button>
          
          {activeSelect === 'priority' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-50 rounded-lg shadow-xl z-10 overflow-hidden py-1 animate-in slide-in-from-top-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id === null ? 'null' : p.id}
                  onClick={() => handlePrioritySelect(p.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F3E8FF] transition-colors ${priority === p.id ? 'bg-purple-50 font-bold' : ''}`}
                >
                  <Circle size={8} fill={p.color} className="text-transparent" />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Risk Level Select */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-xs font-bold text-zinc-900">Nivel de Riesgo</label>
          <button
            onClick={() => setActiveSelect(activeSelect === 'risk' ? null : 'risk')}
            className="bg-[#F3E8FF] rounded-lg p-2.5 text-sm text-zinc-900 w-full flex justify-between items-center hover:bg-purple-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${RISK_LEVELS.find(r => r.id === riskLevel)?.bg || 'bg-zinc-100'} ${RISK_LEVELS.find(r => r.id === riskLevel)?.text || 'text-zinc-700'}`}>
                {RISK_LEVELS.find(r => r.id === riskLevel)?.label || 'No evaluado'}
              </span>
            </div>
            <ChevronLeft size={16} className={`text-[#806F9B] transition-transform ${activeSelect === 'risk' ? '-rotate-90' : 'rotate-270'}`} />
          </button>

          {activeSelect === 'risk' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-50 rounded-lg shadow-xl z-10 overflow-hidden py-1 animate-in slide-in-from-top-2">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r.id === null ? 'null' : r.id}
                  onClick={() => handleRiskSelect(r.id as any)}
                  className={`w-full flex items-center px-3 py-2 text-sm hover:bg-[#F3E8FF] transition-colors ${riskLevel === r.id ? 'bg-purple-50 font-bold' : ''}`}
                >
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.bg} ${r.text}`}>
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Module Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-zinc-900">Módulo o Componente</label>
          <input
            type="text"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            onBlur={handleModuleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleModuleBlur()}
            placeholder="Ej. Frontend, Backend..."
            className="bg-[#F3E8FF] rounded-lg p-2.5 text-sm text-zinc-900 w-full outline-none focus:bg-purple-200 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default PropertiesPopover;
