import { Toaster } from 'sonner';
import {
  LuminsSuccessIcon,
  LuminsErrorIcon,
  LuminsInfoIcon,
  LuminsWarningIcon,
} from './icons/LuminsIcons';

export function GlobalToaster() {
  return (
    <Toaster 
      position="bottom-center"
      gap={8}
      icons={{
        success: <LuminsSuccessIcon size={18} />,
        error: <LuminsErrorIcon size={18} />,
        info: <LuminsInfoIcon size={18} />,
        warning: <LuminsWarningIcon size={18} />,
      }}
      toastOptions={{
        unstyled: true,
        duration: 3500,
        classNames: {
          toast: "group w-auto min-w-[280px] max-w-[440px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-[0_10px_28px_rgba(15,23,42,0.10)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 active:scale-[0.98] animate-in slide-in-from-bottom-4",
          default: "bg-white/95 border-slate-200/90 text-slate-900 dark:bg-[#1C1F26]/95 dark:border-white/10 dark:text-zinc-100",
          success: "bg-white/95 border-[var(--lumins-accent-border)] text-slate-900 dark:bg-[#1C1F26]/95 dark:text-zinc-100",
          error: "bg-white/95 border-[#FF665E]/30 text-slate-900 dark:bg-[#1C1F26]/95 dark:border-[#FF665E]/35 dark:text-zinc-100",
          info: "bg-white/95 border-[var(--lumins-accent-border)] text-slate-900 dark:bg-[#1C1F26]/95 dark:text-zinc-100",
          warning: "bg-white/95 border-[#FFCC40]/45 text-slate-900 dark:bg-[#1C1F26]/95 dark:border-[#FFCC40]/35 dark:text-zinc-100",
          title: "text-[12.5px] font-bold tracking-tight leading-tight",
          description: "text-[11.5px] opacity-75 leading-relaxed font-medium mt-0.5",
          actionButton: "bg-transparent hover:bg-transparent text-[var(--lumins-accent-fg)] hover:opacity-80 font-bold text-xs underline underline-offset-4 transition-opacity cursor-pointer shrink-0 ml-auto border-0 shadow-none p-0 inline-flex items-center",
          cancelButton: "bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 font-bold text-xs transition-colors cursor-pointer shrink-0 ml-2 border-0 shadow-none p-0",
        },
      }}
    />
  );
}
