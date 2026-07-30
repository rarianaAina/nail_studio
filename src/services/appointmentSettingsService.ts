import { supabase } from '@/lib/supabase';
import type { AppointmentSettings, UpdateAppointmentSettingsDto } from '@/types/appointmentSettings';

interface AppointmentSettingsRow {
  id: string;
  cancellation_deadline_hours: number;
  cancellation_deadline_label: string;
  allow_cancellation: boolean;
  updated_at: string | null;
}

function rowToSettings(r: AppointmentSettingsRow): AppointmentSettings {
  return {
    id: r.id,
    cancellationDeadlineHours: r.cancellation_deadline_hours,
    cancellationDeadlineLabel: r.cancellation_deadline_label,
    allowCancellation: r.allow_cancellation,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const appointmentSettingsService = {
  async get(): Promise<AppointmentSettings> {
    const { data, error } = await supabase
      .from('appointment_settings')
      .select('*')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Créer les valeurs par défaut si aucune ligne n'existe
      const { data: created, error: createError } = await supabase
        .from('appointment_settings')
        .insert({
          cancellation_deadline_hours: 24,
          cancellation_deadline_label: '24 heures avant',
          allow_cancellation: true,
        })
        .select()
        .single();

      if (createError) throw createError;
      return rowToSettings(created as AppointmentSettingsRow);
    }

    return rowToSettings(data as AppointmentSettingsRow);
  },

  async update(data: UpdateAppointmentSettingsDto): Promise<AppointmentSettings> {
    const { data: existing } = await supabase
      .from('appointment_settings')
      .select('id')
      .maybeSingle();

    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.cancellationDeadlineHours !== undefined) {
      row.cancellation_deadline_hours = data.cancellationDeadlineHours;
    }
    if (data.cancellationDeadlineLabel !== undefined) {
      row.cancellation_deadline_label = data.cancellationDeadlineLabel;
    }
    if (data.allowCancellation !== undefined) {
      row.allow_cancellation = data.allowCancellation;
    }

    if (existing) {
      const { data: updated, error } = await supabase
        .from('appointment_settings')
        .update(row)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return rowToSettings(updated as AppointmentSettingsRow);
    } else {
      // Créer avec les valeurs par défaut + le patch
      const { data: created, error } = await supabase
        .from('appointment_settings')
        .insert({
          cancellation_deadline_hours: 24,
          cancellation_deadline_label: '24 heures avant',
          allow_cancellation: true,
          ...row,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToSettings(created as AppointmentSettingsRow);
    }
  },
};