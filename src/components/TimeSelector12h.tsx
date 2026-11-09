import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';
import { formatTime12h, parseTime12h, normalizeTime12h } from '../lib/calendar-utils';

interface TimeSelector12hProps {
  value: string; // e.g. "12:00 PM"
  onChange: (timeStr: string) => void;
  disabled?: boolean;
  className?: string;
}

// Genera intervalos de 30 minutos a lo largo de las 24 horas en formato 12h (AM / PM)
const TIME_OPTIONS_12H: { label: string; period: 'AM' | 'PM'; tag?: string }[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    const label = formatTime12h(d);
    const period = h < 12 ? 'AM' : 'PM';
    let tag: string | undefined;
    if (h === 9 && m === 0) tag = 'Inicio';
    else if (h === 12 && m === 0) tag = 'Mediodía';
    else if (h === 18 && m === 0) tag = 'Fin jornada';
    TIME_OPTIONS_12H.push({ label, period, tag });
  }
}
// Añadir fin del día 11:59 PM
TIME_OPTIONS_12H.push({ label: '11:59 PM', period: 'PM', tag: 'Fin de día' });

export const TimeSelector12h: React.FC<TimeSelector12hProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() => normalizeTime12h(value, '12:00 PM'));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sincronizar input si el prop value cambia externamente
  useEffect(() => {
    setInputValue(normalizeTime12h(value, '12:00 PM'));
  }, [value]);

  const currentPeriod: 'AM' | 'PM' = useMemo(() => {
    return inputValue.toUpperCase().includes('PM') ? 'PM' : 'AM';
  }, [inputValue]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Normalizar lo escrito al cerrar
        const normalized = normalizeTime12h(inputValue, value || '12:00 PM');
        setInputValue(normalized);
        onChange(normalized);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, inputValue, value, onChange]);

  // Scroll automático a la opción activa al abrir
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  const handleSelectOption = (timeLabel: string) => {
    const normalized = normalizeTime12h(timeLabel);
    setInputValue(normalized);
    onChange(normalized);
    setIsOpen(false);
  };

  const handlePeriodToggle = (targetPeriod: 'AM' | 'PM') => {
    const parsed = parseTime12h(inputValue) || { hours: 12, minutes: 0 };
    let hours = parsed.hours;
    if (targetPeriod === 'AM' && hours >= 12) {
      hours -= 12;
    } else if (targetPeriod === 'PM' && hours < 12) {
      hours += 12;
    }
    const d = new Date();
    d.setHours(hours, parsed.minutes, 0, 0);
    const newStr = formatTime12h(d);
    setInputValue(newStr);
    onChange(newStr);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const normalized = normalizeTime12h(inputValue, value || '12:00 PM');
    setInputValue(normalized);
    onChange(normalized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const normalized = normalizeTime12h(inputValue, value || '12:00 PM');
      setInputValue(normalized);
      onChange(normalized);
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Input */}
      <div
        className={`flex items-center gap-1.5 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-all ${
          disabled
            ? 'opacity-40 cursor-not-allowed pointer-events-none'
            : 'hover:border-[#6C5DD3]/50 focus-within:border-[#6C5DD3] focus-within:ring-2 focus-within:ring-[#6C5DD3]/15'
        } ${isOpen ? 'border-[#6C5DD3] ring-2 ring-[#6C5DD3]/15' : ''}`}
      >
        <Clock size={13} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="12:00 PM"
          className="bg-transparent border-none outline-none w-16 text-center font-extrabold text-xs text-zinc-800 dark:text-zinc-100"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5 rounded transition-transform"
        >
          <ChevronDown
            size={13}
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#6C5DD3]' : ''}`}
          />
        </button>
      </div>

      {/* Floating 12h Dropdown Popover */}
      {isOpen && !disabled && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1C1F26] border border-zinc-200/90 dark:border-white/10 rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header con toggle rápido AM / PM */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-100 dark:border-white/[0.06] mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Hora (12h)
            </span>
            <div className="flex items-center bg-zinc-100 dark:bg-white/5 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => handlePeriodToggle('AM')}
                className={`px-2 py-0.5 text-[10px] font-black rounded transition-all ${
                  currentPeriod === 'AM'
                    ? 'bg-[#6C5DD3] text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle('PM')}
                className={`px-2 py-0.5 text-[10px] font-black rounded transition-all ${
                  currentPeriod === 'PM'
                    ? 'bg-[#6C5DD3] text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Lista de horas con scrollbar */}
          <div
            ref={listRef}
            className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 pr-0.5"
          >
            {TIME_OPTIONS_12H.map(opt => {
              const isActive =
                normalizeTime12h(inputValue, '') === normalizeTime12h(opt.label, '');
              return (
                <button
                  key={opt.label}
                  type="button"
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => handleSelectOption(opt.label)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-[#6C5DD3]/15 text-[#6C5DD3] dark:text-[#A599F9] font-black'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="tabular-nums">{opt.label}</span>
                  <div className="flex items-center gap-1.5">
                    {opt.tag && (
                      <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
                        {opt.tag}
                      </span>
                    )}
                    {isActive && (
                      <Check size={12} className="text-[#6C5DD3] dark:text-[#A599F9]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSelector12h;
