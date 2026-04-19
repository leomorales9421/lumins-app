import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/layout/NavBar';
import { Layout, CheckSquare, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const AppPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F1F3] flex flex-col font-sans">
      <NavBar user={user} logout={logout} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:p-6 lg:p-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">
            ¡Hola, {user?.name || 'Usuario'}! 👋
          </h1>
          <p className="text-[#6B7280] font-medium">Aquí tienes un resumen de lo que está pasando en tus proyectos.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-[#E8E9EC] shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F4F5F7] text-[#7A5AF8] rounded-xl flex items-center justify-center">
              <Layout size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1A1A2E]">12</div>
              <div className="text-xs font-bold text-[#9CA3AF] uppercase">Tableros Activos</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#E8E9EC] shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F4F5F7] text-green-600 rounded-xl flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1A1A2E]">48</div>
              <div className="text-xs font-bold text-[#9CA3AF] uppercase">Tareas Completadas</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#E8E9EC] shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F4F5F7] text-blue-600 rounded-xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1A1A2E]">5</div>
              <div className="text-xs font-bold text-[#9CA3AF] uppercase">Entregas Próximas</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1A1A2E] text-white p-10 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7A5AF8]/20 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">Gestiona tus proyectos</h3>
              <p className="text-slate-400 mb-8 max-w-sm">Accede a tus tableros de Kanban y organiza tus tareas con el equipo en tiempo real.</p>
              <Button 
                onClick={() => navigate('/app')}
                className="bg-[#7A5AF8] text-white border-none"
                rightIcon={<ArrowRight size={18} />}
              >
                Ir a Tableros
              </Button>
            </div>
          </div>

          <div className="bg-white p-10 rounded-2xl border border-[#E8E9EC] shadow-soft flex flex-col justify-center">
            <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">¿Necesitas ayuda?</h3>
            <p className="text-[#6B7280] mb-6">Explora nuestra documentación para aprender a usar todas las herramientas de Luminous.</p>
            <button className="flex items-center gap-2 text-[#7A5AF8] font-bold text-sm hover:underline">
              Ver tutoriales <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 border-t border-[#E8E9EC] text-center">
        <p className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-widest">
          Luminous • Inteligencia Operativa • 2026
        </p>
      </footer>
    </div>
  );
};

export default AppPage;
