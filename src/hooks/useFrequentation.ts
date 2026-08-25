import type { FrequentationStats } from '@/types/audience';
import { audienceService } from '@/services/audienceService';
import { queryKeys } from '@/lib/queryClient';
import { useResource } from './useResource';

interface UseFrequentationReturn {
  stats: FrequentationStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const EMPTY = null as FrequentationStats | null;

export function useFrequentation(jours: number): UseFrequentationReturn {
  const { data, loading, error, refresh } = useResource(
    queryKeys.frequentation(jours),
    () => audienceService.getFrequentation(jours),
    EMPTY,
    // Le journal se remplit en continu ; une minute de fraîcheur suffit à
    // éviter de rejouer l'agrégation à chaque changement de période.
    { staleTime: 60 * 1000 }
  );

  return { stats: data, loading, error, refresh };
}
