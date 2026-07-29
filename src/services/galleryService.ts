import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/types';

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
  async getAll(): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as GalleryRow[]).map(rowToGallery);
  },

  async getByCategory(category: string): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as GalleryRow[]).map(rowToGallery);
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('gallery')
      .select('category');
    if (error) throw error;
    return [...new Set((data as Pick<GalleryRow, 'category'>[]).map((r) => r.category))];
  },
};
