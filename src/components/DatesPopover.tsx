import React, { useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
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
  const [range, setRange] = useState<DateRange | undefined>({
    from: initialStartDate ? parseISO(initialStartDate) : undefined,
    to: initialDueDate ? parseISO(initialDueDate) : undefined,
  });

  const [hasStartDate, setHasStartDate] = useState(!!initialStartDate);
  const [hasDueDate, setHasDueDate] = useState(!!initialDueDate || true);

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
    <div className="w-[320px] bg-white rounded-[16px] shadow-[0_20px_60px_-15px_rgba(122,90,248,0.3)] border border-purple-50 flex flex-col animate-in fade-in zoom-in duration-200 max-h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <button onClick={onClose} className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-[10px] tracking-[0.4em] font-bold text-[#806F9B] uppercase">FECHAS</h3>
        <button onClick={onClose} className="p-1 text-[#806F9B] hover:bg-slate-50 rounded-md transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Calendario */}
      <div className="p-4 border-b border-purple-50 flex justify-center bg-white">
        <style>{`
          .rdp-root {
            --rdp-accent-color: #7A5AF8;
            --rdp-range_middle-background-color: #F3E8FF;
            --rdp-range_middle-color: #7A5AF8;
            --rdp-range_start-background-color: #7A5AF8;
            --rdp-range_end-background-color: #7A5AF8;
            margin: 0;
          }
          .rdp-day_button {
            border-radius: 100% !important;
          }
          .rdp-selected .rdp-day_button {
            background-color: var(--rdp-accent-color) !important;
            color: white !important;
          }
          .rdp-range_middle .rdp-day_button {
            background-color: #F3E8FF !important;
            color: #7A5AF8 !important;
            border-radius: 0 !important;
          }
          .rdp-range_start .rdp-day_button {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          .rdp-range_end .rdp-day_button {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
          }
          .rdp-day_button:hover:not([disabled]) {
            background-color: #F3E8FF !important;
            color: #7A5AF8 !important;
          }
          .rdp-head_cell {
            color: #18181b;
            font-weight: 700;
            font-size: 0.75rem;
            text-transform: uppercase;
            padding-bottom: 0.5rem;
          }
          .rdp-month_caption {
            font-weight: 800;
            color: #18181b;
            font-size: 0.875rem;
            padding: 0 0.5rem 1rem;
          }
        `}</style>
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          locale={es}
          className="m-0"
        />
      </div>

      {/* Controles de Fecha */}
      <div className="p-4 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-zinc-900 mb-1">Fecha de inicio</label>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={hasStartDate}
              onChange={(e) => setHasStartDate(e.target.checked)}
              className="w-4 h-4 accent-[#7A5AF8] rounded-sm cursor-pointer"
            />
            <input 
              type="text"
              readOnly
              disabled={!hasStartDate}
              placeholder="D/M/AAAA"
              value={range?.from ? format(range.from, 'd/M/yyyy') : ''}
              className={`bg-[#F3E8FF] rounded-lg p-2 text-sm text-zinc-900 w-full outline-none transition-all ${!hasStartDate ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-[#7A5AF8]/50'}`}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-900 mb-1">Fecha de vencimiento</label>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={hasDueDate}
              onChange={(e) => setHasDueDate(e.target.checked)}
              className="w-4 h-4 accent-[#7A5AF8] rounded-sm cursor-pointer"
            />
            <div className="flex-1 flex gap-2">
              <input 
                type="text"
                readOnly
                disabled={!hasDueDate}
                placeholder="D/M/AAAA"
                value={range?.to ? format(range.to, 'd/M/yyyy') : (range?.from && hasDueDate ? format(range.from, 'd/M/yyyy') : '')}
                className={`bg-[#F3E8FF] rounded-lg p-2 text-sm text-zinc-900 w-full outline-none transition-all ${!hasDueDate ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-[#7A5AF8]/50'}`}
              />
              <input 
                type="text"
                disabled={!hasDueDate}
                defaultValue="12:00"
                className={`bg-[#F3E8FF] rounded-lg p-2 text-sm text-zinc-900 w-20 text-center outline-none transition-all ${!hasDueDate ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-[#7A5AF8]/50'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
        <button 
          onClick={handleSave}
          className="w-full bg-[#7A5AF8] text-white font-bold py-2 rounded-lg hover:bg-[#694de3] transition-colors shadow-lg shadow-purple-100"
        >
          Guardar
        </button>
        <button 
          onClick={() => { onRemoveDates(); onClose(); }}
          className="w-full bg-slate-100 text-[#806F9B] font-bold py-2 rounded-lg hover:bg-slate-200 hover:text-zinc-900 transition-colors"
        >
          Quitar
        </button>
      </div>
    </div>
  );
};

export default DatesPopover;
