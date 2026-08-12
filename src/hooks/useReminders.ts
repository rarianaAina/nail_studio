import { useMemo } from 'react';
import type { Reminder } from '@/types';
import { reminderService } from '@/services/reminderService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface UseRemindersReturn {
  reminders: Reminder[];
  pending: Reminder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const EMPTY: Reminder[] = [];

export function useReminders(): UseRemindersReturn {
  const { data: reminders, loading, error, refresh } = useResource(
    queryKeys.reminders,
    () => reminderService.getAll(),
    EMPTY
  );

  const write = useCacheWriter<Reminder[]>(queryKeys.reminders, EMPTY);

  const pending = useMemo(() => reminders.filter((r) => !r.sent), [reminders]);

  const remove = async (id: string) => {
    await reminderService.delete(id);
    write((prev) => prev.filter((r) => r.id !== id));
  };

  return { reminders, pending, loading, error, refresh, remove };
}
