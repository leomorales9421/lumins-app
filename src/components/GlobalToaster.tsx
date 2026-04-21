import { Toaster } from 'sonner';

export function GlobalToaster() {
  return (
    <Toaster 
      position="bottom-right"
      toastOptions={{
        // Desactivamos el estilo por defecto para usar Tailwind puro
        unstyled: true,
        classNames: {
          toast: "w-full flex items-center gap-3 p-4 rounded border shadow-lg transition-all",
          // Modo Claro: Fondo blanco, borde suave, texto oscuro
          // Modo Oscuro: Superficie elevada (#1C1F26), borde sutil, texto claro
          default: "bg-white border-zinc-200 text-zinc-900 dark:bg-[#1C1F26] dark:border-white/10 dark:text-zinc-100",
          // Variantes de estado (Sobrescriben el default si es success/error/info)
          success: "bg-white border-emerald-200 text-emerald-800 dark:bg-[#1C1F26] dark:border-emerald-500/30 dark:text-emerald-400",
          error: "bg-white border-rose-200 text-rose-800 dark:bg-[#1C1F26] dark:border-rose-500/30 dark:text-rose-400",
          info: "bg-white border-blue-200 text-blue-800 dark:bg-[#1C1F26] dark:border-blue-500/30 dark:text-blue-400",
          // Estilos para el título y la descripción
          title: "font-bold text-sm",
          description: "text-sm opacity-80",
          // Botón de acción dentro del toast
          actionButton: "bg-[#6C5DD3] text-white rounded px-3 py-1.5 text-xs font-semibold hover:bg-[#5b4eb3] transition-colors",
          cancelButton: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300 rounded px-3 py-1.5 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors",
        },
      }}
    />
  );
}
