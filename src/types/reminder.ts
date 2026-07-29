export type ReminderRecipients = 'client' | 'admin' | 'both';
export type ReminderDelay = 24 | 12 | 2;

export interface ReminderSettings {
  id?: string;
  enabled: boolean;
  delayHours: ReminderDelay;
  recipients: ReminderRecipients;
  adminPhone?: string;
  adminEmail?: string;
  updatedAt?: string;
}

export interface Reminder {
  id: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  scheduledAt: string;
  recipients: ReminderRecipients;
  sent: boolean;
  sentAt?: string;
  createdAt?: string;
}

export interface CreateReminderDto {
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  recipients: ReminderRecipients;
  delayHours: ReminderDelay;
}
