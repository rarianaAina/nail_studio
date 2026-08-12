import type { SpecialInfo, CreateSpecialInfoDto, UpdateSpecialInfoDto } from '@/types';
import { specialInfoService } from '@/services/specialInfoService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

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

const EMPTY: SpecialInfo[] = [];

export function useSpecialInfos(): UseSpecialInfosReturn {
  const { data: infos, loading, error, refresh } = useResource(
    queryKeys.specialInfos,
    () => specialInfoService.getActive(),
    EMPTY
  );
  const write = useCacheWriter<SpecialInfo[]>(queryKeys.specialInfos, EMPTY);

  const create = async (data: CreateSpecialInfoDto) => {
    const created = await specialInfoService.create(data);
    write((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, data: UpdateSpecialInfoDto) => {
    const updated = await specialInfoService.update(id, data);
    write((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  const deleteInfo = async (id: string) => {
    await specialInfoService.delete(id);
    write((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleActive = async (id: string, active: boolean) => {
    const updated = await specialInfoService.toggleActive(id, active);
    write((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  return { infos, loading, error, refresh, create, update, delete: deleteInfo, toggleActive };
}
