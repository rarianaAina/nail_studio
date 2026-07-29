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
    refresh: load,
  };
}
