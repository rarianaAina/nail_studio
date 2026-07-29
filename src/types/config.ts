export interface ServiceCategoryConfig {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export interface TimeSlotConfig {
  id: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

export interface CreateCategoryDto {
  name: string;
  sortOrder?: number;
}

export interface CreateTimeSlotDto {
  label: string;
  sortOrder?: number;
}
