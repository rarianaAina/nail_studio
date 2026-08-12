import { useCallback } from 'react';
import type { ServiceCategoryConfig, TimeSlotConfig, CreateCategoryDto, CreateTimeSlotDto } from '@/types/config';
import { configService } from '@/services/configService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface ConfigBundle {
  categories: ServiceCategoryConfig[];
  timeSlots: TimeSlotConfig[];
}

const EMPTY: ConfigBundle = { categories: [], timeSlots: [] };

export function useConfig() {
  const { data, loading, refresh } = useResource(
    queryKeys.config,
    async (): Promise<ConfigBundle> => {
      const [categories, timeSlots] = await Promise.all([
        configService.getCategories(),
        configService.getTimeSlots(),
      ]);
      return { categories, timeSlots };
    },
    EMPTY
  );
  const write = useCacheWriter<ConfigBundle>(queryKeys.config, EMPTY);

  const { categories, timeSlots } = data;

  const createCategory = async (dto: CreateCategoryDto) => {
    const created = await configService.createCategory(dto);
    write((prev) => ({ ...prev, categories: [...prev.categories, created] }));
    return created;
  };

  const updateCategory = async (id: string, dto: Partial<ServiceCategoryConfig>) => {
    await configService.updateCategory(id, dto);
    write((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...dto } : c)),
    }));
  };

  const deleteCategory = async (id: string) => {
    await configService.deleteCategory(id);
    write((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }));
  };

  const createTimeSlot = async (dto: CreateTimeSlotDto) => {
    const created = await configService.createTimeSlot(dto);
    write((prev) => ({ ...prev, timeSlots: [...prev.timeSlots, created] }));
    return created;
  };

  const updateTimeSlot = async (id: string, dto: Partial<TimeSlotConfig>) => {
    await configService.updateTimeSlot(id, dto);
    write((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((s) => (s.id === id ? { ...s, ...dto } : s)),
    }));
  };

  const deleteTimeSlot = async (id: string) => {
    await configService.deleteTimeSlot(id);
    write((prev) => ({ ...prev, timeSlots: prev.timeSlots.filter((s) => s.id !== id) }));
  };

  const getTimeSlotsByDate = useCallback(
    (date: string): TimeSlotConfig[] => timeSlots.filter((slot) => slot.date === date),
    [timeSlots]
  );

  const getActiveTimeSlotsByDate = useCallback(
    (date: string): string[] =>
      timeSlots
        .filter((slot) => slot.date === date && slot.active)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((slot) => slot.label),
    [timeSlots]
  );

  const getActiveTimeSlots = useCallback(
    (): string[] =>
      timeSlots
        .filter((slot) => slot.active)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((slot) => slot.label),
    [timeSlots]
  );

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
    refresh,
  };
}
