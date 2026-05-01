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

const GALLERY_CACHE_KEY = 'lumins_board_bg_gallery_v2';
const GALLERY_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const GALLERY_FALLBACK_IDS = ['1011', '1025', '1035', '1043', '1050', '1069', '1074', '1084', '1080', '1081', '1082', '1083'];
const GALLERY_ENDPOINT = 'https://picsum.photos/v2/list?page=3&limit=12';

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
  return BOARD_BACKGROUND_PRESETS.some((preset) => preset.value === normalized);
};

export const isValidBoardBackground = (input?: string | null): boolean => {
  const normalized = normalizeBoardBackground(input);
  if (!normalized) return true;
  return isPresetBackground(normalized) || isRemoteImageBackground(normalized);
};

export type ResolvedBoardBackground =
  | { kind: 'none'; value: null }
  | { kind: 'preset'; value: string }
  | { kind: 'image'; value: string };

export const resolveBoardBackground = (input?: string | null): ResolvedBoardBackground => {
  const normalized = normalizeBoardBackground(input);

  if (!normalized) return { kind: 'none', value: null };
  if (isRemoteImageBackground(normalized)) return { kind: 'image', value: normalized };
  if (isPresetBackground(normalized)) return { kind: 'preset', value: normalized };

  // Defensive fallback: unknown values degrade to default preset.
  return { kind: 'preset', value: DEFAULT_BOARD_BACKGROUND };
};

const mapPicsumImage = (img: PicsumApiImage): BoardBackgroundImage => ({
  id: String(img.id),
  author: img.author || 'Picsum',
  thumbUrl: `https://picsum.photos/id/${img.id}/400/250`,
  fullUrl: `https://picsum.photos/id/${img.id}/1920/1080`,
});

const sanitizeImageList = (images: unknown): PicsumApiImage[] => {
  if (!Array.isArray(images)) return [];

  return images.reduce<PicsumApiImage[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc;

    const candidate = item as Partial<PicsumApiImage>;
    if (!candidate.id) return acc;

    const mapped: PicsumApiImage = { id: String(candidate.id) };
    if (typeof candidate.author === 'string') {
      mapped.author = candidate.author;
    }

    acc.push(mapped);
    return acc;
  }, []);
};

const readGalleryCache = (): PicsumApiImage[] | null => {
  try {
    const raw = sessionStorage.getItem(GALLERY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BoardBackgroundCachePayload>;

    if (typeof parsed.timestamp !== 'number') return null;
    if (Date.now() - parsed.timestamp > GALLERY_CACHE_TTL_MS) return null;

    const images = sanitizeImageList(parsed.images);
    return images.length > 0 ? images : null;
  } catch {
    return null;
  }
};

const writeGalleryCache = (images: PicsumApiImage[]) => {
  try {
    const payload: BoardBackgroundCachePayload = {
      timestamp: Date.now(),
      images,
    };
    sessionStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write failures.
  }
};

const fallbackGallery = (): BoardBackgroundImage[] => {
  return GALLERY_FALLBACK_IDS.map((id) => mapPicsumImage({ id }));
};

export const fetchBoardBackgroundGallery = async (signal?: AbortSignal): Promise<BoardBackgroundImage[]> => {
  const cached = readGalleryCache();
  if (cached) return cached.map(mapPicsumImage);

  try {
    const response = await fetch(GALLERY_ENDPOINT, { signal });
    if (!response.ok) {
      throw new Error(`Gallery request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const images = sanitizeImageList(payload);

    if (images.length === 0) {
      throw new Error('Gallery payload is empty');
    }

    writeGalleryCache(images);
    return images.map(mapPicsumImage);
  } catch {
    return fallbackGallery();
  }
};

export const preloadImageUrl = (url: string): Promise<boolean> => {
  if (!isRemoteImageBackground(url)) return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
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
