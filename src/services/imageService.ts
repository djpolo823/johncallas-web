import { supabase, isSupabaseConfigured } from './supabase';

export const ImageService = {
  /**
   * Compresses an image file on the client side using HTML5 Canvas.
   * Limits maximum width/height to 1200px and JPEG quality to 0.75, ensuring files stay around ~100KB-300KB.
   */
  compressImage: (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // If it's not an image, resolve directly
      if (!file.type.startsWith('image/')) {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.75 quality (great balance of size and visual quality)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.75
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen para compresión.'));
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    });
  },

  /**
   * Converts a Blob or File to a Base64 string.
   */
  blobToBase64: (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Error al codificar imagen en Base64.'));
    });
  },

  /**
   * Compresses and uploads a list of files.
   * Returns an array of URLs or Base64 strings.
   */
  uploadImages: async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      // 1. Compress image in client
      const compressedBlob = await ImageService.compressImage(file);

      // 2. Upload to Supabase Storage if configured
      if (isSupabaseConfigured) {
        const fileExt = 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage Upload Error, falling back to local simulation:', uploadError);
          // If Supabase upload fails (e.g. bucket doesn't exist), fallback to Base64
          return await ImageService.blobToBase64(compressedBlob);
        }

        // Get public URL
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return data.publicUrl;
      } else {
        // Fallback for Demo: Return optimized Base64
        return await ImageService.blobToBase64(compressedBlob);
      }
    });

    return Promise.all(uploadPromises);
  }
};
