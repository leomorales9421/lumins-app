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
    <div className="w-72 bg-white dark:bg-[#1C1F26] rounded shadow-dropdown border border-zinc-200 dark:border-white/10 flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="relative border-b border-zinc-100 dark:border-white/5 py-3">
        <h3 className="text-center text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 tracking-[0.1em] uppercase">
          Añadir a la tarjeta
        </h3>
        <button 
          onClick={onClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded transition-colors"
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
              className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/5 group cursor-pointer border-b border-zinc-100 dark:border-white/5 last:border-0"
            >
              <div className="bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 p-2 rounded group-hover:bg-white dark:group-hover:bg-[#1C1F26] group-hover:text-[#6C5DD3] transition-colors border border-transparent group-hover:border-zinc-200 dark:group-hover:border-white/10">
                <Icon size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  {option.title}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
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
