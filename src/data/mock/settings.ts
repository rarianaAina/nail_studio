import type { SalonSettings } from '@/types/settings';

export const mockSalonSettings: SalonSettings = {
  name: 'Nida Nail Studio',
  tagline: "L'art des ongles, sublimé",
  address: '12 Rue Jean-Jaurès, Analakely, Antananarivo 101, Madagascar',
  phone: '+261 34 12 345 67',
  whatsapp: '+261 34 12 345 67',
  facebook: 'https://facebook.com/nida.nail.studio',
  instagram: 'https://instagram.com/nida.nail.studio',
  email: 'contact@nida-nail.mg',
  hours: [
    { day: 'Lundi', open: '09:00', close: '18:00' },
    { day: 'Mardi', open: '09:00', close: '18:00' },
    { day: 'Mercredi', open: '09:00', close: '18:00' },
    { day: 'Jeudi', open: '09:00', close: '18:00' },
    { day: 'Vendredi', open: '09:00', close: '19:00' },
    { day: 'Samedi', open: '09:00', close: '19:00' },
    { day: 'Dimanche', open: '00:00', close: '00:00', closed: true },
  ],
};
