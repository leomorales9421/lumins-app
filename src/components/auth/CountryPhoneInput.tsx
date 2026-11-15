import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES_LIST: CountryOption[] = [
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'DO', name: 'Rep. Dominicana', dialCode: '+1', flag: '🇩🇴' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' }
];

interface CountryPhoneInputProps {
  selectedCountry: CountryOption;
  onCountryChange: (country: CountryOption) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  selectedCountry,
  onCountryChange,
  phoneNumber,
  onPhoneNumberChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES_LIST.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-700 ml-0.5">Teléfono</label>
      
      <div className="relative flex items-center" ref={dropdownRef}>
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 px-2.5 bg-[#F8FAFC] border border-slate-200 border-r-0 rounded-l-lg flex items-center gap-1.5 hover:bg-slate-100 transition-colors shrink-0 text-xs font-semibold text-slate-800"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-[11px] text-slate-600 font-bold">{selectedCountry.dialCode}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Local Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-full h-9 bg-[#F8FAFC] border border-slate-200 rounded-r-lg px-3 text-xs sm:text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all placeholder:text-slate-400"
          placeholder="412 123 4567"
          autoComplete="tel-national"
        />

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-[12px] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar país o código..."
                className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium placeholder:text-slate-400"
                autoFocus
              />
            </div>

            <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        onCountryChange(c);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs rounded-[8px] transition-colors ${
                        isSelected ? 'bg-[#12A9A8]/10 text-[#12A9A8] font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate max-w-[140px]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono font-medium">{c.dialCode}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#12A9A8]" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No se encontraron países
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
