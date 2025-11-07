/**
 * Image Optimization Utility
 * Compresses images before upload to reduce bandwidth and improve performance
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeMB: 2,
};

/**
 * Compresses an image file using browser Canvas API
 * Falls back to original file if compression fails
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for small files
  if (file.size < 500 * 1024) {
    return file;
  }

  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(
              opts.maxWidth / width,
              opts.maxHeight / height
            );
            width = width * ratio;
            height = height * ratio;
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file); // Fallback to original
                return;
              }

              // Check if compression actually reduced size
              if (blob.size >= file.size) {
                resolve(file); // Original is smaller, use it
                return;
              }

              // Check max size
              const sizeMB = blob.size / (1024 * 1024);
              if (sizeMB > opts.maxSizeMB) {
                // Try again with lower quality
                canvas.toBlob(
                  (smallerBlob) => {
                    if (smallerBlob) {
                      const compressedFile = new File(
                        [smallerBlob],
                        file.name,
                        { type: file.type, lastModified: Date.now() }
                      );
                      resolve(compressedFile);
                    } else {
                      resolve(file);
                    }
                  },
                  file.type,
                  opts.quality * 0.7 // Lower quality for second attempt
                );
                return;
              }

              const compressedFile = new File(
                [blob],
                file.name,
                { type: file.type, lastModified: Date.now() }
              );
              resolve(compressedFile);
            },
            file.type,
            opts.quality
          );
        };

        img.onerror = () => {
          resolve(file); // Fallback to original on error
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        resolve(file); // Fallback to original on error
      };

      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file; // Fallback to original
  }
}

/**
 * Gets image dimensions without loading full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validates image file before processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not supported. Please use JPEG, PNG, WebP, or GIF.`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 10MB.`,
    };
  }

  return { valid: true };
}

