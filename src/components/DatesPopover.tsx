import React, { useState } from 'react';
import { ChevronLeft, X, Check } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import TimeSelector12h from './TimeSelector12h';
import { formatTime12h, parseTime12h } from '../lib/calendar-utils';

interface DatesPopoverProps {
  onClose: () => void;
  startDate: string | null;
  dueDate: string | null;
  onSaveDates: (dates: { startDate: string | null; dueDate: string | null }) => void;
  onRemoveDates: () => void;
  className?: string;
}

const DatesPopover: React.FC<DatesPopoverProps> = ({
  onClose,
  startDate: initialStartDate,
  dueDate: initialDueDate,
  onSaveDates,
  onRemoveDates,
  className,
}) => {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = initialStartDate ? parseISO(initialStartDate) : (initialDueDate ? parseISO(initialDueDate) : undefined);
    const to = (initialStartDate && initialDueDate) ? parseISO(initialDueDate) : undefined;
    return { from, to };
  });

  const [hasStartDate, setHasStartDate] = useState(!!initialStartDate);
  const [hasDueDate, setHasDueDate] = useState(initialDueDate ? true : !initialStartDate);
  const [dueTime, setDueTime] = useState<string>(() => {
    if (initialDueDate) {
      try {
        const d = parseISO(initialDueDate);
        if (!isNaN(d.getTime())) {
          return formatTime12h(d) || '12:00 PM';
        }
      } catch {}
    }
    return '12:00 PM';
  });

  const handleRangeSelect = (newRange: DateRange | undefined) => {
    setRange(newRange);
    if (newRange?.from) {
      if (!hasStartDate && !hasDueDate) {
        setHasDueDate(true);
      }
    }
  };

  const handleSave = () => {
    const rawTargetDue = hasDueDate
      ? (range?.to || (hasStartDate ? range?.to || range?.from : range?.from))
      : null;

    let finalDueDateISO: string | null = null;
    if (hasDueDate && rawTargetDue) {
      const targetDate = new Date(rawTargetDue);
      const timeParsed = parseTime12h(dueTime) || { hours: 12, minutes: 0 };
      targetDate.setHours(timeParsed.hours, timeParsed.minutes, 0, 0);
      finalDueDateISO = targetDate.toISOString();
    }

    onSaveDates({
      startDate: hasStartDate && range?.from ? range.from.toISOString() : null,
      dueDate: finalDueDateISO,
    });
    onClose();
  };

  return (
    <div className={`bg-white dark:bg-[#1C1F26] flex flex-col max-h-[85dvh] overflow-y-auto ${className || 'w-[304px] sm:w-[312px] rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-white/10 animate-in fade-in zoom-in-95 duration-150'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-100 dark:border-white/5 shrink-0">
        <button 
          type="button"
          onClick={onClose} 
          className="p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer"
          aria-label="Volver"
        >
          <ChevronLeft size={15} />
        </button>
        <h3 className="text-[10px] tracking-[0.25em] font-black text-zinc-500 dark:text-zinc-400 uppercase">
          Fechas
        </h3>
        <button 
          type="button"
          onClick={onClose} 
          className="p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer"
          aria-label="Cerrar"
        >
          <X size={15} />
        </button>
      </div>

      {/* Calendario */}
      <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-white/5 flex justify-center bg-zinc-50/40 dark:bg-black/10">
        <style>{`
          .rdp-root {
            --rdp-accent-color: var(--lumins-accent);
            --rdp-range_middle-background-color: var(--lumins-accent-soft);
            --rdp-range_middle-color: var(--lumins-accent-fg);
            --rdp-range_start-background-color: var(--lumins-accent);
            --rdp-range_end-background-color: var(--lumins-accent);
            --rdp-day-width: 34px;
            --rdp-day-height: 30px;
            margin: 0;
            font-family: inherit;
          }
          .rdp-day_button {
            border-radius: 9999px !important;
            font-weight: 600 !important;
            font-size: 0.75rem !important;
            width: 30px !important;
            height: 28px !important;
          }
          .rdp-selected .rdp-day_button {
            background-color: var(--lumins-accent) !important;
            color: var(--lumins-accent-on) !important;
            box-shadow: none !important;
          }
          .rdp-range_middle {
            background-color: var(--lumins-accent-soft) !important;
          }
          .rdp-range_middle .rdp-day_button {
            background-color: transparent !important;
            color: var(--lumins-accent-fg) !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .rdp-range_start {
            background: linear-gradient(90deg, transparent 50%, var(--lumins-accent-soft) 50%) !important;
          }
          .rdp-range_end {
            background: linear-gradient(90deg, var(--lumins-accent-soft) 50%, transparent 50%) !important;
          }
          .rdp-range_start.rdp-range_end {
            background: transparent !important;
          }
          .rdp-day_button:hover:not([disabled]):not(.rdp-selected) {
            background-color: var(--lumins-accent-soft) !important;
            color: var(--lumins-accent-fg) !important;
          }
          .dark .rdp-day_button:hover:not([disabled]):not(.rdp-selected) {
            background-color: rgba(255, 255, 255, 0.06) !important;
            color: #f4f4f5 !important;
          }
          .rdp-head_cell {
            color: #71717a;
            font-weight: 800;
            font-size: 0.625rem;
            text-transform: uppercase;
            padding-bottom: 0.35rem;
            letter-spacing: 0.05em;
          }
          .rdp-month_caption {
            font-weight: 800;
            color: #18181b;
            font-size: 0.8rem;
            padding: 0 0.25rem 0.5rem;
            letter-spacing: -0.01em;
          }
          .dark .rdp-month_caption {
            color: #f4f4f5;
          }
          .rdp-nav_button {
            color: #71717a !important;
            border-radius: 8px !important;
            width: 26px !important;
            height: 26px !important;
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
      <div className="px-3.5 py-3 flex flex-col gap-2.5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Fecha de inicio</label>
          <div className="flex items-center gap-2">
            <div 
              onClick={() => setHasStartDate(!hasStartDate)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                hasStartDate 
                  ? 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)]' 
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-[#13151A]'
              }`}
            >
              {hasStartDate && <Check size={10} strokeWidth={4} />}
            </div>
            <input 
              type="text"
              readOnly
              disabled={!hasStartDate}
              placeholder="D/M/AAAA"
              value={range?.from ? format(range.from, 'd/M/yyyy') : ''}
              className={`h-8 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 w-full outline-none transition-all ${!hasStartDate ? 'opacity-40 cursor-not-allowed' : 'focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)]'}`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Fecha de vencimiento</label>
          <div className="flex items-center gap-2">
            <div 
              onClick={() => setHasDueDate(!hasDueDate)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                hasDueDate 
                  ? 'bg-[var(--lumins-accent)] border-[var(--lumins-accent)] text-[var(--lumins-accent-on)]' 
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-[#13151A]'
              }`}
            >
              {hasDueDate && <Check size={10} strokeWidth={4} />}
            </div>
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <input 
                type="text"
                readOnly
                disabled={!hasDueDate}
                placeholder="D/M/AAAA"
                value={hasDueDate ? (range?.to ? format(range.to, 'd/M/yyyy') : (range?.from && !hasStartDate ? format(range.from, 'd/M/yyyy') : '')) : ''}
                className={`h-8 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 flex-1 min-w-0 outline-none transition-all ${!hasDueDate ? 'opacity-40 cursor-not-allowed' : 'focus:ring-2 focus:ring-[var(--lumins-accent)]/20 focus:border-[var(--lumins-accent)]'}`}
              />
              <TimeSelector12h
                value={dueTime}
                onChange={setDueTime}
                disabled={!hasDueDate}
                direction="up"
                className="shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Acciones compactas en una fila */}
        <div className="flex items-center gap-2 pt-1.5">
          <button 
            type="button"
            onClick={() => { onRemoveDates(); onClose(); }}
            className="h-8 px-3 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-[0.98] text-xs cursor-pointer"
          >
            Quitar
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="flex-1 h-8 bg-[var(--lumins-accent)] hover:brightness-95 text-[var(--lumins-accent-on)] font-bold rounded-lg transition-all shadow-xs active:scale-[0.98] text-xs cursor-pointer"
          >
            Guardar fechas
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatesPopover;
