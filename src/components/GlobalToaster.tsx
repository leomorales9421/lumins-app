import { Toaster } from 'sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function GlobalToaster() {
  return (
    <Toaster 
      position="bottom-center"
      icons={{
        success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        error: <AlertCircle className="w-5 h-5 text-rose-400" />,
        info: <Info className="w-5 h-5 text-[#8E82E3]" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      }}
      toastOptions={{
        unstyled: true,
        duration: 4000,
        classNames: {
          toast: "group w-[400px] flex items-start gap-4 p-4 rounded-xl border shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-500 active:scale-[0.98] animate-in slide-in-from-bottom-5",
          // Modo Claro - Sólido
          default: "bg-white border-zinc-200 text-zinc-900",
          // Modo Oscuro - Sólido (Coincidiendo con el panel principal #1C1F26)
          success: "bg-white border-emerald-100 text-emerald-900 dark:bg-[#1C1F26] dark:border-emerald-500/20 dark:text-emerald-400",
          error: "bg-white border-rose-100 text-rose-900 dark:bg-[#1C1F26] dark:border-rose-500/20 dark:text-rose-400",
          info: "bg-white border-indigo-100 text-indigo-900 dark:bg-[#1C1F26] dark:border-[#6C5DD3]/30 dark:text-[#8E82E3]",
          // Estilos base de texto
          title: "text-[15px] font-bold tracking-tight leading-tight",
          description: "text-[13px] opacity-70 leading-relaxed font-medium mt-1",
          // Botones
          actionButton: "bg-[#6C5DD3] text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-[#5b4eb3] shadow-lg shadow-[#6C5DD3]/20 transition-all active:scale-95",
          cancelButton: "bg-zinc-100 text-zinc-700 dark:bg-white/5 dark:text-zinc-300 rounded-lg px-4 py-2 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-95",
        },
      }}
    />
  );
}
