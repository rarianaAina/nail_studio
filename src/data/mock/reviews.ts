import type { Review } from '@/types/review';

export const mockReviews: Review[] = [
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
      'Ambiance relaxante, propreté irréprochable. La manucure russe vaut le détour, finition parfaite.',
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
