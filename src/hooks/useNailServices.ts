import type { Service, CreateServiceDto } from '@/types';
import { nailServiceService } from '@/services/nailServiceService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface UseNailServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  createService: (data: CreateServiceDto) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  moveService: (fromIndex: number, toIndex: number) => Promise<void>;
}

const EMPTY: Service[] = [];

const bySortOrder = (a: Service, b: Service) => (a.sortOrder || 0) - (b.sortOrder || 0);

async function fetchServices(): Promise<Service[]> {
  const data = await nailServiceService.getAll();
  return [...data].sort(bySortOrder);
}

export function useNailServices(): UseNailServicesReturn {
  const { data: services, loading, error, refresh } = useResource(
    queryKeys.services,
    fetchServices,
    EMPTY
  );
  const write = useCacheWriter<Service[]>(queryKeys.services, EMPTY);

  const createService = async (data: CreateServiceDto) => {
    const created = await nailServiceService.create(data);
    write((prev) => [...prev, created].sort(bySortOrder));
    return created;
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    const updated = await nailServiceService.update(id, data);
    write((prev) => prev.map((s) => (s.id === id ? updated : s)).sort(bySortOrder));
  };

  const deleteService = async (id: string) => {
    await nailServiceService.delete(id);
    write((prev) => prev.filter((s) => s.id !== id));
  };

  const moveService = async (fromIndex: number, toIndex: number) => {
    const sorted = [...services];
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    // Les écritures restent séquentielles : la connexion du salon supporte mal
    // les rafales parallèles, et l'ordre d'application importe peu ici.
    for (let i = 0; i < sorted.length; i++) {
      await updateService(sorted[i].id, { sortOrder: i });
    }
  };

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    refresh,
    moveService,
  };
}
