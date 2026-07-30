import { useCallback, useEffect, useState } from 'react';
import type { AppointmentSettings, UpdateAppointmentSettingsDto } from '@/types/appointmentSettings';
import { appointmentSettingsService } from '@/services/appointmentSettingsService';

interface UseAppointmentSettingsReturn {
  settings: AppointmentSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (data: UpdateAppointmentSettingsDto) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAppointmentSettings(): UseAppointmentSettingsReturn {
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await appointmentSettingsService.get();
      setSettings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateSettings = async (data: UpdateAppointmentSettingsDto) => {
    const updated = await appointmentSettingsService.update(data);
    setSettings(updated);
  };

  return { settings, loading, error, updateSettings, refresh: load };
}