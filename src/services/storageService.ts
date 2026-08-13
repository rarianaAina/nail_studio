// services/storageService.ts
import { supabase } from '@/lib/supabase';

/** Extension correspondant au type réellement produit par le navigateur. */
export function extensionPourType(mime: string): string {
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  return 'bin';
}

/**
 * Encode le canevas dans le premier format que le navigateur sait produire.
 *
 * `toBlob` retombe silencieusement sur PNG lorsque le format demandé n'est pas
 * pris en charge — comportement prévu par la spécification, le paramètre de
 * qualité étant alors ignoré. Sans vérification, une photo de 600 × 800
 * ressortait en PNG de 700 Ko au lieu d'un WebP de 60 Ko, et le fichier était
 * malgré tout nommé « .webp ».
 *
 * L'ordre compte : WebP d'abord, JPEG ensuite. PNG n'est jamais un bon choix
 * pour une photographie, et c'était pourtant le repli imposé.
 */
function encoder(canvas: HTMLCanvasElement, qualite: number): Promise<Blob> {
  const formats = ['image/webp', 'image/jpeg'];

  const essayer = (index: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const format = formats[index];
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Encodage impossible'));

          // Le type obtenu peut différer du type demandé : c'est précisément
          // ce silence qu'il faut détecter.
          if (blob.type === format) return resolve(blob);

          if (index + 1 < formats.length) return resolve(essayer(index + 1));

          // Plus aucun format à tenter : on garde ce que le navigateur a
          // produit plutôt que d'échouer, l'importation doit aboutir.
          resolve(blob);
        },
        format,
        qualite
      );
    });

  return essayer(0);
}

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

        // L'extension suit le format réellement obtenu, et non celui demandé.
        encoder(canvas, 0.8)
          .then((blob) => {
            const extension = extensionPourType(blob.type);
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, `.${extension}`), {
                type: blob.type,
              })
            );
          })
          .catch(reject);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// services/storageService.ts
// export async function uploadImage(
//   file: File,
//   folder: string = 'services',
//   fixedName?: string // ✅ Nouveau paramètre optionnel
// ): Promise<string> {
//   const compressedFile = await compressImage(file);
  
//   // ✅ Si un nom fixe est fourni, l'utiliser
//   let fileName: string;
//   if (fixedName) {
//     const ext = compressedFile.name.split('.').pop() ?? 'webp';
//     fileName = `${folder}/${fixedName}.${ext}`;
//   } else {
//     const ext = compressedFile.name.split('.').pop() ?? 'webp';
//     fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
//   }

//   const { error } = await supabase.storage
//     .from('images')
//     .upload(fileName, compressedFile, { 
//       cacheControl: '31536000',
//       upsert: true // ✅ Important pour remplacer l'ancien logo
//     });

//   if (error) throw error;

//   const { data } = supabase.storage.from('images').getPublicUrl(fileName);
//   return data.publicUrl;
// }

// services/storageService.ts
export async function uploadImage(
  file: File,
  folder: string = 'services',
  fixedName?: string,
  bucket: string = 'images' // ✅ Par défaut, utiliser 'images'
): Promise<string> {
  const compressedFile = await compressImage(file);
  
  let fileName: string;
  if (fixedName) {
    const ext = compressedFile.name.split('.').pop() ?? 'webp';
    fileName = `${folder}/${fixedName}.${ext}`;
  } else {
    const ext = compressedFile.name.split('.').pop() ?? 'webp';
    fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  }

  const { error } = await supabase.storage
    .from(bucket) // ✅ Utiliser le bucket spécifié
    .upload(fileName, compressedFile, { 
      cacheControl: '31536000',
      upsert: true
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
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