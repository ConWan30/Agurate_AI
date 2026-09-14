import { describe, expect, it } from 'vitest';
import { cropImageStoragePath } from '@/lib/crop-image';

describe('cropImageStoragePath', () => {
  it('passes through durable storage paths', () => {
    expect(cropImageStoragePath('user-1/123-leaf.jpg')).toBe('user-1/123-leaf.jpg');
    expect(cropImageStoragePath('crop-images/user-1/123-leaf.jpg')).toBe(
      'user-1/123-leaf.jpg'
    );
  });

  it('extracts path from signed and public URLs', () => {
    const signed =
      'https://xyz.supabase.co/storage/v1/object/sign/crop-images/user-1/123-leaf.jpg?token=abc';
    const pub =
      'https://xyz.supabase.co/storage/v1/object/public/crop-images/user-1/123-leaf.jpg';

    expect(cropImageStoragePath(signed)).toBe('user-1/123-leaf.jpg');
    expect(cropImageStoragePath(pub)).toBe('user-1/123-leaf.jpg');
  });

  it('decodes URI-encoded path segments', () => {
    const encoded =
      'https://xyz.supabase.co/storage/v1/object/sign/crop-images/user-1/123-leaf%20scan.jpg?token=abc';
    expect(cropImageStoragePath(encoded)).toBe('user-1/123-leaf scan.jpg');
  });

  it('returns null for empty or external URLs', () => {
    expect(cropImageStoragePath(null)).toBeNull();
    expect(cropImageStoragePath('')).toBeNull();
    expect(
      cropImageStoragePath('https://images.unsplash.com/photo-123')
    ).toBeNull();
  });
});
