import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  Calendar,
  Download,
  Mail,
  Smartphone,
  Shield,
  ArrowRight,
  Check,
  History,
  ChevronDown,
} from 'lucide-react';
import { useProductUpdates } from '../../contexts/ProductUpdatesContext';
import type { ReleaseHighlight, ProductRelease } from '../../config/productUpdates';

const renderHighlightIcon = (iconName?: string) => {
  const iconProps = { size: 18, className: 'shrink-0 text-[#6C5DD3] dark:text-[#A599F9]' };
  switch (iconName) {
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'download':
      return <Download {...iconProps} />;
    case 'mail':
      return <Mail {...iconProps} />;
    case 'smartphone':
      return <Smartphone {...iconProps} />;
    case 'shield':
      return <Shield {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
};

export const ProductUpdatesModal: React.FC = () => {
  const { isOpen, closeUpdates, releases, latestRelease } = useProductUpdates();
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(latestRelease.id);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const currentRelease =
    releases.find((r) => r.id === selectedReleaseId) || latestRelease;

  const handleAction = () => {
    closeUpdates();
    if (currentRelease.ctaUrl) {
      navigate(currentRelease.ctaUrl);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden sm:overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeUpdates}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window / Native Mobile Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-white dark:bg-[#181B22] rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-200/90 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] z-10"
        >
          {/* Header con gradiente Lumins */}
          <div className="relative px-5 sm:px-8 pt-3 sm:pt-7 pb-5 sm:pb-6 bg-gradient-to-br from-[#6C5DD3] via-[#7C3AED] to-[#4F46E5] text-white overflow-hidden shrink-0">
            {/* Grab Handle para móvil estilo iOS / Android Sheet */}
            <div className="w-12 h-1.5 bg-white/35 rounded-full mx-auto mb-3 sm:hidden" />

            {/* Elemento decorativo de fondo */}
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-12 bottom-0 w-24 h-24 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

            {/* Botón cerrar */}
            <button
              onClick={closeUpdates}
              className="absolute top-3.5 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-black/15 hover:bg-black/30 text-white transition-all hover:scale-105 active:scale-95 z-10"
              aria-label="Cerrar novedades"
            >
              <X size={18} />
            </button>

            {/* Badges superiores con espacio limpio para el botón cerrar */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5 sm:mb-3 pr-14 sm:pr-16">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white">
                <Sparkles size={11} /> {currentRelease.badge}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] sm:text-[11px] font-bold text-white/95">
                {currentRelease.version}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] sm:text-[11px] font-medium text-white/85">
                {currentRelease.releaseDate}
              </span>
            </div>

            {/* Título y subtítulo */}
            <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-snug pr-10 sm:pr-12">
              {currentRelease.title}
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 font-medium mt-1.5 sm:mt-2 line-clamp-2 max-w-xl leading-relaxed">
              {currentRelease.subtitle}
            </p>
          </div>

          {/* Selector de versión si hay más de 1 release */}
          {releases.length > 1 && (
            <div className="px-5 sm:px-8 py-2.5 bg-zinc-50 dark:bg-black/20 border-b border-zinc-100 dark:border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <History size={12} /> Versiones:
              </span>
              {releases.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => setSelectedReleaseId(rel.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 ${
                    rel.id === selectedReleaseId
                      ? 'bg-[#6C5DD3] text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/5'
                  }`}
                >
                  {rel.version}
                </button>
              ))}
            </div>
          )}

          {/* Cuerpo: Lista de Mejoras (Scrollable) */}
          <div className="p-4 sm:p-8 overflow-y-auto space-y-3 sm:space-y-4 flex-1 overscroll-contain">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-2 sm:mb-3">
              Lo nuevo en esta actualización
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {currentRelease.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#13151A] border border-zinc-200/70 dark:border-white/5 hover:border-[#6C5DD3]/40 transition-colors flex flex-col justify-between active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#6C5DD3]/10 flex items-center justify-center shrink-0">
                        {renderHighlightIcon(item.iconName)}
                      </div>
                      {item.tag && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug mb-1">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer con botones de acción estilo App Nativa */}
          <div className="py-3 sm:py-4 px-5 sm:px-8 pb-[max(1rem,env(safe-area-inset-bottom))] bg-zinc-50/90 dark:bg-black/40 border-t border-zinc-100 dark:border-white/5 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-4 shrink-0 backdrop-blur-md">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline">
              Puedes volver a abrir este resumen pulsando la campana de notificaciones.
            </span>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={closeUpdates}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors text-center"
              >
                Cerrar
              </button>

              {currentRelease.ctaText && (
                <button
                  type="button"
                  onClick={handleAction}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-black transition-all shadow-md shadow-[#6C5DD3]/25 flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>{currentRelease.ctaText}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
