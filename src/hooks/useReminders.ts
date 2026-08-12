import { useMemo } from 'react';
import type { Reminder } from '@/types';
import { reminderService } from '@/services/reminderService';
import { queryKeys } from '@/lib/queryClient';
import { useResource } from './useResource';

interface UseRemindersReturn {
  reminders: Reminder[];
  pending: Reminder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const EMPTY: Reminder[] = [];

export function useReminders(): UseRemindersReturn {
  const { data: reminders, loading, error, refresh } = useResource(
    queryKeys.reminders,
    () => reminderService.getAll(),
    EMPTY
  );

  const pending = useMemo(() => reminders.filter((r) => !r.sent), [reminders]);

  return { reminders, pending, loading, error, refresh };
}
