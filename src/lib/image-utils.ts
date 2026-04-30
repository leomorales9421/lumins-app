import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

/**
 * Comprime una imagen para avatares u otros usos.
 * Por defecto optimiza para avatares (pequeños y ligeros).
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const defaultOptions = {
    maxSizeMB: 0.1, // 100KB por defecto para avatares
    maxWidthOrHeight: 400, // 400px suficiente para avatares
    useWebWorker: true,
    fileType: 'image/webp', // Convertir a WebP por defecto
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    const compressedBlob = await imageCompression(file, compressionOptions);
    
    // El blob retornado no siempre tiene el nombre original, lo reconstruimos como File
    const fileName = file.name.split('.')[0] + '.webp';
    return new File([compressedBlob], fileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    return file; // Si falla, devolvemos el original
  }
};

/**
 * Comprime una imagen para adjuntos generales (más calidad que un avatar).
 */
export const compressAttachment = async (file: File): Promise<File> => {
  return compressImage(file, {
    maxSizeMB: 1, // 1MB para adjuntos
    maxWidthOrHeight: 1920, // Full HD max
    fileType: 'image/webp',
  });
};
