import type { AppointmentSettings, UpdateAppointmentSettingsDto } from '@/types/appointmentSettings';
import { appointmentSettingsService } from '@/services/appointmentSettingsService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface UseAppointmentSettingsReturn {
  settings: AppointmentSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (data: UpdateAppointmentSettingsDto) => Promise<void>;
  refresh: () => Promise<void>;
}

const NONE: AppointmentSettings | null = null;

export function useAppointmentSettings(): UseAppointmentSettingsReturn {
  const { data: settings, loading, error, refresh } = useResource(
    queryKeys.appointmentSettings,
    () => appointmentSettingsService.get(),
    NONE
  );
  const write = useCacheWriter<AppointmentSettings | null>(queryKeys.appointmentSettings, NONE);

  const updateSettings = async (data: UpdateAppointmentSettingsDto) => {
    const updated = await appointmentSettingsService.update(data);
    write(() => updated);
  };

  return { settings, loading, error, updateSettings, refresh };
}
