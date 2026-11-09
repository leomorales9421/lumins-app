import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  AlertCircle, 
  Lightbulb, 
  MessageSquareWarning, 
  Send, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';

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

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [category, setCategory] = useState<SupportCategory>('problema');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketCode: string } | null>(null);

  if (!isOpen) return null;

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
      const res = await apiClient.post<{
        success: boolean;
        data: { ticket: { ticketCode: string } };
      }>('/api/support/tickets', {
        category,
        subject: subject.trim(),
        message: message.trim(),
      });

      const ticket = res.data?.ticket;
      setSubmittedTicket({ ticketCode: ticket?.ticketCode || '#TK-OK' });
      toast.success('¡Solicitud de soporte enviada exitosamente!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error al enviar la solicitud de soporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setCategory('problema');
    setSubject('');
    setMessage('');
    setSubmittedTicket(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#1C1F26] rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
            className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
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
              Hemos registrado tu solicitud y se ha enviado una notificación directa a nuestro equipo. Te responderemos al correo <strong>{user?.email}</strong>.
            </p>
            <button
              onClick={handleResetAndClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#6C5DD3]/25"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
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
                rows={4}
                maxLength={1000}
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#13151A] text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all resize-none"
                required
              />
            </div>



            {/* Footer Buttons */}
            <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !subject.trim() || !message.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-[#6C5DD3]/25 disabled:opacity-50 active:scale-95"
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

