import React from 'react';
import { 
  Tag, 
  Users, 
  Clock, 
  CheckSquare, 
  Paperclip, 
  Zap, 
  X 
} from 'lucide-react';

interface MenuOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

interface AddPopoverMenuProps {
  onClose: () => void;
  onSelectOption: (option: string) => void;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    id: 'labels',
    title: 'Etiquetas',
    subtitle: 'Organizar y categorizar',
    icon: Tag,
  },
  {
    id: 'members',
    title: 'Miembros',
    subtitle: 'Asignar responsables',
    icon: Users,
  },
  {
    id: 'dates',
    title: 'Fechas',
    subtitle: 'Plazos y recordatorios',
    icon: Clock,
  },
  {
    id: 'checklist',
    title: 'Checklist',
    subtitle: 'Añadir subtareas',
    icon: CheckSquare,
  },
  {
    id: 'attachment',
    title: 'Adjunto',
    subtitle: 'Subir archivos e imágenes',
    icon: Paperclip,
  },
  {
    id: 'properties',
    title: 'Propiedades',
    subtitle: 'Prioridad, Riesgo y Módulo',
    icon: Zap,
  },
];

const AddPopoverMenu: React.FC<AddPopoverMenuProps> = ({ onClose, onSelectOption }) => {
  return (
    <div className="w-72 bg-white rounded-[16px] shadow-[0_20px_60px_-15px_rgba(122,90,248,0.3)] border border-purple-50 flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="relative border-b border-purple-50 py-3">
        <h3 className="text-center text-xs font-extrabold text-[#806F9B] tracking-[0.1em] uppercase">
          Añadir a la tarjeta
        </h3>
        <button 
          onClick={onClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Options List */}
      <div className="flex flex-col">
        {MENU_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => {
                onSelectOption(option.id);
              }}
              className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-[#F3E8FF] group cursor-pointer border-b border-zinc-50 last:border-0"
            >
              <div className="bg-slate-50 text-[#806F9B] p-2 rounded-lg group-hover:bg-white group-hover:text-[#7A5AF8] transition-colors">
                <Icon size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900 text-sm">
                  {option.title}
                </span>
                <span className="text-xs text-[#806F9B]">
                  {option.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AddPopoverMenu;
