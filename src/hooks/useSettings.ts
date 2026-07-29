import { useCallback, useEffect, useState } from 'react';
import type { SalonSettings } from '@/types';
import { settingsService } from '@/services/settingsService';

interface UseSettingsReturn {
  settings: SalonSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (data: Partial<SalonSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await settingsService.get();
      console.log('✅ Settings chargés:', data);
      setSettings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateSettings = async (data: Partial<SalonSettings>) => {
    const updated = await settingsService.update(data);
    setSettings(updated);
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: load,
  };
}
