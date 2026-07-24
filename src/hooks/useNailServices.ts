import { useCallback, useEffect, useState } from 'react';
import type { Service, CreateServiceDto } from '@/types';
import { nailServiceService } from '@/services/nailServiceService';

interface UseNailServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  createService: (data: CreateServiceDto) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNailServices(): UseNailServicesReturn {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await nailServiceService.getAll();
      setServices(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createService = async (data: CreateServiceDto) => {
    const created = await nailServiceService.create(data);
    setServices((prev) => [...prev, created]);
    return created;
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    const updated = await nailServiceService.update(id, data);
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const deleteService = async (id: string) => {
    await nailServiceService.delete(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    refresh: load,
  };
}
