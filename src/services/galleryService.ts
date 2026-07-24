import type { GalleryItem } from '@/types';
import { mockGalleryItems } from '@/data/mock/gallery';

const store: GalleryItem[] = [...mockGalleryItems];

export const galleryService = {
  /**
   * Fetch all gallery items.
   * Firebase: getDocs(collection(db, 'gallery'))
   */
  getAll: async (): Promise<GalleryItem[]> => {
    return [...store];
  },

  /**
   * Fetch gallery items by category.
   * Firebase: query(collection(db, 'gallery'), where('category', '==', category))
   */
  getByCategory: async (category: string): Promise<GalleryItem[]> => {
    return store.filter((g) => g.category === category);
  },

  /**
   * Get available categories.
   */
  getCategories: async (): Promise<string[]> => {
    return [...new Set(store.map((g) => g.category))];
  },
};
