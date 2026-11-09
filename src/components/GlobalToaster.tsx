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
          toast: "group w-auto min-w-[300px] max-w-[460px] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 active:scale-[0.98] animate-in slide-in-from-bottom-5",
          // Modo Claro - Sólido
          default: "bg-white border-zinc-200 text-zinc-900",
          // Modo Oscuro - Sólido (Coincidiendo con el panel principal #1C1F26)
          success: "bg-white border-emerald-100 text-zinc-900 dark:bg-[#1C1F26] dark:border-emerald-500/20 dark:text-zinc-100",
          error: "bg-white border-rose-100 text-zinc-900 dark:bg-[#1C1F26] dark:border-rose-500/20 dark:text-zinc-100",
          info: "bg-white border-indigo-100 text-zinc-900 dark:bg-[#1C1F26] dark:border-[#6C5DD3]/30 dark:text-zinc-100",
          // Estilos base de texto
          title: "text-[13px] font-bold tracking-tight leading-tight",
          description: "text-[12px] opacity-70 leading-relaxed font-medium mt-0.5",
          // Botones (Estilo ancla/enlace limpio, alineado y sin caja sólida)
          actionButton: "bg-transparent hover:bg-transparent text-[#6C5DD3] dark:text-[#A599F9] hover:text-[#5B4EB8] dark:hover:text-white font-bold text-xs underline underline-offset-4 transition-colors cursor-pointer shrink-0 ml-auto border-0 shadow-none p-0 inline-flex items-center",
          cancelButton: "bg-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold text-xs transition-colors cursor-pointer shrink-0 ml-2 border-0 shadow-none p-0",
        },
      }}
    />
  );
}
