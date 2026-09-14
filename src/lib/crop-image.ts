import type { SupabaseClient } from '@supabase/supabase-js';

export const CROP_IMAGES_BUCKET = 'crop-images';

type StorageClient = Pick<SupabaseClient, 'storage'>;

/**
 * Durable assessments.image_url values are storage object paths
 * (`{userId}/{timestamp}-{filename}`), not time-limited signed URLs.
 * Legacy rows may still hold signed/public URLs; extract the path when possible.
 */
export function cropImageStoragePath(
  imageUrlOrPath: string | null | undefined
): string | null {
  if (!imageUrlOrPath) return null;
  const value = imageUrlOrPath.trim();
  if (!value) return null;

  if (!value.includes('://')) {
    return value.replace(new RegExp(`^${CROP_IMAGES_BUCKET}/`), '');
  }

  // External demo assets (e.g. Unsplash) are not in our bucket.
  if (!value.includes(`/${CROP_IMAGES_BUCKET}/`)) {
    return null;
  }

  const markers = [
    `/object/sign/${CROP_IMAGES_BUCKET}/`,
    `/object/public/${CROP_IMAGES_BUCKET}/`,
    `/object/authenticated/${CROP_IMAGES_BUCKET}/`,
  ];

  for (const marker of markers) {
    const idx = value.indexOf(marker);
    if (idx >= 0) {
      const rest = value.slice(idx + marker.length);
      const path = decodeURIComponent((rest.split('?')[0] ?? '').trim());
      return path || null;
    }
  }

  return null;
}

/** Mint a short-lived signed URL for AI invoke or browser display. */
export async function resolveCropImageUrl(
  client: StorageClient,
  imageUrlOrPath: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!imageUrlOrPath) return null;

  const path = cropImageStoragePath(imageUrlOrPath);
  if (!path) {
    return imageUrlOrPath.includes('://') ? imageUrlOrPath : null;
  }

  const { data, error } = await client.storage
    .from(CROP_IMAGES_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.error('Failed to sign crop image URL', error);
    return null;
  }

  return data.signedUrl;
}

/** Resolve image_url on each row for display; keeps other fields intact. */
export async function resolveCropImageUrls<T extends { image_url: string }>(
  client: StorageClient,
  rows: T[],
  expiresIn = 3600
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => {
      const signed = await resolveCropImageUrl(client, row.image_url, expiresIn);
      return signed ? { ...row, image_url: signed } : row;
    })
  );
}
