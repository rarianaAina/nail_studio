// services/storageService.ts
import { supabase } from '@/lib/supabase';

// ✅ Fonction pour compresser l'image avant upload
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir en WebP avec qualité 80%
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.webp'),
                { type: 'image/webp' }
              );
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/webp',
          0.8
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// services/storageService.ts
export async function uploadImage(
  file: File,
  folder: string = 'services',
  fixedName?: string // ✅ Nouveau paramètre optionnel
): Promise<string> {
  const compressedFile = await compressImage(file);
  
  // ✅ Si un nom fixe est fourni, l'utiliser
  let fileName: string;
  if (fixedName) {
    const ext = compressedFile.name.split('.').pop() ?? 'webp';
    fileName = `${folder}/${fixedName}.${ext}`;
  } else {
    const ext = compressedFile.name.split('.').pop() ?? 'webp';
    fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  }

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, compressedFile, { 
      cacheControl: '31536000',
      upsert: true // ✅ Important pour remplacer l'ancien logo
    });

  if (error) throw error;

  const { data } = supabase.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
}

// ✅ Fonction pour supprimer une image du storage
export async function deleteImage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('images')
    .remove([filePath]);
  
  if (error) throw error;
}

// ✅ Fonction pour obtenir l'URL publique d'une image
export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}