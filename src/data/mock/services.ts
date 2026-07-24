import type { Service } from '@/types/service';

const px = (id: string, w = 800, h = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

export const mockServices: Service[] = [
  {
    id: 'svc-1',
    name: 'Manucure classique',
    category: 'Manucure',
    description:
      'Soin complet des mains, repoussage des cuticules, limage et vernis. Pour des mains impeccables et soignées.',
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
      'Technique russe de précision pour un rendu parfait et longue durée. Idéal pour une finition impeccable.',
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
      'Soin complet des pieds, gommage, masque hydratant et massage relaxant. Finition vernis semi-permanent.',
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
      'Bain de paraffine pour nourrir intensément la peau, idéale pour mains sèches et abîmées.',
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
