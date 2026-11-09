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
    const ext = compressionOptions.fileType?.includes('jpeg') || compressionOptions.fileType?.includes('jpg') ? '.jpg' : '.webp';
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'captura';
    const fileName = `${baseName}${ext}`;
    return new File([compressedBlob], fileName, {
      type: compressionOptions.fileType || 'image/webp',
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

/**
 * Comprime y minimiza una imagen para tickets de soporte (capturas de pantalla y fotos).
 * Garantiza texto legible en capturas mientras reduce el peso drásticamente para correo y DB.
 */
export const compressSupportAttachment = async (file: File): Promise<File> => {
  return compressImage(file, {
    maxSizeMB: 0.8, // 800 KB max
    maxWidthOrHeight: 1600,
    fileType: 'image/jpeg',
    useWebWorker: true,
  });
};
