export type ServiceCategory = string;

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: number;
  price: number;
  image: string;
  popular?: boolean;
  active?: boolean;
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
  popular?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  category?: ServiceCategory;
  description?: string;
  duration?: number;
  price?: number;
  image?: string;
  popular?: boolean;
  active?: boolean;
}
