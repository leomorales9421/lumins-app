import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lightbulb, 
  Send, 
  Loader2, 
  Paperclip,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { compressSupportAttachment } from '../../lib/image-utils';
import { Badge } from '../ui/Badge';
import {
  LuminsSupportIcon,
  LuminsErrorIcon,
  LuminsInfoIcon,
  LuminsWarningIcon,
  LuminsSuccessIcon,
  LuminsTrashIcon,
} from '../icons/LuminsIcons';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SupportCategory = 'problema' | 'duda' | 'sugerencia' | 'queja';

interface CategoryOption {
  id: SupportCategory;
  label: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  activeBorder: string;
  activeBg: string;
  activeBadge: string;
  dotColor: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'problema',
    label: 'Problema / Error',
    badge: 'Bug',
    description: 'Fallo técnico, error en pantalla o algo no funciona.',
    icon: <LuminsErrorIcon size={20} />,
    activeBorder: 'border-[#FF665E] ring-2 ring-[#FF665E]/20',
    activeBg: 'bg-[#FF665E]/[0.05] dark:bg-[#FF665E]/10',
    activeBadge: 'bg-[#FF665E]/15 text-[#D94841] dark:text-[#FF857E]',
    dotColor: 'bg-[#FF665E]',
  },
  {
    id: 'duda',
    label: 'Duda o Consulta',
    badge: 'Ayuda',
    description: 'Preguntas sobre cómo usar funciones o tableros.',
    icon: <LuminsInfoIcon size={20} />,
    activeBorder: 'border-[#12A9A8] ring-2 ring-[#12A9A8]/20',
    activeBg: 'bg-[#12A9A8]/[0.05] dark:bg-[#12A9A8]/10',
    activeBadge: 'bg-[#12A9A8]/15 text-[#0E8786] dark:text-[#4CD4D3]',
    dotColor: 'bg-[#12A9A8]',
  },
  {
    id: 'sugerencia',
    label: 'Sugerencia',
    badge: 'Idea',
    description: 'Ideas de funciones que te gustaría ver en Lumins.',
    icon: (
      <span className="w-5 h-5 rounded-md bg-[#12A9A8] text-white flex items-center justify-center shadow-xs">
        <Lightbulb size={13} strokeWidth={2.4} />
      </span>
    ),
    activeBorder: 'border-[#12A9A8] ring-2 ring-[#12A9A8]/20',
    activeBg: 'bg-[#12A9A8]/[0.05] dark:bg-[#12A9A8]/10',
    activeBadge: 'bg-[#12A9A8]/15 text-[#0E8786] dark:text-[#4CD4D3]',
    dotColor: 'bg-[#12A9A8]',
  },
  {
    id: 'queja',
    label: 'Queja o Reclamo',
    badge: 'Reclamo',
    description: 'Inconformidad con el servicio o la experiencia.',
    icon: <LuminsWarningIcon size={20} />,
    activeBorder: 'border-[#FFCC40] ring-2 ring-[#FFCC40]/25',
    activeBg: 'bg-[#FFCC40]/[0.05] dark:bg-[#FFCC40]/10',
    activeBadge: 'bg-[#FFCC40]/20 text-[#9A6700] dark:text-[#FFCC40]',
    dotColor: 'bg-[#FFCC40]',
  },
];

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB
const MAX_FILE_BYTES = 4 * 1024 * 1024;  // 4 MB

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<SupportCategory>('problema');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketCode: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Estados de adjunto
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionSavings, setCompressionSavings] = useState<{ original: number; compressed: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar URL del preview al desmontar o cambiar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading]);

  // Procesamiento y compresión de archivos
  const processFile = useCallback(async (file: File, isPasted = false) => {
    const isImage = file.type.startsWith('image/');

    if (isImage) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error('La imagen supera el límite permitido de 6 MB.', {
          description: `Tamaño detectado: ${formatBytes(file.size)}. Por favor selecciona una imagen menor a 6 MB.`,
        });
        return;
      }

      let targetFile = file;
      if (isPasted || !file.name || file.name === 'image.png') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        targetFile = new File([file], `captura-soporte-${timestamp}.jpg`, { type: file.type });
      }

      setIsCompressing(true);
      const originalSize = targetFile.size;

      try {
        const compressed = await compressSupportAttachment(targetFile);
        
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const newPreview = URL.createObjectURL(compressed);

        setAttachedFile(compressed);
        setPreviewUrl(newPreview);

        if (compressed.size < originalSize) {
          setCompressionSavings({ original: originalSize, compressed: compressed.size });
          const savingsPercent = Math.round((1 - compressed.size / originalSize) * 100);
          toast.success(
            isPasted ? 'Captura de pantalla pegada y comprimida' : 'Imagen optimizada con éxito',
            {
              description: `Reducida de ${formatBytes(originalSize)} a ${formatBytes(compressed.size)} (-${savingsPercent}%)`,
            }
          );
        } else {
          setCompressionSavings(null);
          toast.success(isPasted ? 'Captura de pantalla pegada' : 'Imagen adjuntada');
        }
      } catch (err) {
        console.error('Error al comprimir imagen de soporte:', err);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setAttachedFile(targetFile);
        setPreviewUrl(URL.createObjectURL(targetFile));
        setCompressionSavings(null);
      } finally {
        setIsCompressing(false);
      }
    } else {
      if (file.size > MAX_FILE_BYTES) {
        toast.error('El archivo supera el límite permitido de 4 MB.', {
          description: `Tamaño detectado: ${formatBytes(file.size)}. El límite para documentos es de 4 MB.`,
        });
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setAttachedFile(file);
      setPreviewUrl(null);
      setCompressionSavings(null);
      toast.success(`Archivo "${file.name}" adjuntado exitosamente (${formatBytes(file.size)}).`);
    }
  }, [previewUrl]);

  // Manejador de evento pegar (Ctrl + V)
  const handlePaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    if (!e.clipboardData) return;

    const items = e.clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file, true);
          break;
        }
      }
    }
  }, [processFile]);

  // Listener global de paste mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;

    const windowPasteListener = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          handlePaste(e);
          break;
        }
      }
    };

    window.addEventListener('paste', windowPasteListener);
    return () => {
      window.removeEventListener('paste', windowPasteListener);
    };
  }, [isOpen, handlePaste]);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], false);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAttachedFile(null);
    setPreviewUrl(null);
    setCompressionSavings(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetAndClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCategory('problema');
    setSubject('');
    setMessage('');
    setAttachedFile(null);
    setPreviewUrl(null);
    setCompressionSavings(null);
    setSubmittedTicket(null);
    setCopiedCode(false);
    onClose();
  };

  const handleCopyTicketCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error('Por favor ingresa un asunto.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      toast.error('Por favor describe tu mensaje con al menos 10 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('subject', subject.trim());
      formData.append('message', message.trim());
      if (attachedFile) {
        formData.append('file', attachedFile);
      }

      const res = await apiClient.post<any>('/api/support/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const ticket = res.data?.data?.ticket || res.data?.ticket;
      setSubmittedTicket({ ticketCode: ticket?.ticketCode || '#TK-OK' });
      toast.success('¡Solicitud de soporte enviada exitosamente!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al enviar la solicitud de soporte.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300"
          onClick={handleResetAndClose}
          onPaste={handlePaste}
        >
          <motion.div 
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#1C1F26] rounded-t-[28px] sm:rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Drag Indicator Pill */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300/80 dark:bg-white/20 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-white/[0.02] backdrop-blur-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#12A9A8]/15 to-[#12A9A8]/5 border border-[#12A9A8]/30 shadow-[0_0_15px_rgba(18,169,168,0.12)] flex items-center justify-center shrink-0 text-[#12A9A8]">
                  <LuminsSupportIcon size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight truncate">
                      Centro de Soporte y Ayuda
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#12A9A8]/10 text-[#0E8786] dark:text-[#4CD4D3] border border-[#12A9A8]/20">
                      <Sparkles size={10} />
                      Lumins
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    Escribe tu problema, duda o sugerencia directamente a nuestro equipo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
                aria-label="Cerrar soporte"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            {submittedTicket ? (
              <div className="p-6 sm:p-10 text-center flex flex-col items-center justify-center space-y-4 my-auto overflow-y-auto">
                <div className="w-16 h-16 rounded-3xl bg-[#12A9A8]/10 border border-[#12A9A8]/20 flex items-center justify-center shadow-lg shadow-[#12A9A8]/15 text-[#12A9A8]">
                  <LuminsSuccessIcon size={38} />
                </div>
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-zinc-100">
                  ¡Mensaje enviado con éxito!
                </h4>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-zinc-200 shadow-xs">
                  <span>Ticket: {submittedTicket.ticketCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTicketCode(submittedTicket.ticketCode)}
                    className="p-1 rounded-md hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check size={14} className="text-[#12A9A8]" /> : <Copy size={14} />}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Hemos registrado tu solicitud y una notificación directa ha llegado a nuestro equipo técnico. Te responderemos al correo <strong>{user?.email}</strong> con prioridad.
                </p>

                <div className="pt-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#12A9A8] to-[#0E8786] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md shadow-[#12A9A8]/25 hover:brightness-105 active:scale-95 cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Category selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      ¿Qué tipo de mensaje deseas enviar?
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      Selecciona una categoría
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {CATEGORIES.map(cat => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`
                            relative flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] min-h-[76px] sm:min-h-[82px] justify-between
                            ${isSelected 
                              ? `bg-white dark:bg-[#1E222B] ${cat.activeBorder} ${cat.activeBg} shadow-sm` 
                              : 'border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/70 dark:bg-[#14161C] text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/[0.03]'}
                          `}
                        >
                          <div className="flex items-start justify-between w-full gap-2">
                            <span className="shrink-0">{cat.icon}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cat.activeBadge}`}>
                              {cat.badge}
                            </span>
                          </div>

                          <div className="mt-2 min-w-0">
                            <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-slate-900 dark:text-zinc-100 font-extrabold' : 'text-slate-800 dark:text-zinc-200'}`}>
                              {cat.label}
                            </div>
                            <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-tight mt-0.5 line-clamp-2">
                              {cat.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Asunto */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1.5">
                    Asunto / Título
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Ej. Problema al sincronizar Google Calendar"
                    maxLength={120}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-[#13151A] text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#1C1F26] focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] outline-none transition-all"
                    required
                  />
                </div>

                {/* Mensaje */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                      Descripción detallada
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {message.length}/1000
                    </span>
                  </div>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Explica qué sucedió, pasos para reproducir el error o los detalles de tu sugerencia..."
                    rows={4}
                    maxLength={1000}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-[#13151A] text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#1C1F26] focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] outline-none transition-all resize-none leading-relaxed"
                    required
                  />
                </div>

                {/* Sección de Archivo Adjunto */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Paperclip size={13} className="text-[#12A9A8]" />
                      <span>Adjuntar Archivo o Captura (Opcional)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Archivos máx 4 MB · Imágenes máx 6 MB
                    </span>
                  </div>

                  {/* Input file oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="*/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0], false);
                      }
                    }}
                  />

                  {isCompressing ? (
                    <div className="p-4 rounded-2xl border border-dashed border-[#12A9A8]/40 bg-[#12A9A8]/5 flex items-center justify-center gap-3 text-xs text-[#12A9A8] font-bold animate-pulse">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Minimizando y optimizando imagen...</span>
                    </div>
                  ) : attachedFile ? (
                    /* Archivo cargado con preview y opción de eliminar */
                    <div className="p-3 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#14161C] flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {previewUrl ? (
                          <img 
                            src={previewUrl} 
                            alt="Vista previa" 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0" 
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#12A9A8]/10 text-[#12A9A8] flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {attachedFile.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatBytes(attachedFile.size)}
                            </span>
                            {compressionSavings && (
                              <Badge tone="teal" variant="inline" size="xs">
                                Comprimida (-{Math.round((1 - compressionSavings.compressed / compressionSavings.original) * 100)}%)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="w-9 h-9 rounded-xl text-slate-400 hover:text-[#FF665E] hover:bg-[#FF665E]/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Eliminar archivo adjunto"
                      >
                        <LuminsTrashIcon size={16} />
                      </button>
                    </div>
                  ) : (
                    /* Zona interactiva de drop/upload */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        p-4 rounded-2xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center
                        ${isDragging 
                          ? 'border-[#12A9A8] bg-[#12A9A8]/5 ring-2 ring-[#12A9A8]/20 scale-[0.99]' 
                          : 'border-slate-300 dark:border-white/15 hover:border-[#12A9A8] dark:hover:border-[#12A9A8] bg-slate-50/70 dark:bg-[#14161C] hover:bg-[#12A9A8]/[0.02]'}
                      `}
                    >
                      <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 mb-1">
                        <UploadCloud size={20} className="text-[#12A9A8]" />
                        <span className="text-xs font-bold">
                          Haz clic para examinar o arrastra aquí tu archivo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 flex-wrap justify-center">
                        <span>O puedes pegar una captura con</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-mono text-[10px] font-semibold border border-slate-300/80 dark:border-white/10">
                          Ctrl + V
                        </kbd>
                        <span>en cualquier momento</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Buttons — Adaptado móvil / tablet */}
                <div className="pt-3 pb-1 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    disabled={loading || isCompressing}
                    className="w-full sm:w-auto order-2 sm:order-1 h-10 px-5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isCompressing || !subject.trim() || !message.trim()}
                    className="w-full sm:w-auto order-1 sm:order-2 h-10 px-6 rounded-xl bg-gradient-to-r from-[#12A9A8] to-[#0E8786] hover:brightness-105 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#12A9A8]/20 disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Enviando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Enviar Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default SupportModal;
