import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Palette, Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/api-client';
import { type ThemeType, applyThemeToDom, resolveCurrentTheme } from '../lib/theme';

interface ThemePreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPostOnboarding?: boolean;
}

export const ThemePreferenceModal: React.FC<ThemePreferenceModalProps> = ({
  isOpen,
  onClose,
  isPostOnboarding = false,
}) => {
  const { user, setUser } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>(() => resolveCurrentTheme(user?.theme));
  const initialThemeRef = useRef<ThemeType>(resolveCurrentTheme(user?.theme));
  const isSavedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = resolveCurrentTheme(user?.theme);
      initialThemeRef.current = current;
      setSelectedTheme(current);
      isSavedRef.current = false;
    }
  }, [isOpen, user?.theme]);

  // Clean-up on unmount / close if user didn't save
  useEffect(() => {
    return () => {
      if (!isSavedRef.current && isOpen) {
        applyThemeToDom(initialThemeRef.current, true);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time preview as the user selects a theme (does not persist until saved)
  const handleSelectTheme = (newTheme: ThemeType) => {
    setSelectedTheme(newTheme);
    applyThemeToDom(newTheme, false);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  // Revert back to original theme if cancelled
  const handleCancel = () => {
    applyThemeToDom(initialThemeRef.current, true);
    setSelectedTheme(initialThemeRef.current);
    onClose();
  };

  // Final persist to database
  const handleSave = async () => {
    setIsSaving(true);
    isSavedRef.current = true;
    try {
      applyThemeToDom(selectedTheme, true);
      const res = await apiClient.patch<{ data: { user: any } }>('/api/auth/me', {
        theme: selectedTheme,
      });

      if (setUser && res.data?.user) {
        setUser((prev) => (prev ? { ...prev, ...res.data.user, theme: selectedTheme } : res.data.user));
      }

      toast.success(
        selectedTheme === 'dark' 
          ? '🌙 Modo oscuro guardado' 
          : selectedTheme === 'light' 
          ? '☀️ Modo claro guardado' 
          : '💻 Tema del sistema guardado'
      );
      onClose();
    } catch (err) {
      console.error('Error saving theme:', err);
      // Even if API fails, local storage keeps user choice
      toast.success('Preferencia aplicada');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions: {
    id: ThemeType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    previewBg: string;
    accentColor: string;
  }[] = [
    {
      id: 'light',
      label: 'Modo Claro',
      sublabel: 'Limpio, nítido y luminoso',
      icon: <Sun size={20} className="text-amber-500" />,
      previewBg: 'bg-[#F4F6F9] border-zinc-200',
      accentColor: 'border-amber-400 bg-amber-50/20 text-amber-600',
    },
    {
      id: 'dark',
      label: 'Modo Oscuro',
      sublabel: 'Descanso visual con tonos oscuros',
      icon: <Moon size={20} className="text-indigo-400" />,
      previewBg: 'bg-[#13151A] border-zinc-800',
      accentColor: 'border-[#6C5DD3] bg-indigo-500/10 text-indigo-400',
    },
    {
      id: 'system',
      label: 'Automático',
      sublabel: 'Sigue el tema de tu dispositivo',
      icon: <Monitor size={20} className="text-blue-400" />,
      previewBg: 'bg-gradient-to-r from-[#F4F6F9] to-[#13151A] border-zinc-300 dark:border-zinc-700',
      accentColor: 'border-blue-400 bg-blue-500/10 text-blue-500',
    },
  ];

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop with frosted blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Card / Mobile Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="w-full max-w-md bg-white dark:bg-[#1C1F26] rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 sm:p-7 relative overflow-hidden z-10 max-h-[92dvh] overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Native Mobile Pull Handle */}
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-3 sm:hidden" />

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-zinc-100 dark:border-white/10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6C5DD3] to-[#8E82E3] text-white flex items-center justify-center shadow-md shadow-[#6C5DD3]/20 shrink-0">
              <Palette size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                  Elige tu Apariencia
                </h3>
                {isPostOnboarding && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                    <Sparkles size={10} /> Nuevo
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Toca una opción para previsualizar el cambio en tiempo real.
              </p>
            </div>
          </div>

          {/* Theme Option Cards */}
          <div className="space-y-3 mb-6">
            {themeOptions.map((opt) => {
              const isSelected = selectedTheme === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectTheme(opt.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left active:scale-[0.98] ${
                    isSelected
                      ? 'border-[#6C5DD3] bg-[#6C5DD3]/5 dark:bg-[#6C5DD3]/15 shadow-sm ring-2 ring-[#6C5DD3]/20'
                      : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Visual Icon Container */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs shrink-0 ${opt.previewBg}`}>
                      {opt.icon}
                    </div>

                    <div className="min-w-0">
                      <div className={`text-sm font-extrabold truncate ${
                        isSelected ? 'text-[#6C5DD3] dark:text-white' : 'text-zinc-900 dark:text-zinc-100'
                      }`}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium truncate">
                        {opt.sublabel}
                      </div>
                    </div>
                  </div>

                  {/* Radio / Checkmark Indicator */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ml-2 ${
                    isSelected
                      ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-sm'
                      : 'border-zinc-300 dark:border-zinc-600 bg-transparent'
                  }`}>
                    {isSelected && <Check size={13} strokeWidth={3} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors text-center"
            >
              Mantener actual ({initialThemeRef.current === 'dark' ? 'Oscuro' : initialThemeRef.current === 'light' ? 'Claro' : 'Automático'})
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-extrabold transition-all shadow-lg shadow-[#6C5DD3]/25 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar tema fijo</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ThemePreferenceModal;
