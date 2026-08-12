import type { Review } from '@/types';
import { reviewService } from '@/services/reviewService';
import { queryKeys } from '@/lib/queryClient';
import { useResource } from './useResource';

interface UseReviewsReturn {
  reviews: Review[];
  averageRating: number;
  loading: boolean;
  error: string | null;
}

interface ReviewsBundle {
  reviews: Review[];
  averageRating: number;
}

const EMPTY: ReviewsBundle = { reviews: [], averageRating: 0 };

export function useReviews(): UseReviewsReturn {
  const { data, loading, error } = useResource(
    queryKeys.reviews,
    async (): Promise<ReviewsBundle> => {
      const [reviews, averageRating] = await Promise.all([
        reviewService.getAll(),
        reviewService.getAverageRating(),
      ]);
      return { reviews, averageRating };
    },
    EMPTY
  );

  return { reviews: data.reviews, averageRating: data.averageRating, loading, error };
}
