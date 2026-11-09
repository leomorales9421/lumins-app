import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';
import { formatTime12h, parseTime12h, normalizeTime12h } from '../lib/calendar-utils';

interface TimeSelector12hProps {
  value: string; // e.g. "12:00 PM"
  onChange: (timeStr: string) => void;
  disabled?: boolean;
  direction?: 'up' | 'down' | 'auto';
  className?: string;
}

interface TimeOption {
  label: string;
  period: 'AM' | 'PM';
  tag?: string;
}

// Opciones AM (12:00 AM a 11:30 AM)
const AM_OPTIONS: TimeOption[] = [];
for (let h = 0; h < 12; h++) {
  for (const m of [0, 30]) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    const label = formatTime12h(d);
    let tag: string | undefined;
    if (h === 0 && m === 0) tag = 'Medianoche';
    else if (h === 9 && m === 0) tag = 'Inicio';
    AM_OPTIONS.push({ label, period: 'AM', tag });
  }
}

// Opciones PM (12:00 PM a 11:59 PM)
const PM_OPTIONS: TimeOption[] = [];
for (let h = 12; h < 24; h++) {
  for (const m of [0, 30]) {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    const label = formatTime12h(d);
    let tag: string | undefined;
    if (h === 12 && m === 0) tag = 'Mediodía';
    else if (h === 18 && m === 0) tag = 'Fin jornada';
    PM_OPTIONS.push({ label, period: 'PM', tag });
  }
}
PM_OPTIONS.push({ label: '11:59 PM', period: 'PM', tag: 'Fin de día' });

export const TimeSelector12h: React.FC<TimeSelector12hProps> = ({
  value,
  onChange,
  disabled = false,
  direction = 'up',
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

  // Lista filtrada según el período activo (AM o PM)
  const currentOptions = useMemo(() => {
    return currentPeriod === 'PM' ? PM_OPTIONS : AM_OPTIONS;
  }, [currentPeriod]);

  // Accesos directos más comunes
  const presets = useMemo(() => {
    return currentPeriod === 'PM'
      ? [
          { label: '12:00 PM', tag: 'Mediodía' },
          { label: '6:00 PM', tag: 'Jornada' },
          { label: '11:59 PM', tag: 'Fin de día' },
        ]
      : [
          { label: '9:00 AM', tag: 'Inicio' },
          { label: '10:00 AM', tag: 'Mañana' },
          { label: '11:30 AM', tag: 'Almuerzo' },
        ];
  }, [currentPeriod]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const normalized = normalizeTime12h(inputValue, value || '12:00 PM');
        setInputValue(normalized);
        onChange(normalized);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, inputValue, value, onChange]);

  // Scroll automático a la opción activa al abrir o al alternar AM/PM
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center' });
      } else {
        listRef.current.scrollTop = 0;
      }
    }
  }, [isOpen, currentPeriod]);

  const handleSelectOption = (timeLabel: string) => {
    const normalized = normalizeTime12h(timeLabel);
    setInputValue(normalized);
    onChange(normalized);
    setIsOpen(false);
  };

  const handlePeriodToggle = (targetPeriod: 'AM' | 'PM') => {
    if (targetPeriod === currentPeriod) return;
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

  const positionClass = direction === 'up'
    ? 'bottom-full mb-2 right-0'
    : 'top-full mt-2 right-0';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Input */}
      <div
        className={`flex items-center gap-1.5 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer ${
          disabled
            ? 'opacity-40 cursor-not-allowed pointer-events-none'
            : 'hover:border-[#6C5DD3]/60 focus-within:border-[#6C5DD3] focus-within:ring-2 focus-within:ring-[#6C5DD3]/15'
        } ${isOpen ? 'border-[#6C5DD3] ring-2 ring-[#6C5DD3]/15' : ''}`}
        onClick={() => {
          if (!disabled && !isOpen) setIsOpen(true);
        }}
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
          className="bg-transparent border-none outline-none w-16 text-center font-extrabold text-xs text-zinc-800 dark:text-zinc-100 cursor-text"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-transform"
        >
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#6C5DD3]' : ''}`}
          />
        </button>
      </div>

      {/* Floating 12h Dropdown Popover */}
      {isOpen && !disabled && (
        <div
          className={`absolute ${positionClass} w-52 bg-white dark:bg-[#1C1F26] border border-zinc-200/90 dark:border-white/10 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Segmented AM / PM switcher */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-100 dark:bg-white/5 rounded-lg mb-2">
            <button
              type="button"
              onClick={() => handlePeriodToggle('AM')}
              className={`py-1 text-[11px] font-black rounded-md transition-all text-center ${
                currentPeriod === 'AM'
                  ? 'bg-white dark:bg-[#2A2E39] text-[#6C5DD3] dark:text-[#A599F9] shadow-sm font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              AM (Mañana)
            </button>
            <button
              type="button"
              onClick={() => handlePeriodToggle('PM')}
              className={`py-1 text-[11px] font-black rounded-md transition-all text-center ${
                currentPeriod === 'PM'
                  ? 'bg-[#6C5DD3] text-white shadow-sm font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              PM (Tarde)
            </button>
          </div>

          {/* Presets rápidos de 1-click */}
          <div className="grid grid-cols-3 gap-1 mb-2 pb-2 border-b border-zinc-100 dark:border-white/5">
            {presets.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectOption(preset.label)}
                className="px-1 py-1 rounded bg-zinc-50 dark:bg-white/[0.04] hover:bg-[#6C5DD3]/10 hover:text-[#6C5DD3] text-zinc-600 dark:text-zinc-300 text-[10px] font-bold text-center transition-all truncate border border-zinc-100 dark:border-white/5"
                title={`${preset.label} - ${preset.tag}`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Lista de horas filtrada con scrollbar */}
          <div
            ref={listRef}
            className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 pr-0.5"
          >
            {currentOptions.map(opt => {
              const isActive =
                normalizeTime12h(inputValue, '') === normalizeTime12h(opt.label, '');
              return (
                <button
                  key={opt.label}
                  type="button"
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => handleSelectOption(opt.label)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#6C5DD3] text-white font-black shadow-xs'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="tabular-nums">{opt.label}</span>
                  <div className="flex items-center gap-1.5">
                    {opt.tag && (
                      <span
                        className={`text-[9px] font-semibold ${
                          isActive ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {opt.tag}
                      </span>
                    )}
                    {isActive && <Check size={12} strokeWidth={3} className="text-white" />}
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
