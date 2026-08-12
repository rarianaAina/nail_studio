import type { LoyaltySettings } from '@/services/loyaltyService';
import { loyaltyService } from '@/services/loyaltyService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface UseLoyaltyReturn {
  points: number;
  settings: LoyaltySettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSettings: (pointsPerVisit: number) => Promise<void>;
}

interface LoyaltyBundle {
  points: number;
  settings: LoyaltySettings | null;
}

const EMPTY: LoyaltyBundle = { points: 0, settings: null };

export function useLoyalty(userId?: string): UseLoyaltyReturn {
  const key = queryKeys.loyalty(userId);

  const { data, loading, error, refresh } = useResource(
    key,
    async (): Promise<LoyaltyBundle> => {
      const settings = await loyaltyService.getSettings();
      const points = userId ? await loyaltyService.getClientPointsByUserId(userId) : 0;
      return { points, settings };
    },
    EMPTY
  );
  const write = useCacheWriter<LoyaltyBundle>(key, EMPTY);

  const updateSettings = async (pointsPerVisit: number) => {
    const updated = await loyaltyService.updateSettings(pointsPerVisit);
    write((prev) => ({ ...prev, settings: updated }));
  };

  return {
    points: data.points,
    settings: data.settings,
    loading,
    error,
    refresh,
    updateSettings,
  };
}
