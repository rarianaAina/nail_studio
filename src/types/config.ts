export interface ServiceCategoryConfig {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export interface TimeSlotConfig {
  id: string;
  dayOfWeek: string; // ✅ Ajout: 'monday', 'tuesday', ...
  label: string;     // '09:00', '09:30', ...
  sortOrder: number;
  active: boolean;
}

export interface CreateCategoryDto {
  name: string;
  sortOrder?: number;
}

export interface CreateTimeSlotDto {
  dayOfWeek: string; // ✅ Ajout
  label: string;
  sortOrder?: number;
  active?: boolean;
}