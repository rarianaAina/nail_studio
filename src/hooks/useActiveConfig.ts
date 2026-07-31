// hooks/useActiveConfig.ts
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

  // ✅ Récupérer les créneaux pour un jour spécifique
  const getTimeSlotsByDay = useCallback(async (dayOfWeek: string): Promise<string[]> => {
    try {
      const slots = await configService.getActiveTimeSlotsByDay(dayOfWeek);
      return slots;
    } catch {
      return [];
    }
  }, []);

  return { 
    categories, 
    timeSlots, 
    loading, 
    refresh: load,
    getTimeSlotsByDay, // ✅ Nouvelle fonction
  };
}