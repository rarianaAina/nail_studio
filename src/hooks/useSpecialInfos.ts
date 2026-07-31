import { useCallback, useEffect, useState } from 'react';
import type { SpecialInfo, CreateSpecialInfoDto, UpdateSpecialInfoDto } from '@/types';
import { specialInfoService } from '@/services/specialInfoService';

interface UseSpecialInfosReturn {
  infos: SpecialInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (data: CreateSpecialInfoDto) => Promise<SpecialInfo>;
  update: (id: string, data: UpdateSpecialInfoDto) => Promise<SpecialInfo>;
  delete: (id: string) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<SpecialInfo>;
}

export function useSpecialInfos(): UseSpecialInfosReturn {
  const [infos, setInfos] = useState<SpecialInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await specialInfoService.getActive();
      setInfos(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: CreateSpecialInfoDto) => {
    const created = await specialInfoService.create(data);
    setInfos((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, data: UpdateSpecialInfoDto) => {
    const updated = await specialInfoService.update(id, data);
    setInfos((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  const deleteInfo = async (id: string) => {
    await specialInfoService.delete(id);
    setInfos((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleActive = async (id: string, active: boolean) => {
    const updated = await specialInfoService.toggleActive(id, active);
    setInfos((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  return {
    infos,
    loading,
    error,
    refresh: load,
    create,
    update,
    delete: deleteInfo,
    toggleActive,
  };
}