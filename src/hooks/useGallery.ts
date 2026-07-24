import { useCallback, useEffect, useState } from 'react';
import type { GalleryItem } from '@/types';
import { galleryService } from '@/services/galleryService';

interface UseGalleryReturn {
  items: GalleryItem[];
  loading: boolean;
  error: string | null;
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

  return { items, loading, error };
}
