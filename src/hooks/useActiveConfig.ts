import { useCallback, useEffect, useState } from 'react';
import { configService } from '@/services/configService';

export function useActiveConfig() {
  const [categories, setCategories] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, slots] = await Promise.all([
        configService.getActiveCategories(),
        configService.getActiveTimeSlots(),
      ]);
      setCategories(cats);
      setTimeSlots(slots);
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { categories, timeSlots, loading, refresh: load };
}
