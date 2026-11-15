import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { LuminsSuccessIcon } from '../components/icons/LuminsIcons';
import Button from '../components/ui/Button';
import apiClient from '../lib/api-client';
import AmbientBackground from '../components/layout/AmbientBackground';
import BrandLogo from '../components/ui/BrandLogo';
import { motion, AnimatePresence } from 'framer-motion';

const LEGAL_BASE_URL = (import.meta.env.VITE_LEGAL_BASE_URL || 'https://lumins.tech').replace(/\/$/, '');

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de recuperación no válido o ausente.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/api/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      setIsSuccess(true);
      // Auto redirect after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center sm:p-6 relative font-sans overflow-x-hidden bg-white sm:bg-transparent">
      <div className="hidden sm:block">
        <AmbientBackground />
      </div>
      <div 
        className="w-full max-w-[1000px] sm:min-h-[620px] bg-white sm:border sm:border-slate-200/80 sm:rounded-[20px] sm:shadow-2xl sm:shadow-slate-300/40 flex flex-col md:flex-row overflow-hidden relative z-10 min-h-screen sm:min-h-0"
      >
        {/* LEFT PANEL: Branding */}
        <div className="hidden md:flex flex-1 bg-[#05040A] p-12 lg:p-14 flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle Luminous Mesh Gradient matching landing */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ 
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(18, 169, 168, 0.24) 0%, transparent 55%),
                radial-gradient(circle at 85% 85%, rgba(255, 204, 64, 0.16) 0%, transparent 50%),
                radial-gradient(circle at 75% 25%, rgba(255, 102, 94, 0.12) 0%, transparent 45%)
              `
            }} 
          />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <BrandLogo size="md" variant="light-text" />
          </div>

          <div className="relative z-10 my-auto py-8">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight tracking-tight text-white">
              Nueva <br />
              <span className="text-[#12A9A8]">contraseña.</span>
            </h1>
            <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-xs mb-8">
              Crea una clave segura para proteger el acceso a tus tableros, calendarios y proyectos.
            </p>

            {/* Feature Highlights with Brand Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#12A9A8]" />
                <span className="font-medium">Protección integral de tus tableros</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#FFCC40]" />
                <span className="font-medium">Sesión cifrada y segura</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-[#FF665E]" />
                <span className="font-medium">Acceso instantáneo tras guardar</span>
              </div>
            </div>
          </div>

          {/* Footer Indicators */}
          <div className="relative z-10 flex items-center gap-4 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Lumins</span>
            <span>•</span>
            <a href={`${LEGAL_BASE_URL}/privacidad`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacidad</a>
            <span>•</span>
            <a href={`${LEGAL_BASE_URL}/terminos`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Términos</a>
          </div>
        </div>

        {/* RIGHT PANEL: Form */}
        <div className="flex-1 md:flex-[1.2] p-8 sm:p-10 md:p-14 lg:p-16 bg-white flex flex-col justify-center min-h-screen sm:min-h-0">
          
          {/* Mobile Logo Branding */}
          <div className="md:hidden flex justify-center mb-8">
            <BrandLogo size="md" />
          </div>

          <AnimatePresence mode="wait">
            {!token && !isSuccess ? (
              <motion.div 
                key="invalid" 
                initial={{ opacity: 0, x: 8 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -8 }} 
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="text-center py-4 w-full max-w-[400px] mx-auto md:mx-0"
              >
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-[14px] flex items-center justify-center mx-auto mb-5 border border-red-100">
                  <AlertCircle size={28} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Enlace no válido</h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.
                </p>
                <Link 
                  to="/forgot-password" 
                  className="inline-flex items-center justify-center h-11 px-6 bg-[#12A9A8] hover:bg-[#0E8786] text-white text-sm font-bold rounded-[10px] shadow-sm transition-all active:scale-[0.98]"
                >
                  Solicitar nuevo enlace
                </Link>
              </motion.div>
            ) : isSuccess ? (
              <motion.div 
                key="success" 
                initial={{ opacity: 0, x: 8 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -8 }} 
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="text-center py-4 w-full max-w-[400px] mx-auto md:mx-0"
              >
                <div className="w-14 h-14 bg-[#12A9A8]/10 border border-[#12A9A8]/25 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <LuminsSuccessIcon size={28} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">¡Contraseña actualizada!</h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Tu contraseña ha sido restablecida con éxito. Serás redirigido al inicio de sesión en unos segundos.
                </p>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center h-11 px-6 bg-[#12A9A8] hover:bg-[#0E8786] text-white text-sm font-bold rounded-[10px] shadow-sm transition-all active:scale-[0.98]"
                >
                  Ir al inicio de sesión
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                key="form" 
                initial={{ opacity: 0, x: 8 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -8 }} 
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full max-w-[400px] mx-auto md:mx-0"
              >
                <div className="mb-6 text-left">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Nueva contraseña
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">
                    Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-xs font-bold text-slate-700 ml-0.5">
                      Nueva contraseña
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 bg-[#F8FAFC] border border-slate-200 rounded-[10px] pl-10 pr-4 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all placeholder:text-slate-400"
                        placeholder="••••••••"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 ml-0.5">
                      Confirmar contraseña
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 bg-[#F8FAFC] border border-slate-200 rounded-[10px] pl-10 pr-4 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#12A9A8]/20 focus:border-[#12A9A8] transition-all placeholder:text-slate-400"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-[10px] border border-red-100 text-xs font-semibold animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="h-11 w-full bg-[#12A9A8] hover:bg-[#0E8786] text-white text-sm font-bold rounded-[10px] shadow-sm transition-all active:scale-[0.98] mt-2"
                  >
                    Actualizar contraseña
                  </Button>

                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors pt-2"
                  >
                    <ArrowLeft size={14} />
                    Volver al inicio de sesión
                  </Link>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
