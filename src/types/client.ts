export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit: string; // ISO date
  visitCount: number;
  totalSpent: number; // Ariary
  notes?: string;
  createdAt?: string;
}

export interface CreateClientDto {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}
