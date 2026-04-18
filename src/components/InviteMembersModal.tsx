import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, User, Users } from 'lucide-react';
import apiClient from '../lib/api-client';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

type Role = 'ADMIN' | 'MEMBER' | 'GUEST';

const InviteMembersModal: React.FC<InviteMembersModalProps> = ({ 
  isOpen, 
  onClose, 
  workspaceId,
  workspaceName
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !workspaceId) return;

    setIsLoading(true);
    setError('');

    try {
      await apiClient.post(`/api/workspaces/${workspaceId}/invite`, {
        email: email.trim(),
        role
      });
      
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la invitación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('MEMBER');
    setError('');
    setSuccess(false);
    onClose();
  };

  const roles = [
    { 
      id: 'ADMIN', 
      title: 'Admin', 
      desc: 'Acceso total y gestión.',
      icon: <ShieldCheck size={20} /> 
    },
    { 
      id: 'MEMBER', 
      title: 'Miembro', 
      desc: 'Crea y edita contenido.',
      icon: <Users size={20} /> 
    },
    { 
      id: 'GUEST', 
      title: 'Invitado', 
      desc: 'Solo lectura o asignados.',
      icon: <User size={20} /> 
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-white rounded-[24px] shadow-[0_20px_40px_-15px_rgba(122,90,248,0.2)] p-10 relative overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">Invitar al equipo</h2>
                <p className="text-[#806F9B] font-medium text-sm">
                  Añade colaboradores a <span className="text-[#7A5AF8] font-bold">{workspaceName}</span>
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:bg-[#F3E8FF] hover:text-[#7A5AF8] transition-all"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {success ? (
              <div className="py-10 text-center space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail size={40} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">¡Invitación Enviada!</h3>
                <p className="text-zinc-500">Hemos enviado un correo a {email}.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email Input */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em] ml-1">
                    Email del Invitado *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7A5AF8]/40" size={20} strokeWidth={3} />
                    <input 
                      type="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@empresa.com"
                      className="w-full h-14 bg-[#F3E8FF] border-none rounded-[12px] pl-14 pr-5 text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-[#7A5AF8]/50 transition-all placeholder:text-[#7A5AF8]/30"
                      required
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#806F9B] uppercase tracking-[0.4em] ml-1">
                    Rol en el Espacio
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((r) => (
                      <div 
                        key={r.id}
                        onClick={() => setRole(r.id as Role)}
                        className={`p-4 rounded-[16px] border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                          role === r.id 
                            ? 'border-[#7A5AF8] bg-[#F3E8FF] shadow-sm scale-[1.02]' 
                            : 'border-zinc-100 bg-white hover:border-zinc-200'
                        }`}
                      >
                        <div className={role === r.id ? 'text-[#7A5AF8]' : 'text-zinc-400'}>
                          {r.icon}
                        </div>
                        <div className="space-y-1">
                          <div className="font-black text-zinc-900 text-xs uppercase tracking-wider">{r.title}</div>
                          <div className="text-[9px] text-[#806F9B] font-bold leading-tight line-clamp-2">{r.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest text-center py-3 rounded-[12px]">
                    {error}
                  </div>
                )}

                {/* Footer Actions */}
                <div className="mt-10 flex justify-end items-center gap-6">
                  <button 
                    type="button"
                    onClick={handleClose}
                    className="text-[#806F9B] font-bold text-sm hover:text-zinc-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className={`
                      h-14 px-10 rounded-[12px] font-black text-white transition-all relative overflow-hidden
                      ${isLoading || !email.trim() 
                        ? 'bg-zinc-200 cursor-not-allowed opacity-50 grayscale' 
                        : 'bg-gradient-to-r from-[#7A5AF8] to-[#E91E63] hover:shadow-[0_8px_16px_-6px_rgba(122,90,248,0.4)] active:scale-[0.98]'
                      }
                    `}
                  >
                    {isLoading ? 'ENVIANDO...' : 'ENVIAR INVITACIÓN'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteMembersModal;
