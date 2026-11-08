import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import { type ThemeType, applyThemeToDom, resolveCurrentTheme } from '../../lib/theme';

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
    type="button"
    onClick={onClick}
    disabled={isSaving}
    className={`group relative flex flex-col p-2.5 sm:p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.98]
      ${isActive
        ? 'border-[#6C5DD3] bg-indigo-50/40 dark:bg-[#6C5DD3]/15 ring-2 sm:ring-4 ring-indigo-100 dark:ring-[#6C5DD3]/20'
        : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-[#1C1F26]'
      } disabled:opacity-70
    `}
  >
    <div className={`w-full h-14 sm:h-24 rounded-xl mb-2.5 sm:mb-4 flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-white/5 ${previewClass}`}>
      <div className="scale-100 sm:scale-125 transition-transform group-hover:scale-125 sm:group-hover:scale-150 duration-500 opacity-25 dark:opacity-45">
        {icon}
      </div>
    </div>

    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`shrink-0 ${isActive ? 'text-[#6C5DD3] dark:text-[#A599F9]' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {React.cloneElement(icon as any, { size: 15 })}
        </span>
        <span className={`text-xs sm:text-sm font-extrabold truncate ${isActive ? 'text-[#6C5DD3] dark:text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {label}
        </span>
      </div>
      {isActive && !isSaving && (
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#6C5DD3] flex items-center justify-center shrink-0">
          <Check size={10} className="text-white" strokeWidth={4} />
        </div>
      )}
      {isActive && isSaving && (
        <Loader2 size={14} className="text-[#6C5DD3] animate-spin shrink-0" />
      )}
    </div>
  </button>
);

const PreferenceSettings: React.FC = () => {
  const { user, setUser } = useAuth();
  const [theme, setTheme] = useState<ThemeType>(() => resolveCurrentTheme(user?.theme));
  const [savingTheme, setSavingTheme] = useState(false);

  // Sync displayed controls without mutating the DOM theme simply by opening this page
  useEffect(() => {
    const activeTheme = resolveCurrentTheme(user?.theme);
    setTheme(activeTheme);
  }, [user?.theme]);

  const handleThemeChange = async (newTheme: ThemeType) => {
    if (newTheme === theme || savingTheme) return;
    const previousTheme = theme;

    setTheme(newTheme);
    applyThemeToDom(newTheme, true);

    setSavingTheme(true);
    try {
      const res = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', { theme: newTheme });
      if (setUser && res.data?.user) {
        setUser(prev => (prev ? { ...prev, ...res.data.user, theme: newTheme } : res.data.user));
      }
      toast.success('Tema actualizado');
    } catch {
      // Revert if save fails
      setTheme(previousTheme);
      applyThemeToDom(previousTheme, true);
      toast.error('No se pudo guardar la preferencia de tema');
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="hidden lg:block mb-6">
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">Preferencias</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Personaliza el aspecto de tu espacio de trabajo.</p>
      </div>

      {/* Theme Selector */}
      <section className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Palette size={18} />
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">Apariencia</h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Selecciona el tema que mejor se adapte a tu estilo.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-6">
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
    </div>
  );
};

export default PreferenceSettings;
