export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

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
  paymentMethodId?: string; // ✅ FK vers payment_methods
  paymentMethod?: {          // ✅ Relation (optionnel)
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
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  paymentMethodId?: string; // ✅ FK vers payment_methods
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
  paymentMethodId?: string; // ✅ FK vers payment_methods
  notes?: string;
}