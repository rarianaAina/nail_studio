import type { Review } from '@/types';
import { mockReviews } from '@/data/mock/reviews';

const store: Review[] = [...mockReviews];

export const reviewService = {
  /**
   * Fetch all reviews.
   * Firebase: getDocs(query(collection(db, 'reviews'), orderBy('date', 'desc')))
   */
  getAll: async (): Promise<Review[]> => {
    return [...store];
  },

  /**
   * Fetch the N most recent reviews.
   * Firebase: query(..., orderBy('date', 'desc'), limit(n))
   */
  getRecent: async (limit = 4): Promise<Review[]> => {
    return [...store]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  },

  /**
   * Get average rating.
   * Firebase: computed client-side or stored as a denormalized field
   */
  getAverageRating: async (): Promise<number> => {
    if (store.length === 0) return 0;
    const sum = store.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / store.length) * 10) / 10;
  },
};
