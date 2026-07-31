export interface SpecialInfo {
  id: string;
  title: string;
  content: string;
  icon: string;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSpecialInfoDto {
  title: string;
  content: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface UpdateSpecialInfoDto {
  title?: string;
  content?: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}