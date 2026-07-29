// hooks/useReminderSettings.ts
import { useCallback, useEffect, useState } from 'react';
import type { ReminderSettings } from '@/types/reminder';
import { reminderSettingsService } from '@/services/reminderSettingsService';

export function useReminderSettings() {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Tentative de chargement des rappels...');
      const data = await reminderSettingsService.get();
      console.log('✅ Données reçues:', data);
      setReminderSettings(data);
      setError(null);
    } catch (e) {
      console.error('❌ Erreur détaillée:', e);
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateReminderSettings = async (patch: Partial<ReminderSettings>) => {
    try {
      const updated = await reminderSettingsService.update(patch);
      setReminderSettings(updated);
      setError(null);
    } catch (e) {
      console.error('❌ Erreur lors de la mise à jour:', e);
      throw e;
    }
  };

  return { reminderSettings, loading, error, updateReminderSettings };
}