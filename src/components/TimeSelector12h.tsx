import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';
import { formatTime12h, parseTime12h, normalizeTime12h } from '../lib/calendar-utils';

interface TimeSelector12hProps {
  value: string; // e.g. "12:00 PM"
  onChange: (timeStr: string) => void;
  disabled?: boolean;
  direction?: 'up' | 'down' | 'auto';
  className?: string;
  /** Si se define (ej. hoy), deshabilita/filtra horas anteriores a este minuto del día (0-1439) */
  minMinutesFromMidnight?: number;
}

interface TimeOption {
  label: string;
  period: 'AM' | 'PM';
  minutesFromMidnight: number;
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
    AM_OPTIONS.push({ label, period: 'AM', minutesFromMidnight: h * 60 + m, tag });
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
    PM_OPTIONS.push({ label, period: 'PM', minutesFromMidnight: h * 60 + m, tag });
  }
}
PM_OPTIONS.push({ label: '11:59 PM', period: 'PM', minutesFromMidnight: 23 * 60 + 59, tag: 'Fin de día' });

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export const TimeSelector12h: React.FC<TimeSelector12hProps> = ({
  value,
  onChange,
  disabled = false,
  direction = 'up',
  className = '',
  minMinutesFromMidnight,
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

  const isAmDisabled = minMinutesFromMidnight !== undefined && minMinutesFromMidnight >= 12 * 60;

  // Lista filtrada según el período activo (AM o PM) y hora mínima si aplica
  const currentOptions = useMemo(() => {
    const base = currentPeriod === 'PM' ? PM_OPTIONS : AM_OPTIONS;
    if (minMinutesFromMidnight === undefined) return base;
    return base.filter(opt => opt.minutesFromMidnight >= minMinutesFromMidnight);
  }, [currentPeriod, minMinutesFromMidnight]);

  // Accesos directos más comunes
  const presets = useMemo(() => {
    const list = currentPeriod === 'PM'
      ? [
          { label: '12:00 PM', tag: 'Mediodía', mins: 12 * 60 },
          { label: '6:00 PM', tag: 'Jornada', mins: 18 * 60 },
          { label: '11:59 PM', tag: 'Fin de día', mins: 23 * 60 + 59 },
        ]
      : [
          { label: '9:00 AM', tag: 'Inicio', mins: 9 * 60 },
          { label: '10:00 AM', tag: 'Mañana', mins: 10 * 60 },
          { label: '11:30 AM', tag: 'Almuerzo', mins: 11 * 60 + 30 },
        ];
    return list;
  }, [currentPeriod]);

  // Chips relativos rápidos para mobile cuando es hoy
  const mobileQuickChips = useMemo(() => {
    if (minMinutesFromMidnight !== undefined) {
      return [15, 30, 60]
        .map(offset => {
          const total = minMinutesFromMidnight + offset;
          if (total >= 24 * 60) return null;
          const d = new Date();
          d.setHours(Math.floor(total / 60), total % 60, 0, 0);
          return {
            title: offset === 60 ? 'En 1 hora' : `En ${offset} min`,
            label: formatTime12h(d),
          };
        })
        .filter((x): x is { title: string; label: string } => x !== null);
    }
    return [
      { title: '9:00 AM', label: '9:00 AM' },
      { title: '12:00 PM', label: '12:00 PM' },
      { title: '3:00 PM', label: '3:00 PM' },
      { title: '6:00 PM', label: '6:00 PM' },
    ];
  }, [minMinutesFromMidnight]);

  const parsedCurrent = useMemo(() => {
    return parseTime12h(inputValue) || { hours: 12, minutes: 0 };
  }, [inputValue]);

  const selected12Hour = useMemo(() => {
    const h = parsedCurrent.hours % 12;
    return h === 0 ? 12 : h;
  }, [parsedCurrent.hours]);

  const time24Value = useMemo(() => {
    const hh = String(parsedCurrent.hours).padStart(2, '0');
    const mm = String(parsedCurrent.minutes).padStart(2, '0');
    return `${hh}:${mm}`;
  }, [parsedCurrent]);

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

  const handleSelectHourMinute = (hour12: number, minute: number, period: 'AM' | 'PM', closeSheet = false) => {
    let h24 = hour12 % 12;
    if (period === 'PM') h24 += 12;
    const totalMins = h24 * 60 + minute;
    if (minMinutesFromMidnight !== undefined && totalMins < minMinutesFromMidnight) {
      return;
    }
    const d = new Date();
    d.setHours(h24, minute, 0, 0);
    const newStr = formatTime12h(d);
    setInputValue(newStr);
    onChange(newStr);
    if (closeSheet) setIsOpen(false);
  };

  const handleNativeTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [hh, mm] = val.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    const newStr = formatTime12h(d);
    setInputValue(newStr);
    onChange(newStr);
  };

  const positionClass = direction === 'up'
    ? 'bottom-full mb-2 right-0'
    : 'top-full mt-2 right-0';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Input */}
      <div
        className={`flex items-center gap-1.5 bg-zinc-50 dark:bg-[#13151A] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-all cursor-pointer ${
          disabled
            ? 'opacity-40 cursor-not-allowed pointer-events-none'
            : 'hover:border-[#12A9A8]/60 focus-within:border-[#12A9A8] focus-within:ring-2 focus-within:ring-[#12A9A8]/15'
        } ${isOpen ? 'border-[#12A9A8] ring-2 ring-[#12A9A8]/15' : ''}`}
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
          className="bg-transparent border-none outline-none w-16 flex-1 sm:flex-none text-left sm:text-center font-extrabold text-xs text-zinc-800 dark:text-zinc-100 cursor-text"
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
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#12A9A8]' : ''}`}
          />
        </button>
      </div>

      {/* Desktop Floating 12h Dropdown Popover (hidden on mobile) */}
      {isOpen && !disabled && (
        <div
          className={`hidden sm:block absolute ${positionClass} w-52 bg-white dark:bg-[#1C1F26] border border-zinc-200/90 dark:border-white/10 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Segmented AM / PM switcher */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-100 dark:bg-white/5 rounded-lg mb-2">
            <button
              type="button"
              disabled={isAmDisabled}
              onClick={() => !isAmDisabled && handlePeriodToggle('AM')}
              className={`py-1 text-[11px] font-black rounded-md transition-all text-center ${
                isAmDisabled
                  ? 'opacity-35 cursor-not-allowed text-zinc-400'
                  : currentPeriod === 'AM'
                  ? 'bg-[#12A9A8] text-white shadow-sm font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer'
              }`}
            >
              AM (Mañana)
            </button>
            <button
              type="button"
              onClick={() => handlePeriodToggle('PM')}
              className={`py-1 text-[11px] font-black rounded-md transition-all text-center cursor-pointer ${
                currentPeriod === 'PM'
                  ? 'bg-[#12A9A8] text-white shadow-sm font-black'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              PM (Tarde)
            </button>
          </div>

          {/* Presets rápidos de 1-click */}
          <div className="grid grid-cols-3 gap-1 mb-2 pb-2 border-b border-zinc-100 dark:border-white/5">
            {presets.map(preset => {
              const isPresetDisabled =
                minMinutesFromMidnight !== undefined && preset.mins < minMinutesFromMidnight;
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={isPresetDisabled}
                  onClick={() => !isPresetDisabled && handleSelectOption(preset.label)}
                  className={`px-1 py-1 rounded text-[10px] font-bold text-center transition-all truncate border ${
                    isPresetDisabled
                      ? 'opacity-35 cursor-not-allowed bg-zinc-50 dark:bg-white/[0.02] text-zinc-400 border-zinc-100 dark:border-white/5'
                      : 'bg-zinc-50 dark:bg-white/[0.04] hover:bg-[#12A9A8]/10 hover:text-[#0E8786] dark:hover:text-[#4ED4D2] text-zinc-600 dark:text-zinc-300 border-zinc-100 dark:border-white/5 cursor-pointer'
                  }`}
                  title={`${preset.label} - ${preset.tag}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Lista de horas filtrada con scrollbar */}
          <div
            ref={listRef}
            className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5 pr-0.5"
          >
            {currentOptions.length === 0 ? (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center py-4">
                No quedan horarios disponibles en este bloque
              </p>
            ) : (
              currentOptions.map(opt => {
                const isActive =
                  normalizeTime12h(inputValue, '') === normalizeTime12h(opt.label, '');
                return (
                  <button
                    key={opt.label}
                    type="button"
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => handleSelectOption(opt.label)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#12A9A8] text-white font-black shadow-xs'
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
              })
            )}
          </div>
        </div>
      )}

      {/* Mobile Native Bottom Sheet Picker (sm:hidden) */}
      {isOpen && !disabled && (
        <div className="sm:hidden fixed inset-0 z-[10050] flex items-end justify-center">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full bg-white dark:bg-[#1C1F26] rounded-t-[28px] border-t border-zinc-200/80 dark:border-white/10 shadow-2xl z-10 px-4 pt-3 pb-6 animate-in slide-in-from-bottom duration-200 max-h-[82vh] flex flex-col">
            {/* Pull Handle */}
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Hora de inicio
                </p>
                <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {inputValue}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#12A9A8] hover:bg-[#0E8786] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Listo
              </button>
            </div>

            {/* Quick Chips */}
            {mobileQuickChips.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2.5 border-b border-zinc-100 dark:border-white/5 no-scrollbar">
                {mobileQuickChips.map(chip => (
                  <button
                    key={chip.title}
                    type="button"
                    onClick={() => handleSelectOption(chip.label)}
                    className="px-3 py-1.5 rounded-lg bg-[#12A9A8]/10 text-[#0E8786] dark:text-[#4ED4D2] text-xs font-bold whitespace-nowrap shrink-0 active:scale-95 transition-transform cursor-pointer"
                  >
                    {chip.title}
                  </button>
                ))}
              </div>
            )}

            {/* AM / PM Segmented */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl mb-3">
              <button
                type="button"
                disabled={isAmDisabled}
                onClick={() => !isAmDisabled && handlePeriodToggle('AM')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  isAmDisabled
                    ? 'opacity-35 cursor-not-allowed text-zinc-400'
                    : currentPeriod === 'AM'
                    ? 'bg-[#12A9A8] text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                AM (Mañana)
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle('PM')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  currentPeriod === 'PM'
                    ? 'bg-[#12A9A8] text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                PM (Tarde)
              </button>
            </div>

            {/* 2-Column Touch Selector: Hora | Minutos */}
            <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
              <div className="flex flex-col min-h-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 text-center">
                  Hora
                </span>
                <div className="grid grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 max-h-48">
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h12 => {
                    const h24 = (h12 % 12) + (currentPeriod === 'PM' ? 12 : 0);
                    const maxMinOfHour = h24 * 60 + 59;
                    const hourDisabled =
                      minMinutesFromMidnight !== undefined && maxMinOfHour < minMinutesFromMidnight;
                    const isSelected = selected12Hour === h12;
                    return (
                      <button
                        key={h12}
                        type="button"
                        disabled={hourDisabled}
                        onClick={() => {
                          let targetMin = parsedCurrent.minutes;
                          if (
                            minMinutesFromMidnight !== undefined &&
                            h24 * 60 + targetMin < minMinutesFromMidnight
                          ) {
                            const nextValid = MINUTE_STEPS.find(
                              m => h24 * 60 + m >= minMinutesFromMidnight
                            );
                            targetMin = nextValid ?? 59;
                          }
                          handleSelectHourMinute(h12, targetMin, currentPeriod);
                        }}
                        className={`h-10 rounded-xl text-xs font-bold tabular-nums transition-all ${
                          hourDisabled
                            ? 'opacity-30 cursor-not-allowed bg-zinc-50 dark:bg-white/[0.02] text-zinc-400'
                            : isSelected
                            ? 'bg-[#12A9A8] text-white shadow-xs'
                            : 'bg-zinc-50 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-200 active:bg-zinc-200 dark:active:bg-white/10'
                        }`}
                      >
                        {h12}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col min-h-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 text-center">
                  Minutos
                </span>
                <div className="grid grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 max-h-48">
                  {MINUTE_STEPS.map(min => {
                    const h24 = (selected12Hour % 12) + (currentPeriod === 'PM' ? 12 : 0);
                    const minDisabled =
                      minMinutesFromMidnight !== undefined && h24 * 60 + min < minMinutesFromMidnight;
                    const isSelected = parsedCurrent.minutes === min;
                    return (
                      <button
                        key={min}
                        type="button"
                        disabled={minDisabled}
                        onClick={() => handleSelectHourMinute(selected12Hour, min, currentPeriod)}
                        className={`h-10 rounded-xl text-xs font-bold tabular-nums transition-all ${
                          minDisabled
                            ? 'opacity-30 cursor-not-allowed bg-zinc-50 dark:bg-white/[0.02] text-zinc-400'
                            : isSelected
                            ? 'bg-[#12A9A8] text-white shadow-xs'
                            : 'bg-zinc-50 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-200 active:bg-zinc-200 dark:active:bg-white/10'
                        }`}
                      >
                        :{String(min).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hora exacta opcional */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                ¿Otra hora exacta?
              </span>
              <input
                type="time"
                value={time24Value}
                onChange={handleNativeTimeChange}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] text-xs font-bold text-zinc-800 dark:text-zinc-100 outline-none focus:border-[#12A9A8]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSelector12h;
