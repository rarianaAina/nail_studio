import type { AppointmentStatus } from '@/types/appointment';

export const TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-sky-100 text-sky-700 border-sky-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const GALLERY_CATEGORIES = [
  'Toutes',
  'Vernis',
  'Nail Art',
  'Prothèses',
  'Manucure',
  'Pédicure',
] as const;

export const SERVICE_CATEGORIES = [
  'Toutes',
  'Manucure',
  'Pédicure',
  'Vernis semi-permanent',
  'Prothèses',
  'Soins',
  'Nail Art',
] as const;

export const COLOR_PRESETS = [
  { name: 'Rose poudré', primary: 'hsl(340 55% 62%)', accent: 'hsl(40 55% 62%)' },
  { name: 'Nude beige', primary: 'hsl(24 30% 65%)', accent: 'hsl(40 50% 60%)' },
  { name: 'Corail doux', primary: 'hsl(12 65% 65%)', accent: 'hsl(40 55% 62%)' },
  { name: 'Bordeaux', primary: 'hsl(345 50% 45%)', accent: 'hsl(40 55% 62%)' },
  { name: 'Lavande poudré', primary: 'hsl(280 35% 65%)', accent: 'hsl(40 55% 62%)' },
] as const;
