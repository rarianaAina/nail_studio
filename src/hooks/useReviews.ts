import { useCallback, useEffect, useState } from 'react';
import type { Review } from '@/types';
import { reviewService } from '@/services/reviewService';

interface UseReviewsReturn {
  reviews: Review[];
  averageRating: number;
  loading: boolean;
  error: string | null;
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, avg] = await Promise.all([
        reviewService.getAll(),
        reviewService.getAverageRating(),
      ]);
      setReviews(data);
      setAverageRating(avg);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { reviews, averageRating, loading, error };
}
