// types/appointment.ts

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// ✅ Ajout du type PaymentMethod
export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'check';

export interface Appointment {
  id: string;
  clientId?: string;
  clientName: string;
  phone: string;
  email?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  paymentMethod?: PaymentMethod; // ✅ Ajout
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentDto {
  clientId?: string;
  clientName: string;
  phone: string;
  email?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  paymentMethod?: PaymentMethod; // ✅ Ajout
  notes?: string;
}

export interface UpdateAppointmentDto {
  clientId?: string;
  clientName?: string;
  phone?: string;
  email?: string;
  serviceId?: string;
  serviceName?: string;
  price?: number;
  date?: string;
  time?: string;
  status?: AppointmentStatus;
  paymentMethod?: PaymentMethod; // ✅ Ajout
  notes?: string;
}