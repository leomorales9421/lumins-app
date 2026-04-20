import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { Layout, Shield, Globe } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F0F1F3] font-sans">
        <div className="w-full max-w-[1000px] min-h-[600px] bg-white rounded-2xl shadow-modal flex overflow-hidden">
          {/* Left Panel Skeleton */}
          <div className="hidden md:flex flex-1 bg-[#1A1A2E] p-16 flex-col justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl bg-slate-800" />
              <Skeleton className="h-6 w-32 bg-slate-800" />
            </div>
            <div>
              <Skeleton className="h-12 w-full mb-4 bg-slate-800" />
              <Skeleton className="h-12 w-3/4 mb-6 bg-slate-800" />
              <Skeleton className="h-4 w-full bg-slate-800" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48 bg-slate-800" />
              <Skeleton className="h-px w-16 bg-slate-800" />
              <Skeleton className="h-3 w-32 bg-slate-800" />
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F0F1F3] font-sans">
      <div className="w-full max-w-[1000px] min-h-[600px] bg-white rounded-2xl shadow-modal flex overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* LEFT PANEL: Modern Professional Sidebar */}
        <div className="hidden md:flex flex-1 bg-[#1A1A2E] p-16 flex-col justify-between text-white relative">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7A5AF8] rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
                 <Layout size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Luminous</span>
           </div>

           <div className="relative z-10">
              <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
                Productividad <br/> sin límites.
              </h1>
              <p className="text-lg text-slate-400 font-medium max-w-sm leading-relaxed">
                Gestiona tus proyectos con una interfaz profesional diseñada para el alto rendimiento y la claridad visual.
              </p>
           </div>

           <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 text-slate-400">
                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Shield size={16} />
                 </div>
                 <span className="text-sm font-medium">Seguridad de nivel empresarial</span>
              </div>
              <div className="h-px w-16 bg-slate-800" />
              <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">v2.0 Professional Edition</div>
           </div>
        </div>

        {/* RIGHT PANEL: Clean Access Form */}
        <div className="flex-[1.2] p-10 md:p-20 bg-white flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
             <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Bienvenido de nuevo</h2>
             <p className="text-[#6B7280] font-medium">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-[400px] mx-auto md:mx-0">
            <div className="flex flex-col gap-2">
               <label className="text-[12px] font-bold text-[#1A1A2E] ml-1">Email</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full h-11 bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg px-4 text-sm font-medium text-[#1A1A2E] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all placeholder:text-[#9CA3AF]"
                 placeholder="ejemplo@correo.com"
                 required
               />
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between ml-1">
                  <label className="text-[12px] font-bold text-[#1A1A2E]">Contraseña</label>
                  <Link to="/forgot-password" title="¿Olvidaste tu contraseña?" className="text-[12px] font-bold text-[#7A5AF8] hover:underline">¿Olvidaste tu contraseña?</Link>
               </div>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full h-11 bg-[#F4F5F7] border border-[#E8E9EC] rounded-lg px-4 text-sm font-medium text-[#1A1A2E] outline-none focus:ring-2 focus:ring-[#7A5AF8]/15 focus:border-[#7A5AF8]/40 transition-all placeholder:text-[#9CA3AF]"
                 placeholder="••••••••"
                 required
               />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                 <span className="text-xs font-bold">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="mt-2 h-11 bg-[#7A5AF8] text-white text-sm font-bold rounded-lg hover:bg-[#694de3] transition-all shadow-sm active:scale-[0.98]"
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
              className="h-11 border border-[#E8E9EC] rounded-lg text-[#374151] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F4F5F7] transition-all active:scale-[0.98]"
            >
               <Globe size={18} />
               Google
            </button>
          </form>

          <div className="mt-12 text-center md:text-left">
             <p className="text-sm text-[#6B7280] font-medium">
                ¿No tienes una cuenta? <Link to="/register" className="text-[#7A5AF8] font-bold hover:underline">Regístrate gratis</Link>
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
