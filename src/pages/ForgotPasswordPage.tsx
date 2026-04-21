import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import apiClient from '../lib/api-client';

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
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-zinc-100 p-8 animate-in fade-in zoom-in duration-300">
        
        {isSuccess ? (
          <div className="text-center py-4">
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
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
