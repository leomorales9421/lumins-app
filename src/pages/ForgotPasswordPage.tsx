import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import apiClient from '../lib/api-client';
import AmbientBackground from '../components/layout/AmbientBackground';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al enviar el enlace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative font-sans overflow-hidden">
      <AmbientBackground />
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1000px] min-h-[600px] bg-white/90 backdrop-blur-md border border-white/20 rounded shadow-2xl flex overflow-hidden relative z-10"
      >
        {/* LEFT PANEL: Branding */}
        <div className="hidden md:flex flex-1 bg-[#09090B] p-16 flex-col justify-center gap-16 text-white relative overflow-hidden">
           {/* 1. Radial Spotlight Effect */}
           <div 
             className="absolute inset-0 pointer-events-none" 
             style={{ 
               background: 'radial-gradient(circle at 50% 40%, rgba(30, 27, 75, 0.25) 0%, rgba(9, 9, 11, 0) 70%)' 
             }} 
           />

           {/* 2. Grain Texture Overlay */}
           <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <filter id="noiseFilterForgot">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilterForgot)" />
              </svg>
           </div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2, duration: 1 }}
             className="flex justify-center relative z-10"
           >
              <img 
                src="/lumins-log.webp" 
                alt="Lumins Logo" 
                className="h-40 w-auto object-contain" 
              />
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.4, duration: 0.8 }}
             className="relative z-10 text-center"
           >
              <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight text-white/90">
                Recupera tu <br/> acceso.
              </h1>
              <p className="text-lg text-white/60 font-medium max-w-sm mx-auto leading-relaxed">
                Estamos aquí para ayudarte a volver al trabajo lo antes posible.
              </p>
           </motion.div>
        </div>

        {/* RIGHT PANEL: Form */}
        <div className="flex-[1.2] p-10 md:p-20 bg-white flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-4 w-full max-w-md mx-auto"
              >
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">¡Revisa tu bandeja de entrada!</h2>
            <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
              Te hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#6C5DD3] hover:text-[#5a4db8] transition-colors"
            >
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-md mx-auto"
              >
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-indigo-50 text-[#6C5DD3] rounded flex items-center justify-center mb-6 shadow-sm">
                <Key size={28} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Recuperar contraseña</h2>
              <p className="text-sm text-zinc-500 mt-2 text-center leading-relaxed">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[12px] font-bold text-zinc-700 ml-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-[#F4F6F9] border border-transparent rounded px-4 text-sm font-medium text-zinc-900 outline-none focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-zinc-400"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded border border-red-100 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full h-11 bg-[#6C5DD3] hover:bg-[#5a4db8] text-white text-sm font-bold rounded transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
              >
                Enviar enlace de recuperación
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors pt-2"
              >
                <ArrowLeft size={16} />
                Volver al Login
              </Link>
            </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
