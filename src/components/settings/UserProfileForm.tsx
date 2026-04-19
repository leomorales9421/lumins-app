import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';

const LATAM_COUNTRIES = [
  { name: 'Argentina', code: 'AR', prefix: '+54' },
  { name: 'Bolivia', code: 'BO', prefix: '+591' },
  { name: 'Brasil', code: 'BR', prefix: '+55' },
  { name: 'Chile', code: 'CL', prefix: '+56' },
  { name: 'Colombia', code: 'CO', prefix: '+57' },
  { name: 'Costa Rica', code: 'CR', prefix: '+506' },
  { name: 'Cuba', code: 'CU', prefix: '+53' },
  { name: 'Ecuador', code: 'EC', prefix: '+593' },
  { name: 'El Salvador', code: 'SV', prefix: '+503' },
  { name: 'Guatemala', code: 'GT', prefix: '+502' },
  { name: 'Honduras', code: 'HN', prefix: '+504' },
  { name: 'México', code: 'MX', prefix: '+52' },
  { name: 'Nicaragua', code: 'NI', prefix: '+505' },
  { name: 'Panamá', code: 'PA', prefix: '+507' },
  { name: 'Paraguay', code: 'PY', prefix: '+595' },
  { name: 'Perú', code: 'PE', prefix: '+51' },
  { name: 'Puerto Rico', code: 'PR', prefix: '+1' },
  { name: 'República Dominicana', code: 'DO', prefix: '+1' },
  { name: 'Uruguay', code: 'UY', prefix: '+598' },
  { name: 'Venezuela', code: 'VE', prefix: '+58' },
];

const UserProfileForm: React.FC = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    avatarUrl: user?.avatarUrl || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  // IP Detection for country/prefix
  useEffect(() => {
    if (!formData.country) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const detectedCountry = LATAM_COUNTRIES.find(c => c.code === data.country_code);
          if (detectedCountry) {
            setFormData(prev => ({ 
              ...prev, 
              country: detectedCountry.name,
              phone: prev.phone || detectedCountry.prefix 
            }));
          }
        })
        .catch(err => console.error('IP detection failed', err));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If country changed, update prefix if phone is empty or just a prefix
    if (name === 'country') {
      const country = LATAM_COUNTRIES.find(c => c.name === value);
      if (country && (!formData.phone || formData.phone.startsWith('+'))) {
        setFormData(prev => ({ ...prev, phone: country.prefix }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.patch('/api/auth/me', formData);
      if (setUser) {
        setUser(response.data.data.user);
      }
      // Show success toast?
    } catch (err) {
      console.error('Update profile failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <div className="p-8">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Información del Perfil</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[#F4F6F9] border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-zinc-400" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                <input type="file" className="hidden" accept="image/*" />
                <span className="text-xs font-bold">Cambiar</span>
              </label>
            </div>
            <div>
              <p className="font-bold text-zinc-900">Tu Avatar</p>
              <p className="text-sm text-zinc-500">JPG, GIF o PNG. Máximo 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Nombre Completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full p-3 rounded-lg border border-zinc-200 bg-slate-50 text-zinc-500 cursor-not-allowed outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">País / Región</label>
              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="">Seleccionar país...</option>
                  {LATAM_COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Teléfono</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-[#6C5DD3] focus:border-transparent outline-none transition-all"
                placeholder="+54 9 11 ..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileForm;
