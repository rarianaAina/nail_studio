// hooks/useActiveConfig.ts
import { useMemo, useCallback } from 'react';
import { useConfig } from './useConfig';

export function useActiveConfig() {
  const { categories, timeSlots, ...rest } = useConfig();

  const activeCategoryNames = useMemo(
    () => categories.filter((c) => c.active).map((c) => c.name),
    [categories]
  );

  // Pour compatibilité (ancienne méthode)
  const timeSlotsList = useMemo(
    () => timeSlots.filter((s) => s.active).map((s) => s.label),
    [timeSlots]
  );

  // Récupérer les créneaux actifs par jour
  const getActiveTimeSlotsByDay = useCallback(
    (dayOfWeek: string): string[] => {
      return timeSlots
        .filter((s) => s.dayOfWeek === dayOfWeek && s.active)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => s.label);
    },
    [timeSlots]
  );

  return {
    categories: activeCategoryNames,
    timeSlots: timeSlotsList,
    getActiveTimeSlotsByDay, // ✅ Une seule fois
    ...rest,
  };
}