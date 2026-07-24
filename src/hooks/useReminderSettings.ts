import { useCallback, useEffect, useState } from 'react';
import type { ReminderSettings } from '@/types/reminder';
import { reminderSettingsService } from '@/services/reminderSettingsService';

interface UseReminderSettingsReturn {
  reminderSettings: ReminderSettings | null;
  loading: boolean;
  error: string | null;
  updateReminderSettings: (patch: Partial<ReminderSettings>) => Promise<void>;
}

export function useReminderSettings(): UseReminderSettingsReturn {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reminderSettingsService.get();
      setReminderSettings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateReminderSettings = async (patch: Partial<ReminderSettings>) => {
    const updated = await reminderSettingsService.update(patch);
    setReminderSettings(updated);
  };

  return { reminderSettings, loading, error, updateReminderSettings };
}
