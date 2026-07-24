import { supabase } from '@/lib/supabase';
import type { Reminder, CreateReminderDto } from '@/types/reminder';

// --- DB row shape ---
interface ReminderRow {
  id: string;
  appointment_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  scheduled_at: string;
  recipients: string;
  sent: boolean;
  created_at: string | null;
}

function rowToReminder(r: ReminderRow): Reminder {
  return {
    id: r.id,
    appointmentId: r.appointment_id,
    clientName: r.client_name,
    clientPhone: r.client_phone,
    clientEmail: r.client_email ?? undefined,
    serviceName: r.service_name,
    appointmentDate: r.appointment_date,
    appointmentTime: r.appointment_time,
    scheduledAt: r.scheduled_at,
    recipients: r.recipients as Reminder['recipients'],
    sent: r.sent,
    createdAt: r.created_at ?? undefined,
  };
}

function computeScheduledAt(date: string, time: string, delayHours: number): string {
  const [h, m] = time.split(':').map(Number);
  const apptDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  apptDate.setHours(apptDate.getHours() - delayHours);
  return apptDate.toISOString();
}

export const reminderService = {
  getAll: async (): Promise<Reminder[]> => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return (data as ReminderRow[]).map(rowToReminder);
  },

  getByAppointmentId: async (appointmentId: string): Promise<Reminder[]> => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('appointment_id', appointmentId);
    if (error) throw error;
    return (data as ReminderRow[]).map(rowToReminder);
  },

  create: async (dto: CreateReminderDto): Promise<Reminder> => {
    const scheduledAt = computeScheduledAt(dto.appointmentDate, dto.appointmentTime, dto.delayHours);
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        appointment_id: dto.appointmentId,
        client_name: dto.clientName,
        client_phone: dto.clientPhone,
        client_email: dto.clientEmail ?? null,
        service_name: dto.serviceName,
        appointment_date: dto.appointmentDate,
        appointment_time: dto.appointmentTime,
        scheduled_at: scheduledAt,
        recipients: dto.recipients,
        sent: false,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToReminder(data as ReminderRow);
  },

  deleteByAppointmentId: async (appointmentId: string): Promise<void> => {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('appointment_id', appointmentId);
    if (error) throw error;
  },
};
