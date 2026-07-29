import { supabase } from '@/lib/supabase';
import type { ReminderSettings, ReminderDelay, ReminderRecipients } from '@/types';

interface ReminderSettingsRow {
  id: string;
  enabled: boolean;
  delay_hours: number;
  recipients: string;
  admin_phone: string | null;
  admin_email: string | null;
  updated_at: string | null;
}

function rowToSettings(r: ReminderSettingsRow): ReminderSettings {
  return {
    id: r.id,
    enabled: r.enabled,
    delayHours: r.delay_hours as ReminderDelay,
    recipients: r.recipients as ReminderRecipients,
    adminPhone: r.admin_phone ?? undefined,
    adminEmail: r.admin_email ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const reminderSettingsService = {
  async get(): Promise<ReminderSettings> {
    const { data, error } = await supabase
      .from('reminder_settings')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      const { data: created, error: err2 } = await supabase
        .from('reminder_settings')
        .insert({ enabled: true, delay_hours: 24, recipients: 'both' })
        .select()
        .single();
      if (err2) throw err2;
      return rowToSettings(created as ReminderSettingsRow);
    }
    return rowToSettings(data as ReminderSettingsRow);
  },

  async update(patch: Partial<ReminderSettings>): Promise<ReminderSettings> {
    const { data: existing } = await supabase
      .from('reminder_settings')
      .select('id')
      .maybeSingle();

    const row: Record<string, unknown> = {};
    if (patch.enabled !== undefined) row.enabled = patch.enabled;
    if (patch.delayHours !== undefined) row.delay_hours = patch.delayHours;
    if (patch.recipients !== undefined) row.recipients = patch.recipients;
    if (patch.adminPhone !== undefined) row.admin_phone = patch.adminPhone ?? null;
    if (patch.adminEmail !== undefined) row.admin_email = patch.adminEmail ?? null;

    if (existing) {
      const { data, error } = await supabase
        .from('reminder_settings')
        .update(row)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return rowToSettings(data as ReminderSettingsRow);
    } else {
      const { data, error } = await supabase
        .from('reminder_settings')
        .insert({ enabled: true, delay_hours: 24, recipients: 'both', ...row })
        .select()
        .single();
      if (error) throw error;
      return rowToSettings(data as ReminderSettingsRow);
    }
  },
};
