import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check, Globe2, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';

type ThemeType = 'light' | 'dark' | 'system';
type LanguageType = 'es' | 'en';

const LANGUAGES = [
  { code: 'es' as LanguageType, label: 'Español (Latinoamérica)', flag: '🇪🇸' },
  { code: 'en' as LanguageType, label: 'English', flag: '🇺🇸' },
];

const ThemeCard: React.FC<{
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  previewClass: string;
  isSaving: boolean;
}> = ({ label, icon, isActive, onClick, previewClass, isSaving }) => (
  <button
    onClick={onClick}
    disabled={isSaving}
    className={`group relative flex flex-col p-4 rounded border-2 transition-all text-left
      ${isActive
        ? 'border-[#6C5DD3] bg-indigo-50/30 dark:bg-[#6C5DD3]/10 ring-4 ring-indigo-100 dark:ring-[#6C5DD3]/20'
        : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#1C1F26]'
      } disabled:opacity-70
    `}
  >
    <div className={`w-full h-24 rounded mb-4 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-white/5 ${previewClass}`}>
      <div className="scale-125 transition-transform group-hover:scale-150 duration-500 opacity-20 dark:opacity-40">
        {icon}
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`${isActive ? 'text-[#6C5DD3]' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {React.cloneElement(icon as any, { size: 18 })}
        </span>
        <span className={`font-bold ${isActive ? 'text-[#6C5DD3]' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {label}
        </span>
      </div>
      {isActive && !isSaving && (
        <div className="w-5 h-5 rounded bg-[#6C5DD3] flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={4} />
        </div>
      )}
      {isActive && isSaving && (
        <Loader2 size={16} className="text-[#6C5DD3] animate-spin" />
      )}
    </div>
  </button>
);

const applyThemeToDom = (theme: ThemeType) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
  window.dispatchEvent(new Event('theme-changed'));
};

const PreferenceSettings: React.FC = () => {
  const { user, setUser } = useAuth();
  const [theme, setTheme] = useState<ThemeType>('system');
  const [language, setLanguage] = useState<LanguageType>('es');
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingLang, setSavingLang] = useState(false);

  // Initialize from user or localStorage fallback
  useEffect(() => {
    const savedTheme = (user?.theme as ThemeType) || (localStorage.getItem('theme') as ThemeType) || 'system';
    const savedLang = (user?.language as LanguageType) || 'es';
    setTheme(savedTheme);
    setLanguage(savedLang);
    applyThemeToDom(savedTheme);
  }, [user]);

  const handleThemeChange = async (newTheme: ThemeType) => {
    if (newTheme === theme) return;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Fast fallback
    applyThemeToDom(newTheme);

    setSavingTheme(true);
    try {
      const res = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', { theme: newTheme });
      if (setUser) setUser(res.data.user);
    } catch {
      // Revert if save fails
      setTheme(theme);
      localStorage.setItem('theme', theme);
      applyThemeToDom(theme);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as LanguageType;
    setLanguage(newLang);
    setSavingLang(true);
    try {
      const res = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', { language: newLang });
      if (setUser) setUser(res.data.user);
    } catch {
      setLanguage(language); // Revert
    } finally {
      setSavingLang(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">Preferencias</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Personaliza el aspecto de tu espacio de trabajo.</p>
      </div>

      {/* Theme Selector */}
      <section className="bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">Apariencia</h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Selecciona el tema que mejor se adapte a tu estilo.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <ThemeCard
            id="light"
            label="Claro"
            icon={<Sun size={24} />}
            isActive={theme === 'light'}
            onClick={() => handleThemeChange('light')}
            previewClass="bg-slate-50"
            isSaving={savingTheme && theme === 'light'}
          />
          <ThemeCard
            id="dark"
            label="Oscuro"
            icon={<Moon size={24} />}
            isActive={theme === 'dark'}
            onClick={() => handleThemeChange('dark')}
            previewClass="bg-[#13151A]"
            isSaving={savingTheme && theme === 'dark'}
          />
          <ThemeCard
            id="system"
            label="Sistema"
            icon={<Monitor size={24} />}
            isActive={theme === 'system'}
            onClick={() => handleThemeChange('system')}
            previewClass="bg-gradient-to-br from-slate-50 to-[#13151A]"
            isSaving={savingTheme && theme === 'system'}
          />
        </div>
      </section>

      {/* Language Selector */}
      <section className="bg-white dark:bg-[#1C1F26] rounded border border-zinc-200 dark:border-white/10 p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Globe2 size={20} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">Idioma</h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Elige el idioma de la interfaz de la plataforma.</p>
          </div>
        </div>

        <div className="max-w-sm">
          <div className="relative">
            <select
              value={language}
              onChange={handleLanguageChange}
              disabled={savingLang}
              className="w-full p-3 pl-12 bg-[#F4F6F9] dark:bg-[#13151A] rounded border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-[#6C5DD3] focus:border-[#6C5DD3] outline-none transition-all appearance-none font-bold text-zinc-900 dark:text-zinc-100 disabled:opacity-70 cursor-pointer"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
              {LANGUAGES.find(l => l.code === language)?.flag}
            </span>
            {savingLang && (
              <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#6C5DD3]" />
            )}
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Los cambios de idioma se aplicarán en la próxima sesión.</p>
        </div>
      </section>
    </div>
  );
};

export default PreferenceSettings;
