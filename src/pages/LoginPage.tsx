import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError('Credenciales incorrectas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 font-sans relative overflow-hidden bg-[#7A5AF8]">
      
      {/* Restore Full Page Dynamic Gradient with New Brand Colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7A5AF8] via-[#6a4ae7] to-[#E91E63]" />
      
      {/* Decorative Orbs from Brand Identity */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#FF8A80]/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#7A5AF8]/30 blur-[120px] rounded-full" />

      <div className="w-full max-w-[1050px] min-h-[640px] bg-white rounded-2xl shadow-heavy flex overflow-hidden relative z-10 border border-white/10 animate-fade-up">
        
        {/* LEFT PANEL: Brand Story & Impact */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#7A5AF8] to-[#E91E63] p-16 flex-col justify-center text-white relative overflow-hidden">
           <div className="absolute -bottom-10 -left-10 w-64 h-24 bg-white/10 rounded-xl rotate-45" />
           
           <div className="relative z-10">
              <h1 className="text-6xl font-extrabold mb-8 leading-tight tracking-tighter">
                Diseña el <br/> futuro hoy.
              </h1>
              <p className="text-lg opacity-90 font-medium max-w-sm leading-relaxed">
                Gestiona tus proyectos con la identidad visual más avanzada y un flujo de trabajo optimizado para el alto rendimiento.
              </p>
           </div>

           <div className="mt-auto relative z-10">
              <div className="w-16 h-1.5 bg-white/30 rounded-full mb-6" />
              <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Identity System v7.5</div>
           </div>
        </div>

        {/* RIGHT PANEL: Pure White Access Form */}
        <div className="flex-[1.2] p-14 md:p-24 bg-white flex flex-col justify-center">
          <div className="mb-14">
             <h2 className="text-[#7A5AF8] font-black uppercase tracking-[0.4em] text-sm mb-4">Acceso al Portal</h2>
             <div className="h-1.5 w-16 bg-gradient-to-r from-[#7A5AF8] to-[#E91E63] rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7 w-full max-w-[380px]">
            <div className="flex flex-col gap-2.5">
               <label className="text-xs font-black text-[#806F9B] uppercase tracking-wider ml-1">Email Corporativo</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full h-12 bg-[#F3E8FF] border-none rounded-md px-5 text-sm font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 transition-all placeholder:text-[#7A5AF8]/30"
                 placeholder="nombre@empresa.com"
                 required
               />
            </div>

            <div className="flex flex-col gap-2.5">
               <label className="text-xs font-black text-[#806F9B] uppercase tracking-wider ml-1">Contraseña de Seguridad</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full h-12 bg-[#F3E8FF] border-none rounded-md px-5 text-sm font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-[#7A5AF8]/20 transition-all placeholder:text-[#7A5AF8]/30"
                 placeholder="••••••••"
                 required
               />
            </div>

            {error && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center py-2 bg-red-50 rounded-md">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="mt-4 h-14 bg-[#7A5AF8] text-white hover:shadow-lg hover:brightness-105"
            >
              Entrar al Dashboard
            </Button>

            <div className="flex items-center gap-5 py-2">
               <div className="h-px flex-1 bg-zinc-100" />
               <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">o</span>
               <div className="h-px flex-1 bg-zinc-100" />
            </div>

            <Button variant="outlined" className="h-12 border-zinc-200 text-zinc-500 hover:border-[#7A5AF8] hover:text-[#7A5AF8]">
               Continuar con Google
            </Button>
          </form>

          <div className="mt-20 text-center opacity-20">
             <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.6em]">Inteligencia Operativa — 2026</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
