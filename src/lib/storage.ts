import { supabase } from './supabase';

const BUCKET = 'betas';

// La foto original se guarda a buena calidad (nunca se modifica).
const FULL_MAX_PX = 1600;
const FULL_QUALITY = 0.85;

// La miniatura es lo único que carga el listado.
const THUMB_MAX_PX = 480;
const THUMB_QUALITY = 0.7;

// Cache agresivo: los nombres son UUID, así que el archivo nunca cambia.
const CACHE_CONTROL = '31536000'; // 1 año

export interface UploadedPhoto {
  photoUrl: string;
  thumbnailUrl: string;
  photoPath: string;
  thumbPath: string;
}

const uuid = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/** Carga una imagen (File o URL) en un HTMLImageElement. */
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });

/** Redimensiona y comprime a Blob JPEG. Nunca produce Base64. */
const resizeToBlob = (img: HTMLImageElement, maxPx: number, quality: number): Promise<Blob> => {
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas no disponible'));
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))),
      'image/jpeg',
      quality
    );
  });
};

export interface PreparedPhoto {
  full: Blob;
  thumb: Blob;
  previewUrl: string; // object URL local, para el editor (no se sube)
}

/**
 * Prepara la foto recién tomada: versión completa + miniatura, ambas como
 * Blob. Se mantiene en memoria mientras el usuario dibuja; solo se sube
 * al publicar (así no quedan archivos huérfanos si abandona el flujo).
 */
export const preparePhoto = async (file: File): Promise<PreparedPhoto> => {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const [full, thumb] = await Promise.all([
      resizeToBlob(img, FULL_MAX_PX, FULL_QUALITY),
      resizeToBlob(img, THUMB_MAX_PX, THUMB_QUALITY)
    ]);
    // El editor dibuja sobre esta previsualización local (la original intacta)
    return { full, thumb, previewUrl: URL.createObjectURL(full) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

/** Sube foto + miniatura al bucket. Devuelve las URLs públicas (CDN). */
export const uploadPhoto = async (photo: { full: Blob; thumb: Blob }): Promise<UploadedPhoto> => {
  const id = uuid();
  const photoPath = `${id}.jpg`;
  const thumbPath = `thumbs/${id}.jpg`;

  const opts = { cacheControl: CACHE_CONTROL, contentType: 'image/jpeg', upsert: false };

  const [fullRes, thumbRes] = await Promise.all([
    supabase.storage.from(BUCKET).upload(photoPath, photo.full, opts),
    supabase.storage.from(BUCKET).upload(thumbPath, photo.thumb, opts)
  ]);

  const failure = fullRes.error || thumbRes.error;
  if (failure) {
    if (failure.message.toLowerCase().includes('bucket not found')) {
      throw new Error('Falta crear el bucket de fotos: corre la migración 006 en Supabase.');
    }
    throw new Error(`No se pudo subir la foto: ${failure.message}`);
  }

  return {
    photoPath,
    thumbPath,
    photoUrl: supabase.storage.from(BUCKET).getPublicUrl(photoPath).data.publicUrl,
    thumbnailUrl: supabase.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl
  };
};

/** Borra los archivos de una beta (al eliminarla). Nunca lanza. */
export const deletePhotoFiles = async (photoUrl: string | null, thumbnailUrl: string | null): Promise<void> => {
  const paths = [photoUrl, thumbnailUrl]
    .map((url) => extractPath(url))
    .filter((p): p is string => p !== null);
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths).catch(() => undefined);
};

/** De una URL pública del bucket saca la ruta interna del archivo. */
export const extractPath = (url: string | null): string | null => {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
};

/** Convierte un dataURL Base64 (formato viejo) en Blob, para migrarlo. */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return res.blob();
};

/** Genera foto + miniatura a partir de un Base64 antiguo. */
export const prepareFromDataUrl = async (dataUrl: string): Promise<{ full: Blob; thumb: Blob }> => {
  const img = await loadImage(dataUrl);
  const [full, thumb] = await Promise.all([
    resizeToBlob(img, FULL_MAX_PX, FULL_QUALITY),
    resizeToBlob(img, THUMB_MAX_PX, THUMB_QUALITY)
  ]);
  return { full, thumb };
};
