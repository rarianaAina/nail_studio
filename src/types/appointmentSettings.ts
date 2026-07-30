export interface AppointmentSettings {
  id: string;
  cancellationDeadlineHours: number;
  cancellationDeadlineLabel: string;
  allowCancellation: boolean;
  updatedAt?: string;
}

export interface UpdateAppointmentSettingsDto {
  cancellationDeadlineHours?: number;
  cancellationDeadlineLabel?: string;
  allowCancellation?: boolean;
}