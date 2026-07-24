export type ServiceCategory =
  | 'Manucure'
  | 'Pédicure'
  | 'Vernis semi-permanent'
  | 'Prothèses'
  | 'Soins'
  | 'Nail Art';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: number; // minutes
  price: number; // Ariary
  image: string;
  popular?: boolean;
  active?: boolean;
  createdAt?: string;
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
