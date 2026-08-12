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
    EMPTY_LIST,
    // Une file de modération ne doit jamais être servie depuis le cache : un
    // avis déposé après la dernière visite resterait invisible pendant toute
    // la durée de fraîcheur, et la gérante conclurait qu'il n'est pas arrivé.
    { staleTime: 0, refetchOnMount: 'always' }
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

const RATINGS_KEY = ['reviews', 'service-ratings'] as const;
const NO_RATINGS: Record<string, { average: number; total: number }> = {};

/**
 * Note moyenne par prestation, indexée par identifiant.
 *
 * Alimente les cartes de prestation sans charger les avis : seul l'agrégat
 * transite.
 */
export function useServiceRatings() {
  const { data: ratings, loading } = useResource(
    RATINGS_KEY,
    () => reviewService.getServiceRatings(),
    NO_RATINGS
  );
  return { ratings, loading };
}
