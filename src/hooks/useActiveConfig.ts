import { useMemo, useCallback } from 'react';
import { useConfig } from './useConfig';

export function useActiveConfig() {
  const { 
    categories, 
    timeSlots, 
    loading, 
    refresh,
    // ✅ On exclut explicitement getActiveTimeSlotsByDay de rest
    getActiveTimeSlotsByDay: _getActiveTimeSlotsByDay, 
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

  // ✅ On redéfinit notre propre version
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
    loading,
    refresh,
    getActiveTimeSlotsByDay, // ✅ Une seule fois
    ...rest, // ✅ rest ne contient plus getActiveTimeSlotsByDay
  };
}