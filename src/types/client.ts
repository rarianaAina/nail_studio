export interface Client {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  visitCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientDto {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  userId?: string;
}

export interface UpdateClientDto {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  visitCount?: number;
  totalSpent?: number;
  lastVisit?: string;
}
