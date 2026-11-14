export interface BoardBackgroundPreset {
  id: string;
  value: string;
  name: string;
}

interface PicsumApiImage {
  id: string;
  author?: string;
}

export interface BoardBackgroundImage {
  id: string;
  author: string;
  thumbUrl: string;
  fullUrl: string;
}

interface BoardBackgroundCachePayload {
  timestamp: number;
  images: PicsumApiImage[];
}

export const BOARD_BACKGROUND_PRESETS: BoardBackgroundPreset[] = [
  { id: 'default', value: 'bg-[#F4F6F9]', name: 'Por defecto' },
  { id: 'ocean', value: 'bg-gradient-to-br from-cyan-500 to-blue-600', name: 'Oceano' },
  { id: 'sunset', value: 'bg-gradient-to-br from-orange-400 to-rose-500', name: 'Atardecer' },
  { id: 'forest', value: 'bg-gradient-to-br from-emerald-400 to-teal-600', name: 'Bosque' },
  { id: 'amethyst', value: 'bg-gradient-to-br from-fuchsia-500 to-indigo-600', name: 'Amatista' },
  { id: 'midnight', value: 'bg-gradient-to-br from-slate-800 to-zinc-900', name: 'Medianoche' },
  { id: 'candy', value: 'bg-gradient-to-br from-rose-400 to-pink-600', name: 'Gominola' },
  { id: 'morning', value: 'bg-gradient-to-br from-yellow-200 to-orange-400', name: 'Manana' },
  { id: 'deep-sea', value: 'bg-gradient-to-br from-blue-600 to-indigo-900', name: 'Mar Profundo' },
  { id: 'cyberpunk', value: 'bg-gradient-to-br from-indigo-500 to-fuchsia-600', name: 'Cyberpunk' },
  { id: 'mint', value: 'bg-gradient-to-br from-emerald-300 to-cyan-500', name: 'Menta' },
  { id: 'peach', value: 'bg-gradient-to-br from-orange-300 to-rose-400', name: 'Melocoton' },
  { id: 'autumn', value: 'bg-gradient-to-br from-amber-500 to-orange-700', name: 'Otono' },
  { id: 'spring', value: 'bg-gradient-to-br from-lime-400 to-emerald-500', name: 'Primavera' },
  { id: 'galaxy', value: 'bg-gradient-to-br from-indigo-500 to-indigo-800', name: 'Galaxia' },
  { id: 'mars', value: 'bg-gradient-to-br from-red-500 to-rose-800', name: 'Marte' },
  { id: 'silver', value: 'bg-gradient-to-br from-slate-300 to-slate-500', name: 'Plata' },
  { id: 'lavender', value: 'bg-gradient-to-br from-indigo-200 to-indigo-400', name: 'Lavanda' },
];

export const DEFAULT_BOARD_BACKGROUND = BOARD_BACKGROUND_PRESETS[0].value;

export const UNSPLASH_CURATED_WALLPAPERS: BoardBackgroundImage[] = [
  {
    id: 'aurora',
    author: 'Jonatan Pie',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80&auto=format',
  },
  {
    id: 'mountains-lake',
    author: 'Bailey Zindel',
    thumbUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80&auto=format',
  },
  {
    id: 'deep-ocean',
    author: 'Matt Hardy',
    thumbUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80&auto=format',
  },
  {
    id: 'cyberpunk-city',
    author: 'Aleksandar Pasaric',
    thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&q=80&auto=format',
  },
  {
    id: 'sunset-coast',
    author: 'Sean Oulashin',
    thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&auto=format',
  },
  {
    id: 'misty-forest',
    author: 'Sebastian Unrau',
    thumbUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80&auto=format',
  },
  {
    id: 'desert-dunes',
    author: 'Jeremy Bishop',
    thumbUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1920&q=80&auto=format',
  },
  {
    id: 'starry-galaxy',
    author: 'Vincentiu Solomon',
    thumbUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1920&q=80&auto=format',
  },
  {
    id: 'abstract-waves',
    author: 'Milad Fakurian',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80&auto=format',
  },
  {
    id: 'snowy-peaks',
    author: 'Kaley Dykstra',
    thumbUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80&auto=format',
  },
  {
    id: 'calming-lake',
    author: 'Luca Bravo',
    thumbUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80&auto=format',
  },
  {
    id: 'golden-valley',
    author: 'David Marcu',
    thumbUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=70&auto=format',
    fullUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80&auto=format',
  },
];

export const normalizeBoardBackground = (input?: string | null): string | null => {
  if (typeof input !== 'string') return null;
  const normalized = input.trim();
  return normalized.length > 0 ? normalized : null;
};

export const isRemoteImageBackground = (input?: string | null): boolean => {
  const normalized = normalizeBoardBackground(input);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isPresetBackground = (input?: string | null): boolean => {
  const normalized = normalizeBoardBackground(input);
  if (!normalized) return false;
  const baseValue = normalized.split('?')[0];
  return BOARD_BACKGROUND_PRESETS.some((preset) => preset.value === baseValue);
};

export const parseBackgroundConfig = (input: string) => {
  const [base, query] = input.split('?');
  const params = new URLSearchParams(query || '');
  return {
    base,
    tone: 'dark' as const, // Always use dark tone as requested
    lava: params.get('lava') !== 'false' // default to true
  };
};

export const isValidBoardBackground = (input?: string | null): boolean => {
  const normalized = normalizeBoardBackground(input);
  if (!normalized) return true;
  return isPresetBackground(normalized) || isRemoteImageBackground(normalized);
};

export type ResolvedBoardBackground =
  | { kind: 'none'; value: null }
  | { kind: 'preset'; value: string; tone: 'light' | 'dark'; lava: boolean; rawValue: string }
  | { kind: 'image'; value: string };

export const resolveBoardBackground = (input?: string | null): ResolvedBoardBackground => {
  const normalized = normalizeBoardBackground(input);

  if (!normalized) return { kind: 'none', value: null };
  if (isRemoteImageBackground(normalized)) {
    // If it's a legacy or failing Picsum URL, transparently map to a fast, reliable Unsplash wallpaper
    if (normalized.includes('picsum.photos')) {
      const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const mappedWallpaper = UNSPLASH_CURATED_WALLPAPERS[hash % UNSPLASH_CURATED_WALLPAPERS.length].fullUrl;
      return { kind: 'image', value: mappedWallpaper };
    }
    return { kind: 'image', value: normalized };
  }
  if (isPresetBackground(normalized)) {
    const config = parseBackgroundConfig(normalized);
    return { kind: 'preset', value: config.base, tone: config.tone, lava: config.lava, rawValue: normalized };
  }

  // Defensive fallback: unknown values degrade to default preset.
  return { kind: 'preset', value: DEFAULT_BOARD_BACKGROUND, tone: 'dark', lava: true, rawValue: DEFAULT_BOARD_BACKGROUND };
};

export const fetchBoardBackgroundGallery = async (_signal?: AbortSignal): Promise<BoardBackgroundImage[]> => {
  return UNSPLASH_CURATED_WALLPAPERS;
};

export const preloadImageUrl = (url: string, timeoutMs = 3000): Promise<boolean> => {
  if (!isRemoteImageBackground(url)) return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        img.src = '';
        resolve(false);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    img.src = url;
  });
};

export const emitBoardBackgroundChange = (background?: string | null): void => {
  if (typeof window === 'undefined') return;

  const normalized = normalizeBoardBackground(background);
  window.dispatchEvent(
    new CustomEvent('set-board-background', {
      detail: { background: normalized },
    })
  );
};
