export interface AppointmentSettings {
  id: string;
  cancellationDeadlineHours: number;
  cancellationDeadlineLabel: string;
  allowCancellation: boolean;
  /** Minutes ajoutées après chaque prestation : nettoyage du poste et battement. */
  preparationMinutes: number;
  updatedAt?: string;
}

export interface UpdateAppointmentSettingsDto {
  cancellationDeadlineHours?: number;
  cancellationDeadlineLabel?: string;
  allowCancellation?: boolean;
  preparationMinutes?: number;
}