import type { ReminderSettings } from '@/types/reminder';
import { reminderSettingsService } from '@/services/reminderSettingsService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

const NONE: ReminderSettings | null = null;

export function useReminderSettings() {
  const { data: reminderSettings, loading, error } = useResource(
    queryKeys.reminderSettings,
    () => reminderSettingsService.get(),
    NONE
  );
  const write = useCacheWriter<ReminderSettings | null>(queryKeys.reminderSettings, NONE);

  const updateReminderSettings = async (patch: Partial<ReminderSettings>) => {
    const updated = await reminderSettingsService.update(patch);
    write(() => updated);
  };

  return { reminderSettings, loading, error, updateReminderSettings };
}
