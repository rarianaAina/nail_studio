export type ServiceCategory = string;

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: number;
  price: number;
  image: string;
  additionalImages?: string[]; // ✅ Nouveau : images supplémentaires
  popular?: boolean;
  active?: boolean;
  sortOrder?: number; // ✅ Nouveau : ordre d'affichage
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServiceDto {
  name: string;
  category: ServiceCategory;
  description: string;
  duration: number;
  price: number;
  image: string;
  additionalImages?: string[]; // ✅ Nouveau
  popular?: boolean;
  sortOrder?: number; // ✅ Nouveau
}

export interface UpdateServiceDto {
  name?: string;
  category?: ServiceCategory;
  description?: string;
  duration?: number;
  price?: number;
  image?: string;
  additionalImages?: string[]; // ✅ Nouveau
  popular?: boolean;
  active?: boolean;
  sortOrder?: number; // ✅ Nouveau
}