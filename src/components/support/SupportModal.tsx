import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  HelpCircle, 
  AlertCircle, 
  Lightbulb, 
  MessageSquareWarning, 
  Send, 
  Loader2, 
  CheckCircle2,
  Paperclip,
  UploadCloud,
  FileText,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
import { compressSupportAttachment } from '../../lib/image-utils';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SupportCategory = 'problema' | 'duda' | 'sugerencia' | 'queja';

const CATEGORIES: Array<{
  id: SupportCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  activeColor: string;
  badgeBg: string;
}> = [
  {
    id: 'problema',
    label: 'Problema / Error',
    description: 'Fallo técnico, error en pantalla o algo no funciona.',
    icon: <AlertCircle size={18} />,
    activeColor: 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-500/10',
    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  {
    id: 'duda',
    label: 'Duda o Consulta',
    description: 'Preguntas sobre cómo usar una función en Lumins.',
    icon: <HelpCircle size={18} />,
    activeColor: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-500/10',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'sugerencia',
    label: 'Sugerencia',
    description: 'Ideas de mejora o nuevas funciones que te gustaría ver.',
    icon: <Lightbulb size={18} />,
    activeColor: 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-500/10',
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    id: 'queja',
    label: 'Queja o Reclamo',
    description: 'Inconformidad con el servicio o la experiencia.',
    icon: <MessageSquareWarning size={18} />,
    activeColor: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-500/10',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
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

      // Asignar nombre amigable si viene sin nombre o genérico del clipboard
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
        // Usar original como fallback
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setAttachedFile(targetFile);
        setPreviewUrl(URL.createObjectURL(targetFile));
        setCompressionSavings(null);
      } finally {
        setIsCompressing(false);
      }
    } else {
      // Cualquier otro tipo de archivo (PDF, ZIP, TXT, DOC, etc.)
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
      // Solo interceptar si el usuario pegó una imagen
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
    onClose();
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onPaste={handlePaste}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#1C1F26] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#A599F9] flex items-center justify-center shrink-0">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Centro de Soporte y Ayuda
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Escribe tu problema, duda o sugerencia directamente a nuestro equipo.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {submittedTicket ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              ¡Mensaje enviado con éxito!
            </h4>
            <div className="inline-block px-3 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
              Código de Ticket: {submittedTicket.ticketCode}
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Hemos registrado tu solicitud y se ha enviado una notificación directa con todos los detalles a nuestro equipo. Te responderemos al correo <strong>{user?.email}</strong>.
            </p>
            <button
              onClick={handleResetAndClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#6C5DD3]/25 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Category selection */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
                ¿Qué tipo de mensaje deseas enviar?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`
                        flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98]
                        ${isSelected 
                          ? `${cat.activeColor} border-2 shadow-xs ring-2 ring-current/10 font-bold` 
                          : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-[#13151A] text-zinc-600 dark:text-zinc-300'}
                      `}
                    >
                      <span className="shrink-0 mt-0.5">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold">{cat.label}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 truncate">
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
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5">
                Asunto / Título
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Ej. Problema al sincronizar Google Calendar"
                maxLength={120}
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#13151A] text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Mensaje */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Descripción detallada
                </label>
                <span className="text-[10px] text-zinc-400 font-semibold">
                  {message.length}/1000
                </span>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Explica qué sucedió, pasos para reproducir el error o los detalles de tu sugerencia..."
                rows={3}
                maxLength={1000}
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#13151A] text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all resize-none"
                required
              />
            </div>

            {/* Sección de Archivo Adjunto */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Paperclip size={13} className="text-[#6C5DD3]" />
                  <span>Adjuntar Archivo o Captura (Opcional)</span>
                </label>
                <span className="text-[10px] text-zinc-400">
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
                <div className="p-4 rounded-2xl border border-dashed border-[#6C5DD3]/40 bg-[#6C5DD3]/5 flex items-center justify-center gap-3 text-xs text-[#6C5DD3] font-bold animate-pulse">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Minimizando y optimizando imagen...</span>
                </div>
              ) : attachedFile ? (
                /* Archivo cargado con preview y opción de eliminar */
                <div className="p-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#13151A] flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Vista previa" 
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-white/10 shrink-0" 
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#6C5DD3]/10 text-[#6C5DD3] dark:text-[#A599F9] flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {attachedFile.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {formatBytes(attachedFile.size)}
                        </span>
                        {compressionSavings && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                            Comprimida (-{Math.round((1 - compressionSavings.compressed / compressionSavings.original) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="w-8 h-8 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                    title="Eliminar archivo adjunto"
                  >
                    <Trash2 size={16} />
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
                      ? 'border-[#6C5DD3] bg-[#6C5DD3]/10 ring-2 ring-[#6C5DD3]/30 scale-[0.99]' 
                      : 'border-zinc-300 dark:border-white/15 hover:border-[#6C5DD3] dark:hover:border-[#6C5DD3] bg-zinc-50/60 dark:bg-[#13151A]/60 hover:bg-[#6C5DD3]/5'}
                  `}
                >
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                    <UploadCloud size={20} className="text-[#6C5DD3]" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      Haz clic para examinar o arrastra aquí tu archivo
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <span>O puedes pegar una captura directamente con</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[10px] font-semibold border border-zinc-300 dark:border-zinc-700">
                      Ctrl + V
                    </kbd>
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={loading || isCompressing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || isCompressing || !subject.trim() || !message.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-[#6C5DD3]/25 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Enviando...</span>
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
      </div>
    </div>
  );
};

export default SupportModal;
