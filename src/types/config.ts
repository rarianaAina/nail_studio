export interface ServiceCategoryConfig {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

// ✅ Version avec date (pour le nouveau système)
export interface TimeSlotConfig {
  id: string;
  date: string;        // ✅ Date spécifique (YYYY-MM-DD) au lieu de dayOfWeek
  label: string;       // '09:00', '09:30', ...
  sortOrder: number;
  active: boolean;
}

export interface CreateCategoryDto {
  name: string;
  sortOrder?: number;
}

// ✅ Version avec date (pour le nouveau système)
export interface CreateTimeSlotDto {
  date: string;        // ✅ Date spécifique au lieu de dayOfWeek
  label: string;
  sortOrder?: number;
  active?: boolean;
}