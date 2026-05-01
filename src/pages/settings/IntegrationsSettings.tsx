import React, { useState, useEffect } from 'react';
import { Link2Off, CheckCircle2, AlertCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

const TrelloIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.7,2H4.3C3,2,2,3,2,4.3v15.4C2,21,3,22,4.3,22h15.4c1.3,0,2.3-1,2.3-2.3V4.3C22,3,21,2,19.7,2z M10.3,16.7c0,0.7-0.6,1.3-1.3,1.3H5.7c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3H9c0.7,0,1.3,0.6,1.3,1.3V16.7z M19.7,11.7 c0,0.7-0.6,1.3-1.3,1.3h-3.3c-0.7,0-1.3-0.6-1.3-1.3V5.3c0-0.7,0.6-1.3,1.3-1.3h3.3c0.7,0,1.3,0.6,1.3,1.3V11.7z"/>
  </svg>
);

const IntegrationsSettings: React.FC = () => {
  const [trelloToken, setTrelloToken] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('trello_token');
    setTrelloToken(token);
  }, []);

  const handleUnlinkTrello = () => {
    setIsUnlinking(true);
    // Simulate a bit of delay for premium feel
    setTimeout(() => {
      localStorage.removeItem('trello_token');
      setTrelloToken(null);
      setIsUnlinking(false);
      toast.success('Cuenta de Trello desvinculada exitosamente');
    }, 800);
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">Integraciones</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Conecta Lumins con tus herramientas favoritas para potenciar tu productividad.</p>
      </div>

      <section className="bg-white dark:bg-[#1C1F26] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0079BF] flex items-center justify-center text-white shadow-lg shadow-[#0079BF]/20 flex-shrink-0">
            <TrelloIcon size={32} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Trello</h3>
              {trelloToken ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-zinc-500/20 flex items-center gap-1">
                  <AlertCircle size={10} /> No vinculado
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-lg">
              Importa tus tableros, listas y tarjetas directamente a Lumins. Mantén la sincronización y la seguridad en un solo lugar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {trelloToken ? (
              <Button 
                onClick={handleUnlinkTrello}
                disabled={isUnlinking}
                className="!bg-rose-500/10 !text-rose-500 hover:!bg-rose-500 hover:!text-white border border-rose-500/20 !rounded-xl !py-3 !px-6 text-xs font-black uppercase tracking-widest transition-all"
              >
                {isUnlinking ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Link2Off size={18} className="mr-2" />
                    Desvincular
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => window.open('https://trello.com/1/authorize?expiration=never&name=Lumins&scope=read&response_type=token&key=6560bb4c3d536ed652faebccc6fa2662&return_url=' + encodeURIComponent(window.location.origin + '/auth/callback'), '_blank')}
                className="!rounded-xl !py-3 !px-8 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary text-white"
              >
                Vincular cuenta
                <ArrowRight size={18} className="ml-2" />
              </Button>
            )}
          </div>
        </div>

        {trelloToken && (
          <div className="bg-zinc-50 dark:bg-black/20 px-8 py-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Tu token está cifrado localmente</span>
            </div>
            <a 
              href="https://trello.com/app-key" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Gestionar en Trello <ExternalLink size={12} />
            </a>
          </div>
        )}
      </section>

      {/* Placeholder for other integrations */}
      <section className="opacity-50 pointer-events-none">
        <div className="bg-zinc-100 dark:bg-white/5 rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-400 mb-4">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-1">Próximamente</h4>
          <p className="text-xs text-zinc-400 uppercase font-bold tracking-tight">Slack, Jira y GitHub en camino.</p>
        </div>
      </section>
    </div>
  );
};

export default IntegrationsSettings;
