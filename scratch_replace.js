const fs = require('fs');
let content = fs.readFileSync('src/pages/SystemAdminPage.tsx', 'utf-8');

const replacements = {
  'bg-\\[#09090B\\]': 'bg-cu-bg dark:bg-dark-bg',
  'text-zinc-100': 'text-cu-text dark:text-zinc-100',
  'bg-zinc-900/30': 'bg-cu-surface dark:bg-dark-surface shadow-sm',
  'border-white/5': 'border-cu-border dark:border-dark-border',
  'text-zinc-500': 'text-cu-muted dark:text-zinc-500',
  'text-zinc-400': 'text-slate-600 dark:text-zinc-400',
  'text-zinc-300': 'text-slate-700 dark:text-zinc-300',
  'bg-white/5': 'bg-slate-100 dark:bg-white/5',
  'bg-zinc-900/50': 'bg-cu-surface dark:bg-dark-surface shadow-sm',
  'border-white/10': 'border-cu-border dark:border-white/10',
  'bg-black/40': 'bg-slate-100 dark:bg-black/40',
  'bg-black/30': 'bg-slate-200 dark:bg-black/30',
  'bg-white/10': 'bg-slate-200 dark:bg-white/10',
  'hover:bg-white/20': 'hover:bg-slate-300 dark:hover:bg-white/20',
  'hover:bg-white/5': 'hover:bg-slate-50 dark:hover:bg-white/5',
  'hover:bg-white/\\\[0\\.02\\\]': 'hover:bg-slate-50 dark:hover:bg-white/[0.02]',
  'hover:border-white/10': 'hover:border-cu-border dark:hover:border-white/10',
  'bg-gradient-to-br from-zinc-700 to-zinc-900': 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-zinc-700 dark:to-zinc-900 text-slate-700 dark:text-white',
};

for (const [key, value] of Object.entries(replacements)) {
  const regex = new RegExp(key, 'g');
  content = content.replace(regex, value);
}

fs.writeFileSync('src/pages/SystemAdminPage.tsx', content);
console.log('Done!');
