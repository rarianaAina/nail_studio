import type { Review, ReviewStatus } from '@/types';
import { reviewService } from '@/services/reviewService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface ReviewsBundle {
  reviews: Review[];
  averageRating: number;
}

const EMPTY: ReviewsBundle = { reviews: [], averageRating: 0 };

/** Avis publiés, pour le site vitrine. */
export function useReviews() {
  const { data, loading, error } = useResource(
    queryKeys.reviews,
    async (): Promise<ReviewsBundle> => {
      const [reviews, averageRating] = await Promise.all([
        reviewService.getPublished(),
        reviewService.getAverageRating(),
      ]);
      return { reviews, averageRating };
    },
    EMPTY
  );

  return { reviews: data.reviews, averageRating: data.averageRating, loading, error };
}

const EMPTY_LIST: Review[] = [];
const MODERATION_KEY = ['reviews', 'moderation'] as const;

/** Tous les avis et leur modération — espace administratrice. */
export function useReviewModeration() {
  const { data: reviews, loading, error, refresh } = useResource(
    MODERATION_KEY,
    () => reviewService.getAllForModeration(),
    EMPTY_LIST
  );
  const write = useCacheWriter<Review[]>(MODERATION_KEY, EMPTY_LIST);

  const moderate = async (id: string, status: Exclude<ReviewStatus, 'pending'>) => {
    const updated = await reviewService.moderate(id, status);
    write((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  const remove = async (id: string) => {
    await reviewService.delete(id);
    write((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    reviews,
    pending: reviews.filter((r) => r.status === 'pending'),
    loading,
    error,
    refresh,
    moderate,
    remove,
  };
}
