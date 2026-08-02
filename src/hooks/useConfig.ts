import { useCallback, useEffect, useState } from 'react';
import type { ServiceCategoryConfig, TimeSlotConfig, CreateCategoryDto, CreateTimeSlotDto } from '@/types/config';
import { configService } from '@/services/configService';

export function useConfig() {
  const [categories, setCategories] = useState<ServiceCategoryConfig[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, slots] = await Promise.all([
        configService.getCategories(),
        configService.getTimeSlots(),
      ]);
      setCategories(cats);
      setTimeSlots(slots);
    } catch {
      // silent — admin pages handle empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCategory = async (data: CreateCategoryDto) => {
    const created = await configService.createCategory(data);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const updateCategory = async (id: string, data: Partial<ServiceCategoryConfig>) => {
    await configService.updateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCategory = async (id: string) => {
    await configService.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const createTimeSlot = async (data: CreateTimeSlotDto) => {
    const created = await configService.createTimeSlot(data);
    setTimeSlots((prev) => [...prev, created]);
    return created;
  };

  const updateTimeSlot = async (id: string, data: Partial<TimeSlotConfig>) => {
    await configService.updateTimeSlot(id, data);
    setTimeSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteTimeSlot = async (id: string) => {
    await configService.deleteTimeSlot(id);
    setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  };

  // ✅ Récupérer les créneaux pour une date spécifique
  const getTimeSlotsByDate = useCallback((date: string): TimeSlotConfig[] => {
    return timeSlots.filter((slot) => slot.date === date);
  }, [timeSlots]);

  // ✅ Récupérer les créneaux actifs pour une date spécifique
  const getActiveTimeSlotsByDate = useCallback((date: string): string[] => {
    return timeSlots
      .filter((slot) => slot.date === date && slot.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((slot) => slot.label);
  }, [timeSlots]);

  // ✅ Récupérer tous les créneaux actifs (compatibilité)
  const getActiveTimeSlots = useCallback((): string[] => {
    return timeSlots
      .filter((slot) => slot.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((slot) => slot.label);
  }, [timeSlots]);

  return {
    categories,
    timeSlots,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getTimeSlotsByDate,
    getActiveTimeSlotsByDate,
    getActiveTimeSlots,
    refresh: load,
  };
}