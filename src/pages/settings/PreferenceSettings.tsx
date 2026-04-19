import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';

const ThemeCard: React.FC<{ 
  id: string, 
  label: string, 
  icon: React.ReactNode, 
  isActive: boolean, 
  onClick: () => void,
  previewClass: string
}> = ({ label, icon, isActive, onClick, previewClass }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left
      ${isActive 
        ? 'border-[#6C5DD3] bg-purple-50/30 ring-4 ring-purple-100' 
        : 'border-zinc-200 hover:border-zinc-300 bg-white'
      }
    `}
  >
    <div className={`w-full h-24 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-zinc-100 ${previewClass}`}>
      <div className="scale-125 transition-transform group-hover:scale-150 duration-500 opacity-20">
        {icon}
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`${isActive ? 'text-[#6C5DD3]' : 'text-zinc-500'}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 18 })}
        </span>
        <span className={`font-bold ${isActive ? 'text-[#6C5DD3]' : 'text-zinc-900'}`}>
          {label}
        </span>
      </div>
      {isActive && (
        <div className="w-5 h-5 rounded-full bg-[#6C5DD3] flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={4} />
        </div>
      )}
    </div>
  </button>
);

const PreferenceSettings: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'light';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new Event('theme-changed'));
  };

  return (
    <div className="space-y-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-zinc-900">Preferencias</h2>
        <p className="text-zinc-500 mt-1">Personaliza el aspecto de tu espacio de trabajo.</p>
      </div>

      <section className="bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Apariencia</h3>
            <p className="text-sm text-zinc-500">Selecciona el tema que mejor se adapte a tu estilo de trabajo.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ThemeCard
            id="light"
            label="Claro"
            icon={<Sun size={24} />}
            isActive={theme === 'light'}
            onClick={() => handleThemeChange('light')}
            previewClass="bg-slate-50"
          />
          <ThemeCard
            id="dark"
            label="Oscuro"
            icon={<Moon size={24} />}
            isActive={theme === 'dark'}
            onClick={() => handleThemeChange('dark')}
            previewClass="bg-[#13151A]"
          />
          <ThemeCard
            id="system"
            label="Sistema"
            icon={<Monitor size={24} />}
            isActive={theme === 'system'}
            onClick={() => handleThemeChange('system')}
            previewClass="bg-gradient-to-br from-slate-50 to-[#13151A]"
          />
        </div>
      </section>

      {/* Language Section (Future) */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-8 opacity-60">
        <h3 className="text-xl font-bold text-zinc-900 mb-6">Idioma</h3>
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇪🇸</span>
            <span className="font-bold text-zinc-900">Español (Latinoamérica)</span>
          </div>
          <button className="text-[#6C5DD3] font-bold text-sm">Cambiar</button>
        </div>
      </section>
    </div>
  );
};

export default PreferenceSettings;
