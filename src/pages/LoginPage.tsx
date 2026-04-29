import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { Layout, Shield, Globe } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import AmbientBackground from '../components/layout/AmbientBackground';

import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative font-sans overflow-hidden">
        <AmbientBackground />
        <div className="w-full max-w-[1000px] min-h-[600px] bg-white/80 backdrop-blur-xl border border-white/20 rounded shadow-2xl flex overflow-hidden">
          {/* Left Panel Skeleton */}
          <div className="hidden md:flex flex-1 bg-[#1E293B] p-16 flex-col justify-between">
            <div className="flex flex-col items-center gap-6">
              <Skeleton className="w-48 h-48 rounded bg-slate-800" />
            </div>
            <div className="text-center">
              <Skeleton className="h-12 w-full mb-4 bg-slate-800" />
              <Skeleton className="h-4 w-3/4 mx-auto bg-slate-800" />
            </div>
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-8 w-48 bg-slate-800" />
            </div>
          </div>
          {/* Right Panel Skeleton */}
          <div className="flex-[1.2] p-10 md:p-20 bg-white flex flex-col justify-center">
            <div className="mb-10">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-6 max-w-[400px]">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-11 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-11 w-full" />
              </div>
              <Skeleton className="h-11 w-full mt-2" />
              <div className="flex items-center gap-4 py-2">
                 <div className="h-px flex-1 bg-zinc-100" />
                 <Skeleton className="h-3 w-20" />
                 <div className="h-px flex-1 bg-zinc-100" />
              </div>
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/app';
      navigate(redirect);
    } catch (err: any) {
      setError('Credenciales incorrectas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center sm:p-6 relative font-sans overflow-x-hidden bg-white sm:bg-transparent">
      <div className="hidden sm:block">
        <AmbientBackground />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1000px] sm:min-h-[600px] bg-white sm:bg-white/90 sm:backdrop-blur-md sm:border sm:border-white/20 sm:rounded-2xl sm:shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 min-h-screen sm:min-h-0"
      >
        
        {/* LEFT PANEL: Modern Professional Sidebar */}
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
                <filter id="noiseFilter">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
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
                Productividad <br/> sin límites.
              </h1>
              <p className="text-lg text-white/60 font-medium max-w-sm mx-auto leading-relaxed">
                Gestiona tus proyectos con una interfaz profesional diseñada para el alto rendimiento y la claridad visual.
              </p>
           </motion.div>

        </div>

        {/* RIGHT PANEL: Clean Access Form */}
        <div className="flex-1 md:flex-[1.2] p-8 sm:p-10 md:p-20 bg-white flex flex-col justify-center min-h-screen sm:min-h-0">
          
          {/* Mobile Logo Branding */}
          <div className="md:hidden flex flex-col items-center mb-8">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="mb-4"
             >
                <img src="/lumins-log.webp" alt="Lumins" className="h-16 w-auto drop-shadow-sm" />
             </motion.div>
             <h2 className="brand-logotype text-xl bg-clip-text text-transparent bg-gradient-to-tr from-[#312E81] via-[#4338ca] to-[#7C3AED] font-black tracking-tighter">LUMINS</h2>
          </div>

          <div className="mb-10 text-center md:text-left">
              <h2 className="hidden md:block text-xl font-bold text-slate-500 mb-1 tracking-tight uppercase">
                Ingresa a <span className="brand-logotype text-xl bg-clip-text text-transparent bg-gradient-to-tr from-[#312E81] via-[#4338ca] to-[#7C3AED] block mt-1">LUMINS</span>
              </h2>
             <p className="text-[#6B7280] font-medium text-lg">Tu centro de operaciones inteligente</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-[400px] mx-auto md:mx-0">
            <div className="flex flex-col gap-2">
               <label className="text-sm font-bold text-zinc-700 ml-1">Email</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full h-12 sm:h-11 bg-[#F4F5F7] border border-[#E8E9EC] rounded-xl sm:rounded px-4 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-[#4338ca]/15 focus:border-[#4338ca]/40 transition-all placeholder:text-zinc-400"
                 placeholder="ejemplo@correo.com"
                 autoComplete="email"
                 inputMode="email"
                 required
               />
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-zinc-700">Contraseña</label>
                  <Link to="/forgot-password" title="¿Olvidaste tu contraseña?" className="text-[12px] font-bold text-[#4338ca] hover:underline">¿Olvidaste tu contraseña?</Link>
               </div>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full h-12 sm:h-11 bg-[#F4F5F7] border border-[#E8E9EC] rounded-xl sm:rounded px-4 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-[#4338ca]/15 focus:border-[#4338ca]/40 transition-all placeholder:text-zinc-400"
                 placeholder="••••••••"
                 autoComplete="current-password"
                 required
               />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded border border-red-100 animate-in fade-in slide-in-from-top-1">
                 <span className="text-xs font-bold">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="mt-2 h-12 sm:h-11 bg-[#4338ca] text-white text-sm font-bold rounded-xl sm:rounded hover:bg-[#312e81] transition-all shadow-sm active:scale-[0.98]"
            >
              Iniciar sesión
            </Button>

            <div className="flex items-center gap-4 py-2">
               <div className="h-px flex-1 bg-[#F0F1F3]" />
               <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">o continúa con</span>
               <div className="h-px flex-1 bg-[#F0F1F3]" />
            </div>

            <button 
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/google`;
              }}
              className="h-12 sm:h-11 border border-[#E8E9EC] rounded-xl sm:rounded text-[#374151] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F4F5F7] transition-all active:scale-[0.98]"
            >
               <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
               </svg>
               Google
            </button>
          </form>

          <div className="mt-12 text-center md:text-left">
             <p className="text-sm text-[#6B7280] font-medium">
                ¿No tienes una cuenta? <Link to="/register" className="text-[#4338ca] font-bold hover:underline">Regístrate gratis</Link>
             </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default LoginPage;
