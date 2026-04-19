import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Info } from 'lucide-react';

const NotificationToggle: React.FC<{ label: string, description?: string, checked: boolean, onChange: () => void }> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-zinc-100 last:border-0">
    <div className="pr-4">
      <p className="font-bold text-zinc-900">{label}</p>
      {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-[#6C5DD3]' : 'bg-zinc-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    dailySummary: true,
    taskAssigned: true,
    mentions: true,
    dueDate: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-10">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-zinc-900">Notificaciones</h2>
        <p className="text-zinc-500 mt-1">Elige qué avisos quieres recibir y dónde.</p>
      </div>

      <div className="bg-[#E9EFFF] border border-[#D0DFFF] rounded-xl p-4 flex gap-3 text-[#3E5C9A]">
        <Info size={20} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium">
          Las notificaciones push están actualmente sincronizadas con las preferencias de tu navegador.
        </p>
      </div>

      {/* Email Notifications */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Mail size={20} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Correo Electrónico</h3>
        </div>

        <div className="space-y-1">
          <NotificationToggle
            label="Resumen diario de actividad"
            description="Recibe un email cada mañana con lo más importante de tus tableros."
            checked={settings.dailySummary}
            onChange={() => toggle('dailySummary')}
          />
          <NotificationToggle
            label="Cuando me asignan una tarea"
            description="Avisarme instantáneamente si alguien me añade a una tarjeta."
            checked={settings.taskAssigned}
            onChange={() => toggle('taskAssigned')}
          />
        </div>
      </section>

      {/* In-App Notifications */}
      <section className="bg-white rounded-2xl border border-zinc-200 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#6C5DD3] flex items-center justify-center">
            <Smartphone size={20} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Notificaciones en la App</h3>
        </div>

        <div className="space-y-1">
          <NotificationToggle
            label="Menciones en comentarios (@)"
            description="Alertas cuando alguien te menciona directamente."
            checked={settings.mentions}
            onChange={() => toggle('mentions')}
          />
          <NotificationToggle
            label="Alertas de fecha de vencimiento"
            description="Recordatorios visuales cuando una tarea está por expirar."
            checked={settings.dueDate}
            onChange={() => toggle('dueDate')}
          />
        </div>
      </section>
    </div>
  );
};

export default NotificationSettings;
