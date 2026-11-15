import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, PanelTop, PanelLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';
import {
  type ThemeType,
  type AccentColor,
  type MenuLayout,
  LUMINS_ACCENT_PALETTES,
  applyThemeToDom,
  resolveCurrentTheme,
  resolveAccentColor,
  applyAccentToDom,
  resolveMenuLayout,
  applyMenuLayout,
} from '../../lib/theme';
import LuminsLogoLoader from '../../components/ui/LuminsLogoLoader';

const ThemeCard: React.FC<{
  label: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  previewClass: string;
  isSaving: boolean;
}> = ({ label, description, icon, isActive, onClick, previewClass, isSaving }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isSaving}
    style={isActive ? { borderColor: 'var(--lumins-accent)' } : undefined}
    className={`group relative flex flex-col p-3.5 sm:p-4 rounded-xl border-2 transition-all text-left cursor-pointer active:scale-[0.98] bg-white dark:bg-[#1C1F26] ${
      isActive
        ? 'shadow-xs ring-2 ring-[var(--lumins-accent)]/15'
        : 'border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
    } disabled:opacity-70`}
  >
    <div
      className={`w-full h-16 sm:h-20 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-white/10 ${previewClass}`}
    >
      <div className="transition-transform group-hover:scale-110 duration-300 opacity-35 dark:opacity-55">
        {icon}
      </div>
    </div>

    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            style={isActive ? { color: 'var(--lumins-accent-fg)' } : undefined}
            className="text-slate-500 dark:text-zinc-400 shrink-0"
          >
            {React.cloneElement(icon as React.ReactElement<any>, { size: 15 })}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
            {label}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
          {description}
        </p>
      </div>
      {isActive && !isSaving && (
        <div
          style={{
            backgroundColor: 'var(--lumins-accent)',
            color: 'var(--lumins-accent-on)',
          }}
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        >
          <Check size={11} strokeWidth={3.5} />
        </div>
      )}
      {isActive && isSaving && <LuminsLogoLoader size="xs" />}
    </div>
  </button>
);

