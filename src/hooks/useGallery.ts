import type { GalleryItem, CreateGalleryItemDto } from '@/types';
import { galleryService } from '@/services/galleryService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

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

const EMPTY: GalleryItem[] = [];

export function useGallery(): UseGalleryReturn {
  const { data: items, loading, error, refresh } = useResource(
    queryKeys.gallery,
    () => galleryService.getAll(),
    EMPTY
  );
  const write = useCacheWriter<GalleryItem[]>(queryKeys.gallery, EMPTY);

  const add = async (data: CreateGalleryItemDto, file: File) => {
    const created = await galleryService.create(data, file);
    write((prev) => [...prev, created]);
    return created;
  };

  const remove = async (id: string, imageUrl: string) => {
    await galleryService.delete(id, imageUrl);
    write((prev) => prev.filter((i) => i.id !== id));
  };

  const update = async (id: string, data: Partial<GalleryItem>) => {
    const updated = await galleryService.update(id, data);
    write((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  const cleanupOrphans = async () => {
    const count = await galleryService.cleanupOrphans();
    await refresh();
    return count;
  };

  return { items, loading, error, refresh, add, remove, update, cleanupOrphans };
}
