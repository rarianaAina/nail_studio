// types/appointment.ts
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Appointment {
  id: string;
  clientId?: string;
  clientName: string;
  phone: string;
  email?: string;
  services: ServiceItem[];
  date: string;
  time: string;
  status: AppointmentStatus;
  paymentMethodId?: string;
  paymentMethod?: {
    id: string;
    name: string;
    label: string;
    icon?: string;
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentDto {
  clientId?: string;
  clientName: string;
  phone: string;
  email?: string;
  serviceIds: string[];
  date: string;
  time: string;
  paymentMethodId?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  clientId?: string;
  clientName?: string;
  phone?: string;
  email?: string;
  serviceIds?: string[];
  date?: string;
  time?: string;
  status?: AppointmentStatus;
  paymentMethodId?: string;
  notes?: string;
}

// ✅ EXPORT NORMAL (pas export type) pour les fonctions
export const getTotalPrice = (appointment: Appointment): number => 
  appointment.services.reduce((sum, s) => sum + s.price, 0);

export const getTotalDuration = (appointment: Appointment): number => 
  appointment.services.reduce((sum, s) => sum + s.duration, 0);

export const getServiceNames = (appointment: Appointment): string => 
  appointment.services.map(s => s.name).join(' + ');