const PreferenceSettings: React.FC = () => {
  const { user, setUser } = useAuth();
  const [theme, setTheme] = useState<ThemeType>(() => resolveCurrentTheme(user?.theme));
  const [savingTheme, setSavingTheme] = useState(false);
  const [accent, setAccent] = useState<AccentColor>(() =>
    resolveAccentColor(user?.preferences?.accentColor)
  );
  const [savingAccent, setSavingAccent] = useState(false);
  const [menuLayout, setMenuLayout] = useState<MenuLayout>(() =>
    resolveMenuLayout(user?.preferences?.menuLayout)
  );
  const [savingLayout, setSavingLayout] = useState(false);

  useEffect(() => {
    setTheme(resolveCurrentTheme(user?.theme));
  }, [user?.theme]);

  useEffect(() => {
    setAccent(resolveAccentColor(user?.preferences?.accentColor));
  }, [user?.preferences?.accentColor]);

  useEffect(() => {
    setMenuLayout(resolveMenuLayout(user?.preferences?.menuLayout));
  }, [user?.preferences?.menuLayout]);

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
      toast.success('Tema actualizado', { id: 'pref-theme' });
    } catch {
      setTheme(previousTheme);
      applyThemeToDom(previousTheme, true);
      toast.error('No se pudo guardar la preferencia de tema');
    } finally {
      setSavingTheme(false);
    }
  };

  const handleAccentChange = async (newAccent: AccentColor) => {
    if (newAccent === accent || savingAccent) return;
    const previousAccent = accent;

    setAccent(newAccent);
    applyAccentToDom(newAccent, true);

    setSavingAccent(true);
    try {
      const res = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', {
        preferences: { accentColor: newAccent },
      });
      if (setUser && res.data?.user) {
        setUser(prev =>
          prev
            ? {
                ...prev,
                ...res.data.user,
                preferences: { ...(prev.preferences || {}), ...(res.data.user.preferences || {}), accentColor: newAccent },
              }
            : res.data.user
        );
      }
      toast.success(`Color de acento: ${LUMINS_ACCENT_PALETTES[newAccent].label}`, {
        id: 'pref-accent',
      });
    } catch {
      setAccent(previousAccent);
      applyAccentToDom(previousAccent, true);
      toast.error('No se pudo guardar el color de acento');
    } finally {
      setSavingAccent(false);
    }
  };

  const handleMenuLayoutChange = async (newLayout: MenuLayout) => {
    if (newLayout === menuLayout || savingLayout) return;
    const previousLayout = menuLayout;

    setMenuLayout(newLayout);
    applyMenuLayout(newLayout, true);

    setSavingLayout(true);
    try {
      const res = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', {
        preferences: { menuLayout: newLayout },
      });
      if (setUser && res.data?.user) {
        setUser(prev =>
          prev
            ? {
                ...prev,
                ...res.data.user,
                preferences: { ...(prev.preferences || {}), ...(res.data.user.preferences || {}), menuLayout: newLayout },
              }
            : res.data.user
        );
      }
      toast.success(newLayout === 'sidebar' ? 'Menú lateral activado' : 'Menú superior activado', {
        id: 'pref-layout',
      });
    } catch {
      setMenuLayout(previousLayout);
      applyMenuLayout(previousLayout, true);
      toast.error('No se pudo guardar la disposición del menú');
    } finally {
      setSavingLayout(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Tema visual */}
      <section className="bg-white dark:bg-[#1C1F26] border border-slate-200/90 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
            Modo de visualización
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Elige entre tema claro, oscuro o sincronizado con tu sistema operativo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <ThemeCard
            label="Claro"
            description="Superficies luminosas de alto contraste"
            icon={<Sun size={24} className="text-amber-500" />}
            isActive={theme === 'light'}
            onClick={() => handleThemeChange('light')}
            previewClass="bg-slate-50"
            isSaving={savingTheme && theme === 'light'}
          />
          <ThemeCard
            label="Oscuro"
            description="Menor fatiga visual en entornos tenues"
            icon={<Moon size={24} className="text-teal-400" />}
            isActive={theme === 'dark'}
            onClick={() => handleThemeChange('dark')}
            previewClass="bg-[#13151A]"
            isSaving={savingTheme && theme === 'dark'}
          />
          <ThemeCard
            label="Sistema"
            description="Se adapta automáticamente a tu dispositivo"
            icon={<Monitor size={24} className="text-slate-400" />}
            isActive={theme === 'system'}
            onClick={() => handleThemeChange('system')}
            previewClass="bg-gradient-to-br from-slate-100 via-slate-200 to-[#1C1F26]"
            isSaving={savingTheme && theme === 'system'}
          />
        </div>
      </section>

      {/* 2. Contraste entre los 3 colores del logo + 3. Disposición del menú */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Contraste del logo */}
        <section className="bg-white dark:bg-[#1C1F26] border border-slate-200/90 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
              Color de énfasis Lumins
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 mb-4">
              Alterna el color predominante entre los 3 tonos oficiales del logotipo, calibrado para tema claro y oscuro.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['teal', 'coral', 'amber'] as AccentColor[]).map((key) => {
                const pal = LUMINS_ACCENT_PALETTES[key];
                const isSelected = accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAccentChange(key)}
                    style={isSelected ? { borderColor: pal.swatch } : undefined}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 bg-white dark:bg-[#1C1F26] ${
                      isSelected
                        ? 'shadow-xs ring-2 ring-[var(--lumins-accent)]/15'
                        : 'border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/40 dark:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className="w-7 h-7 rounded-lg shadow-xs border border-black/10 dark:border-white/15"
                        style={{ backgroundColor: pal.swatch }}
                      />
                      {isSelected && (
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: pal.light.accent,
                            color: pal.light.on,
                          }}
                        >
                          <Check size={11} strokeWidth={3.5} />
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {pal.label}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {key === 'teal'
                          ? 'Equilibrio y foco diario'
                          : key === 'coral'
                          ? 'Acento cálido y energético'
                          : 'Alto contraste luminoso'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Disposición del menú: Superior o Lateral */}
        <section className="bg-white dark:bg-[#1C1F26] border border-slate-200/90 dark:border-white/10 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
              Posición del menú de navegación
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 mb-4">
              Elige si prefieres navegar desde la barra superior o desde un menú lateral fijo en escritorio.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Menú Superior */}
              <button
                type="button"
                onClick={() => handleMenuLayoutChange('top')}
                style={menuLayout === 'top' ? { borderColor: 'var(--lumins-accent)' } : undefined}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer bg-white dark:bg-[#1C1F26] ${
                  menuLayout === 'top'
                    ? 'shadow-xs ring-2 ring-[var(--lumins-accent)]/15'
                    : 'border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/40 dark:bg-white/[0.02]'
                }`}
              >
                {/* Mini wireframe */}
                <div className="h-14 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13151A] p-1.5 flex flex-col gap-1.5 mb-3">
                  <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-white/10 flex items-center gap-1 px-1">
                    <span className="w-3 h-1.5 rounded-xs" style={{ backgroundColor: 'var(--lumins-accent)' }} />
                    <span className="w-3 h-1.5 rounded-xs bg-slate-300 dark:bg-white/20" />
                    <span className="w-3 h-1.5 rounded-xs bg-slate-300 dark:bg-white/20" />
                  </div>
                  <div className="flex-1 rounded bg-slate-100 dark:bg-white/5" />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <PanelTop size={15} style={menuLayout === 'top' ? { color: 'var(--lumins-accent-fg)' } : undefined} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">Menú Superior</div>
                      <div className="text-[10.5px] text-slate-500 dark:text-zinc-400">Máximo ancho útil</div>
                    </div>
                  </div>
                  {menuLayout === 'top' && (
                    <span
                      style={{
                        backgroundColor: 'var(--lumins-accent)',
                        color: 'var(--lumins-accent-on)',
                      }}
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    >
                      <Check size={11} strokeWidth={3.5} />
                    </span>
                  )}
                </div>
              </button>

              {/* Menú Lateral */}
              <button
                type="button"
                onClick={() => handleMenuLayoutChange('sidebar')}
                style={menuLayout === 'sidebar' ? { borderColor: 'var(--lumins-accent)' } : undefined}
                className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer bg-white dark:bg-[#1C1F26] ${
                  menuLayout === 'sidebar'
                    ? 'shadow-xs ring-2 ring-[var(--lumins-accent)]/15'
                    : 'border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/40 dark:bg-white/[0.02]'
                }`}
              >
                {/* Mini wireframe */}
                <div className="h-14 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13151A] p-1.5 flex gap-1.5 mb-3">
                  <div className="w-4 h-full rounded bg-slate-200 dark:bg-white/10 flex flex-col gap-1 p-0.5">
                    <span className="w-full h-1.5 rounded-xs" style={{ backgroundColor: 'var(--lumins-accent)' }} />
                    <span className="w-full h-1.5 rounded-xs bg-slate-300 dark:bg-white/20" />
                  </div>
                  <div className="flex-1 rounded bg-slate-100 dark:bg-white/5" />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <PanelLeft size={15} style={menuLayout === 'sidebar' ? { color: 'var(--lumins-accent-fg)' } : undefined} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">Menú Lateral</div>
                      <div className="text-[10.5px] text-slate-500 dark:text-zinc-400">Barra fija colapsable</div>
                    </div>
                  </div>
                  {menuLayout === 'sidebar' && (
                    <span
                      style={{
                        backgroundColor: 'var(--lumins-accent)',
                        color: 'var(--lumins-accent-on)',
                      }}
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    >
                      <Check size={11} strokeWidth={3.5} />
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PreferenceSettings;
