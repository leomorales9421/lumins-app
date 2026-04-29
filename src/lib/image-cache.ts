/**
 * Image Cache Utility
 * Provides a robust way to persist images (avatars) in the browser's Cache Storage API.
 * This ensures that even if the browser clears the standard memory/disk cache,
 * our critical assets like avatars remain available and load instantly.
 */

const CACHE_NAME = 'lumins-avatar-cache-v1';

/**
 * Gets an image from the cache or fetches and stores it if not present.
 * Returns a Blob URL that can be used as an <img> src.
 */
export async function getCachedImage(url: string): Promise<string> {
  if (!url) return '';
  
  // If it's already a data URL or a blob URL, return as is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    let response = await cache.match(url);

    if (!response) {
      // Not in cache, fetch it
      response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit' // Google Drive public links don't need credentials
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Store in cache
      await cache.put(url, response.clone());
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn(`Persistent cache failed for ${url}, falling back to direct URL:`, error);
    return url;
  }
}

/**
 * Invalidates a specific image URL from the cache.
 */
export async function invalidateImage(url: string): Promise<void> {
  if (!url) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);
  } catch (error) {
    console.error(`Failed to invalidate cache for ${url}:`, error);
  }
}

/**
 * Clears the entire avatar cache.
 */
export async function clearAvatarCache(): Promise<void> {
  try {
    await caches.delete(CACHE_NAME);
  } catch (error) {
    console.error('Failed to clear avatar cache:', error);
  }
}
