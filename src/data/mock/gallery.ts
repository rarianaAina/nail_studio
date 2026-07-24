import type { GalleryItem } from '@/types/gallery';

const px = (id: string, w = 800, h = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

export const mockGalleryItems: GalleryItem[] = [
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
