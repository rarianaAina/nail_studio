import type {
  Service,
  Appointment,
  AppointmentStatus,
  Client,
  Review,
  GalleryItem,
  SalonInfo,
  ServiceCategory,
} from './types';

export type {
  Service,
  Appointment,
  AppointmentStatus,
  Client,
  Review,
  GalleryItem,
  SalonInfo,
  ServiceCategory,
};

const px = (id: string, w = 800, h = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

export const salonInfo: SalonInfo = {
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

export const services: Service[] = [
  {
    id: 'svc-1',
    name: 'Manucure classique',
    category: 'Manucure',
    description:
      "Soin complet des mains, repoussage des cuticules, limage et vernis. Pour des mains impeccables et soignées.",
    duration: 45,
    price: 25000,
    image: px('3997389'),
    popular: true,
  },
  {
    id: 'svc-2',
    name: 'Manucure russe',
    category: 'Manucure',
    description:
      "Technique russe de précision pour un rendu parfait et longue durée. Idéal pour une finition impeccable.",
    duration: 75,
    price: 45000,
    image: px('3997391'),
    popular: true,
  },
  {
    id: 'svc-3',
    name: 'Vernis semi-permanent',
    category: 'Vernis semi-permanent',
    description:
      "Pose de vernis semi-permanent longue durée, jusqu'à 3 semaines sans écaillement. Disponible en 60+ teintes.",
    duration: 60,
    price: 35000,
    image: px('704815'),
    popular: true,
  },
  {
    id: 'svc-4',
    name: 'Pose de prothèses',
    category: 'Prothèses',
    description:
      "Extension d'onglets en gel ou résine, avec construction personnalisée selon la morphologie de vos mains.",
    duration: 120,
    price: 80000,
    image: px('704815'),
  },
  {
    id: 'svc-5',
    name: 'Pédicure spa',
    category: 'Pédicure',
    description:
      "Soin complet des pieds, gommage, masque hydratant et massage relaxant. Finition vernis semi-permanent.",
    duration: 90,
    price: 50000,
    image: px('3997391'),
  },
  {
    id: 'svc-6',
    name: 'Nail Art personnalisé',
    category: 'Nail Art',
    description:
      "Création unique et artistique selon vos envies : strass, décors 3D, dessins à la main, effet miroir...",
    duration: 90,
    price: 60000,
    image: px('3997389'),
    popular: true,
  },
  {
    id: 'svc-7',
    name: 'Soin paraffine',
    category: 'Soins',
    description:
      "Bain de paraffine pour nourrir intensément la peau, idéale pour mains sèches et abîmées.",
    duration: 30,
    price: 20000,
    image: px('704815'),
  },
  {
    id: 'svc-8',
    name: 'Dépose + nouvelle pose',
    category: 'Prothèses',
    description:
      "Dépose soignée de l'ancienne pose et application d'une nouvelle manucure. Pour un changement de look en douceur.",
    duration: 150,
    price: 95000,
    image: px('3997391'),
  },
];

export const galleryItems: GalleryItem[] = [
  { id: 'g1', title: 'French moderne', category: 'Vernis', image: px('3997389') },
  { id: 'g2', title: 'Nail Art floral', category: 'Nail Art', image: px('3997391') },
  { id: 'g3', title: 'Prothèses naturel', category: 'Prothèses', image: px('704815') },
  { id: 'g4', title: 'Rouge passion', category: 'Vernis', image: px('3997389') },
  { id: 'g5', title: 'Effet miroir', category: 'Nail Art', image: px('3997391') },
  { id: 'g6', title: 'Pédicure corail', category: 'Pédicure', image: px('704815') },
  { id: 'g7', title: 'Pastel dégradé', category: 'Vernis', image: px('3997389') },
  { id: 'g8', title: 'Strass glamour', category: 'Nail Art', image: px('3997391') },
  { id: 'g9', title: 'Manucure russe', category: 'Manucure', image: px('704815') },
];

export const reviews: Review[] = [
  {
    id: 'r1',
    name: 'Hanta R.',
    rating: 5,
    date: '2026-06-28',
    comment:
      "Un travail d'artiste ! Mes ongles sont sublimes et la pose tient depuis 3 semaines. L'accueil est chaleureux, je recommande à 100%.",
    service: 'Vernis semi-permanent',
  },
  {
    id: 'r2',
    name: 'Lalao N.',
    rating: 5,
    date: '2026-07-02',
    comment:
      "Le salon le plus élégant de Tana. L'équipe est professionnelle et à l'écoute. Ma nail art était exactement comme sur la photo d'inspiration.",
    service: 'Nail Art personnalisé',
  },
  {
    id: 'r3',
    name: 'Sahondra M.',
    rating: 5,
    date: '2026-07-08',
    comment:
      "Ambiance relaxante, propreté irréprochable. La manucure russe vaut le détour, finition parfaite.",
    service: 'Manucure russe',
  },
  {
    id: 'r4',
    name: 'Volana A.',
    rating: 4,
    date: '2026-07-12',
    comment:
      "Très satisfaite de ma pédicure spa. Petit bémol sur l'attente mais le résultat en vaut la peine.",
    service: 'Pédicure spa',
  },
];

export const clients: Client[] = [
  {
    id: 'c1',
    name: 'Hanta Rakotoarison',
    phone: '+261 34 11 22 33',
    email: 'hanta.r@email.mg',
    lastVisit: '2026-07-14',
    visitCount: 12,
    totalSpent: 540000,
    notes: 'Cliente fidèle, adore les tons pastel.',
  },
  {
    id: 'c2',
    name: 'Lalao Nirina',
    phone: '+261 34 44 55 66',
    email: 'lalao.n@email.mg',
    lastVisit: '2026-07-13',
    visitCount: 8,
    totalSpent: 360000,
  },
  {
    id: 'c3',
    name: 'Sahondra Mahefa',
    phone: '+261 32 77 88 99',
    email: 'sahondra.m@email.mg',
    lastVisit: '2026-07-12',
    visitCount: 15,
    totalSpent: 720000,
    notes: 'Préfère les rendez-vous le matin.',
  },
  {
    id: 'c4',
    name: 'Volana Andry',
    phone: '+261 33 10 20 30',
    lastVisit: '2026-07-10',
    visitCount: 4,
    totalSpent: 180000,
  },
  {
    id: 'c5',
    name: 'Tiana Razafy',
    phone: '+261 34 56 78 90',
    email: 'tiana.r@email.mg',
    lastVisit: '2026-07-08',
    visitCount: 6,
    totalSpent: 270000,
  },
  {
    id: 'c6',
    name: 'Mialy Andriana',
    phone: '+261 32 40 50 60',
    lastVisit: '2026-07-05',
    visitCount: 9,
    totalSpent: 405000,
  },
  {
    id: 'c7',
    name: 'Nirina Rasoanaivo',
    phone: '+261 33 70 80 90',
    email: 'nirina.r@email.mg',
    lastVisit: '2026-07-01',
    visitCount: 3,
    totalSpent: 135000,
  },
];

const today = new Date();
const iso = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const appointments: Appointment[] = [
  {
    id: 'a1',
    clientName: 'Hanta Rakotoarison',
    phone: '+261 34 11 22 33',
    email: 'hanta.r@email.mg',
    serviceId: 'svc-3',
    serviceName: 'Vernis semi-permanent',
    price: 35000,
    date: iso(0),
    time: '10:00',
    status: 'confirmed',
  },
  {
    id: 'a2',
    clientName: 'Lalao Nirina',
    phone: '+261 34 44 55 66',
    serviceId: 'svc-6',
    serviceName: 'Nail Art personnalisé',
    price: 60000,
    date: iso(0),
    time: '11:30',
    status: 'confirmed',
  },
  {
    id: 'a3',
    clientName: 'Sahondra Mahefa',
    phone: '+261 32 77 88 99',
    serviceId: 'svc-2',
    serviceName: 'Manucure russe',
    price: 45000,
    date: iso(0),
    time: '14:00',
    status: 'pending',
  },
  {
    id: 'a4',
    clientName: 'Volana Andry',
    phone: '+261 33 10 20 30',
    serviceId: 'svc-5',
    serviceName: 'Pédicure spa',
    price: 50000,
    date: iso(0),
    time: '15:30',
    status: 'confirmed',
  },
  {
    id: 'a5',
    clientName: 'Tiana Razafy',
    phone: '+261 34 56 78 90',
    serviceId: 'svc-4',
    serviceName: 'Pose de prothèses',
    price: 80000,
    date: iso(1),
    time: '09:30',
    status: 'pending',
  },
  {
    id: 'a6',
    clientName: 'Mialy Andriana',
    phone: '+261 32 40 50 60',
    serviceId: 'svc-1',
    serviceName: 'Manucure classique',
    price: 25000,
    date: iso(1),
    time: '13:00',
    status: 'confirmed',
  },
  {
    id: 'a7',
    clientName: 'Nirina Rasoanaivo',
    phone: '+261 33 70 80 90',
    serviceId: 'svc-8',
    serviceName: 'Dépose + nouvelle pose',
    price: 95000,
    date: iso(2),
    time: '10:00',
    status: 'pending',
  },
  {
    id: 'a8',
    clientName: 'Hanta Rakotoarison',
    phone: '+261 34 11 22 33',
    serviceId: 'svc-7',
    serviceName: 'Soin paraffine',
    price: 20000,
    date: iso(-1),
    time: '16:00',
    status: 'completed',
  },
  {
    id: 'a9',
    clientName: 'Lalao Nirina',
    phone: '+261 34 44 55 66',
    serviceId: 'svc-3',
    serviceName: 'Vernis semi-permanent',
    price: 35000,
    date: iso(-2),
    time: '11:00',
    status: 'completed',
  },
  {
    id: 'a10',
    clientName: 'Sahondra Mahefa',
    phone: '+261 32 77 88 99',
    serviceId: 'svc-6',
    serviceName: 'Nail Art personnalisé',
    price: 60000,
    date: iso(-3),
    time: '15:00',
    status: 'completed',
  },
  {
    id: 'a11',
    clientName: 'Volana Andry',
    phone: '+261 33 10 20 30',
    serviceId: 'svc-2',
    serviceName: 'Manucure russe',
    price: 45000,
    date: iso(-5),
    time: '10:30',
    status: 'cancelled',
  },
  {
    id: 'a12',
    clientName: 'Mialy Andriana',
    phone: '+261 32 40 50 60',
    serviceId: 'svc-5',
    serviceName: 'Pédicure spa',
    price: 50000,
    date: iso(-7),
    time: '14:30',
    status: 'completed',
  },
];

export const timeSlots = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
];

export const formatAriary = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' Ar';

export const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-sky-100 text-sky-700 border-sky-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};
