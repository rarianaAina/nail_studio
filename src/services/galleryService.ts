// services/galleryService.ts
import { supabase } from '@/lib/supabase';
import { uploadImage } from './storageService';
import type { GalleryItem, CreateGalleryItemDto } from '@/types';

interface GalleryRow {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToGallery(r: GalleryRow): GalleryItem {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    image: r.image,
    description: r.description ?? undefined,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const galleryService = {
  // ✅ Existant : Récupérer toutes les images
  async getAll(): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as GalleryRow[]).map(rowToGallery);
  },

  // ✅ Existant : Récupérer par catégorie
  async getByCategory(category: string): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as GalleryRow[]).map(rowToGallery);
  },

  // ✅ Existant : Récupérer les catégories
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('category');
    if (error) throw error;
    return [...new Set((data as Pick<GalleryRow, 'category'>[]).map((r) => r.category))];
  },

  async create(data: CreateGalleryItemDto, file: File): Promise<GalleryItem> {
    // 1. Upload l'image avec compression automatique
    const imageUrl = await uploadImage(file, 'gallery');

    // 2. Insérer dans la table gallery
    const { data: created, error } = await supabase
      .from('gallery')
      .insert({
        title: data.title,
        category: data.category,
        image: imageUrl, // ✅ L'URL est générée ici
        description: data.description || '',
      })
      .select()
      .single();

    if (error) throw error;
    return rowToGallery(created as GalleryRow);
  },

  // ✅ NOUVEAU : Supprimer une image (base + storage)
  async delete(id: string, imageUrl: string): Promise<void> {
    // 1. Extraire le chemin du fichier depuis l'URL
    const filePath = imageUrl.split('/storage/v1/object/public/')[1];
    
    // 2. Supprimer de la base
    const { error: dbError } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);
    
    if (dbError) throw dbError;

    // 3. Supprimer du Storage
    if (filePath) {
      const bucket = filePath.split('/')[0];
      const path = filePath.split('/').slice(1).join('/');
      
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (storageError) throw storageError;
    }
  },

  // ✅ NOUVEAU : Mettre à jour les infos (titre, catégorie, description)
  async update(id: string, data: Partial<GalleryItem>): Promise<GalleryItem> {
    const { data: updated, error } = await supabase
      .from('gallery')
      .update({
        title: data.title,
        category: data.category,
        description: data.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return rowToGallery(updated as GalleryRow);
  },

  // ✅ NOUVEAU : Nettoyer les images orphelines
  async cleanupOrphans(): Promise<number> {
    // Récupérer toutes les URLs de la base
    const { data: galleryItems } = await supabase
      .from('gallery')
      .select('image');

    const usedUrls = new Set(galleryItems?.map(item => item.image) || []);

    // Lister tous les fichiers du bucket gallery
    const { data: files } = await supabase.storage
      .from('gallery')
      .list();

    let deletedCount = 0;
    for (const file of files || []) {
      const publicUrl = supabase.storage.from('gallery').getPublicUrl(file.name).data.publicUrl;
      if (!usedUrls.has(publicUrl)) {
        await supabase.storage.from('gallery').remove([file.name]);
        deletedCount++;
      }
    }

    return deletedCount;
  }
};