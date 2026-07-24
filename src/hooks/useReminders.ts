import { useCallback, useEffect, useState } from 'react';
import type { Reminder } from '@/types/reminder';
import { reminderService } from '@/services/reminderService';

interface UseRemindersReturn {
  reminders: Reminder[];
  pending: Reminder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useReminders(): UseRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reminderService.getAll();
      setReminders(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = reminders.filter((r) => !r.sent);

  return { reminders, pending, loading, error, refresh: load };
}
