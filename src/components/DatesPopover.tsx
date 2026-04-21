import React, { useState } from 'react';
import { ChevronLeft, X, Check } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DatesPopoverProps {
  onClose: () => void;
  startDate: string | null;
  dueDate: string | null;
  onSaveDates: (dates: { startDate: string | null; dueDate: string | null }) => void;
  onRemoveDates: () => void;
}

const DatesPopover: React.FC<DatesPopoverProps> = ({
  onClose,
  startDate: initialStartDate,
  dueDate: initialDueDate,
  onSaveDates,
  onRemoveDates,
}) => {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = initialStartDate ? parseISO(initialStartDate) : (initialDueDate ? parseISO(initialDueDate) : undefined);
    const to = (initialStartDate && initialDueDate) ? parseISO(initialDueDate) : undefined;
    return { from, to };
  });

  const [hasStartDate, setHasStartDate] = useState(!!initialStartDate);
  const [hasDueDate, setHasDueDate] = useState(initialDueDate ? true : !initialStartDate);

  const handleRangeSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    if (newRange?.from) {
      if (!hasStartDate && !hasDueDate) {
        setHasDueDate(true);
      }
    }
  };

  const handleSave = () => {
    onSaveDates({
      startDate: hasStartDate && range?.from ? range.from.toISOString() : null,
      dueDate: hasDueDate && (range?.to || range?.from) ? (range.to || range.from)!.toISOString() : null,
    });
    onClose();
  };

  return (
    <div className="w-[320px] bg-white dark:bg-[#1C1F26] rounded-2xl shadow-xl border border-zinc-200 dark:border-white/10 flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <button 
          onClick={onClose} 
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-[10px] tracking-[0.3em] font-black text-zinc-500 dark:text-zinc-500 uppercase">
          Fechas
        </h3>
        <button 
          onClick={onClose} 
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Calendario */}
      <div className="p-4 border-b border-zinc-100 dark:border-white/5 flex justify-center bg-zinc-50/30 dark:bg-black/10">
        <style>{`
          .rdp-root {
            --rdp-accent-color: #6C5DD3;
            --rdp-range_middle-background-color: #E8E9EC;
            --rdp-range_middle-color: #6C5DD3;
            --rdp-range_start-background-color: #6C5DD3;
            --rdp-range_end-background-color: #6C5DD3;
            margin: 0;
            font-family: inherit;
          }
          .dark .rdp-root {
            --rdp-range_middle-background-color: rgba(108, 93, 211, 0.1);
            --rdp-range_middle-color: #8E82E3;
          }
          .rdp-day_button {
            border-radius: 9999px !important;
            font-weight: 600 !important;
            font-size: 0.8rem !important;
            width: 32px !important;
            height: 32px !important;
          }
          .rdp-selected .rdp-day_button {
            background-color: var(--rdp-accent-color) !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(108, 93, 211, 0.25) !important;
          }
          .rdp-range_middle .rdp-day_button {
            background-color: #F0F1F3 !important;
            color: #6C5DD3 !important;
            border-radius: 0 !important;
          }
          .dark .rdp-range_middle .rdp-day_button {
            background-color: rgba(108, 93, 211, 0.1) !important;
            color: #8E82E3 !important;
          }
          .rdp-range_start .rdp-day_button {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          .rdp-range_end .rdp-day_button {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
          }
          .rdp-day_button:hover:not([disabled]):not(.rdp-selected) {
            background-color: #F0F1F3 !important;
            color: #6C5DD3 !important;
          }
          .dark .rdp-day_button:hover:not([disabled]):not(.rdp-selected) {
            background-color: rgba(255, 255, 255, 0.05) !important;
            color: #f4f4f5 !important;
          }
          .rdp-head_cell {
            color: #71717a;
            font-weight: 800;
            font-size: 0.65rem;
            text-transform: uppercase;
            padding-bottom: 0.75rem;
            letter-spacing: 0.05em;
          }
          .rdp-month_caption {
            font-weight: 800;
            color: #18181b;
            font-size: 0.85rem;
            padding: 0 0.5rem 1.25rem;
            letter-spacing: -0.01em;
          }
          .dark .rdp-month_caption {
            color: #f4f4f5;
          }
          .rdp-nav_button {
            color: #71717a !important;
            border-radius: 8px !important;
          }
          .rdp-nav_button:hover {
            background-color: #F0F1F3 !important;
          }
          .dark .rdp-nav_button:hover {
            background-color: rgba(255, 255, 255, 0.05) !important;
          }
        `}</style>
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          locale={es}
          className="m-0"
          defaultMonth={range?.from || range?.to || new Date()}
        />
      </div>

      {/* Controles de Fecha */}
      <div className="p-4 flex flex-col gap-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Fecha de inicio</label>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setHasStartDate(!hasStartDate)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                hasStartDate 
                  ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white' 
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-[#13151A]'
              }`}
            >
              {hasStartDate && <Check size={12} strokeWidth={4} />}
            </div>
            <input 
              type="text"
              readOnly
              disabled={!hasStartDate}
              placeholder="D/M/AAAA"
              value={range?.from ? format(range.from, 'd/M/yyyy') : ''}
              className={`bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100 w-full outline-none transition-all ${!hasStartDate ? 'opacity-40 cursor-not-allowed' : 'focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3]'}`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Fecha de vencimiento</label>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setHasDueDate(!hasDueDate)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                hasDueDate 
                  ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white' 
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-[#13151A]'
              }`}
            >
              {hasDueDate && <Check size={12} strokeWidth={4} />}
            </div>
            <div className="flex-1 flex gap-2">
              <input 
                type="text"
                readOnly
                disabled={!hasDueDate}
                placeholder="D/M/AAAA"
                value={hasDueDate ? (range?.to ? format(range.to, 'd/M/yyyy') : (range?.from && !hasStartDate ? format(range.from, 'd/M/yyyy') : '')) : ''}
                className={`bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100 w-full outline-none transition-all ${!hasDueDate ? 'opacity-40 cursor-not-allowed' : 'focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3]'}`}
              />
              <input 
                type="text"
                disabled={!hasDueDate}
                defaultValue="12:00"
                className={`bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl p-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100 w-20 text-center outline-none transition-all ${!hasDueDate ? 'opacity-40 cursor-not-allowed' : 'focus:ring-4 focus:ring-[#6C5DD3]/10 focus:border-[#6C5DD3]'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-4 pb-5 pt-2 flex flex-col gap-3">
        <button 
          onClick={handleSave}
          className="w-full bg-[#6C5DD3] hover:bg-[#312e81] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#6C5DD3]/20 active:scale-[0.98] text-sm"
        >
          Guardar fechas
        </button>
        <button 
          onClick={() => { onRemoveDates(); onClose(); }}
          className="w-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-bold py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-[0.98] text-sm"
        >
          Quitar fechas
        </button>
      </div>
    </div>
  );
};

export default DatesPopover;
