import { useMemo, useCallback } from 'react';
import { useConfig } from './useConfig';

export function useActiveConfig() {
  const { 
    categories, 
    timeSlots, 
    loading, 
    refresh,
    // ✅ On exclut explicitement getActiveTimeSlotsByDate de rest
    getActiveTimeSlotsByDate: _getActiveTimeSlotsByDate, 
    ...rest 
  } = useConfig();

  const activeCategoryNames = useMemo(
    () => categories.filter((c) => c.active).map((c) => c.name),
    [categories]
  );

  const timeSlotsList = useMemo(
    () => timeSlots.filter((s) => s.active).map((s) => s.label),
    [timeSlots]
  );

  // ✅ On redéfinit notre propre version pour le système par date
  const getActiveTimeSlotsByDate = useCallback(
    (date: string): string[] => {
      return timeSlots
        .filter((s) => s.date === date && s.active)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => s.label);
    },
    [timeSlots]
  );

  return {
    categories: activeCategoryNames,
    timeSlots: timeSlotsList,
    loading,
    refresh,
    getActiveTimeSlotsByDate, // ✅ Une seule fois
    ...rest, // ✅ rest ne contient plus getActiveTimeSlotsByDate
  };
}