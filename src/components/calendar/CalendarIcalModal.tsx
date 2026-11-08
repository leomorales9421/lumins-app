import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar as CalendarIcon,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';

interface CalendarIcalModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName?: string;
}

interface IcalFeedData {
  token: string;
  allFeedUrl: string;
  mineFeedUrl: string;
  webcalAllUrl: string;
  webcalMineUrl: string;
}

export const CalendarIcalModal: React.FC<CalendarIcalModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}) => {
  const [data, setData] = useState<IcalFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedMode, setFeedMode] = useState<'all' | 'mine'>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchFeedUrls();
    }
  }, [isOpen, workspaceId]);

  const fetchFeedUrls = async () => {
    try {
      setIsLoading(true);
      const res: any = await apiClient.get(`/api/workspaces/${workspaceId}/ical-feed`);
      const payload = res?.data || res;
      if (payload?.token || payload?.allFeedUrl) {
        setData(payload);
      }
    } catch {
      toast.error('Error al cargar enlaces de suscripción');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const res: any = await apiClient.post(`/api/workspaces/${workspaceId}/ical-feed/regenerate`);
      const payload = res?.data || res;
      if (payload?.token || payload?.allFeedUrl) {
        setData(payload);
        toast.success('Enlace de calendario regenerado', {
          description: 'Las suscripciones anteriores han sido revocadas por seguridad.',
        });
      }
    } catch {
      toast.error('Error al regenerar enlace');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!isOpen) return null;

  const activeUrl = feedMode === 'all' ? data?.allFeedUrl : data?.mineFeedUrl;
  const activeWebcal = feedMode === 'all' ? data?.webcalAllUrl : data?.webcalMineUrl;

  const handleCopy = () => {
    if (!activeUrl) return;
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    toast.success('Enlace iCal copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-[#6C5DD3] flex items-center justify-center border border-[#6C5DD3]/20">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Suscripción Externa (iCal)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {workspaceName || 'Espacio de trabajo'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 size={28} className="animate-spin text-[#6C5DD3]" />
                <span className="text-xs font-semibold">Generando enlace seguro...</span>
              </div>
            ) : (
              <>
                {/* Mode Selector */}
                <div className="flex bg-zinc-100 dark:bg-black/30 p-1 rounded-xl border border-zinc-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setFeedMode('all')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      feedMode === 'all'
                        ? 'bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
                    }`}
                  >
                    Todas las tareas con fecha
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedMode('mine')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      feedMode === 'mine'
                        ? 'bg-white dark:bg-[#1C1F26] text-zinc-900 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
                    }`}
                  >
                    Solo mis tareas asignadas
                  </button>
                </div>

                {/* Feed URL Box */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                    URL de suscripción iCal (.ics)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={activeUrl || ''}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copiar enlace"
                      className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  {activeWebcal && (
                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href={activeWebcal}
                        className="text-[11px] font-bold text-[#6C5DD3] hover:underline flex items-center gap-1"
                      >
                        Abrir directamente en Apple Calendar / Outlook (webcal://)
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Step Instructions */}
                <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-white/5 rounded-xl p-3.5 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
                  <div className="font-bold text-zinc-800 dark:text-zinc-200">
                    ¿Cómo agregar a tu calendario favorito?
                  </div>
                  <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                    <li>
                      <strong>Google Calendar:</strong> En el menú lateral, pulsa <em>Otros calendarios (+)</em> → <em>Desde una URL</em> y pega el enlace.
                    </li>
                    <li>
                      <strong>Apple Calendar (Mac/iPhone):</strong> En <em>Archivo</em> → <em>Nueva suscripción de calendario</em> y pega el enlace.
                    </li>
                    <li>
                      <strong>Microsoft Outlook:</strong> Pulsa <em>Agregar calendario</em> → <em>Suscribirse desde la web</em>.
                    </li>
                  </ul>
                </div>

                {/* Security Regenerate Warning */}
                <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <ShieldAlert size={14} className="text-amber-500" />
                    <span>Tu enlace contiene un token único privado.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                    Regenerar enlace
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

