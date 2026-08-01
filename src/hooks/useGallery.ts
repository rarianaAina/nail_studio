import { useCallback, useEffect, useState } from 'react';
import type { GalleryItem, CreateGalleryItemDto } from '@/types';
import { galleryService } from '@/services/galleryService';

interface UseGalleryReturn {
  items: GalleryItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (data: CreateGalleryItemDto, file: File) => Promise<GalleryItem>;
  remove: (id: string, imageUrl: string) => Promise<void>;
  update: (id: string, data: Partial<GalleryItem>) => Promise<GalleryItem>;
  cleanupOrphans: () => Promise<number>;
}

export function useGallery(): UseGalleryReturn {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await galleryService.getAll();
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (data: CreateGalleryItemDto, file: File) => {
    const created = await galleryService.create(data, file);
    setItems(prev => [created, ...prev]);
    return created;
  };

  const remove = async (id: string, imageUrl: string) => {
    await galleryService.delete(id, imageUrl);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const update = async (id: string, data: Partial<GalleryItem>) => {
    const updated = await galleryService.update(id, data);
    setItems(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  };

  const cleanupOrphans = async () => {
    const count = await galleryService.cleanupOrphans();
    return count;
  };

  return {
    items,
    loading,
    error,
    refresh: load,
    add,
    remove,
    update,
    cleanupOrphans,
  };
}