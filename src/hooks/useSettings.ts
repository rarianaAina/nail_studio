import type { SalonSettings } from '@/types';
import { settingsService } from '@/services/settingsService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface UseSettingsReturn {
  settings: SalonSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (data: Partial<SalonSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

const NONE: SalonSettings | null = null;

export function useSettings(): UseSettingsReturn {
  const { data: settings, loading, error, refresh } = useResource(
    queryKeys.settings,
    () => settingsService.get(),
    NONE
  );
  const write = useCacheWriter<SalonSettings | null>(queryKeys.settings, NONE);

  const updateSettings = async (data: Partial<SalonSettings>) => {
    const updated = await settingsService.update(data);
    write(() => updated);
  };

  return { settings, loading, error, updateSettings, refresh };
}
