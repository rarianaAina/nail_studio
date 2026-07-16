export type ServiceCategory =
  | 'Manucure'
  | 'Pédicure'
  | 'Vernis semi-permanent'
  | 'Prothèses'
  | 'Soins'
  | 'Nail Art';

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: number; // minutes
  price: number; // Ariary
  image: string;
  popular?: boolean;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  email?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string; // ISO date
  time: string; // HH:mm
  status: AppointmentStatus;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit: string;
  visitCount: number;
  totalSpent: number; // Ariary
  notes?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  service?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

export interface SalonInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  email: string;
  hours: { day: string; open: string; close: string; closed?: boolean }[];
}
