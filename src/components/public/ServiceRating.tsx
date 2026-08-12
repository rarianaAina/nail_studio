import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ServiceRatingProps {
  rating?: { average: number; total: number };
  className?: string;
}

/**
 * Note moyenne d'une prestation, affichée sur sa carte.
 *
 * Ne rend rien tant qu'aucun avis n'a été publié : une note vide ou « 0 étoile »
 * inspire moins confiance que l'absence de note.
 */
export default function ServiceRating({ rating, className }: ServiceRatingProps) {
  if (!rating || rating.total === 0) return null;

  return (
    <span
      className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}
      title={`${rating.average} sur 5 — ${rating.total} avis`}
    >
      <span className="flex gap-0.5 text-primary" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn('h-3 w-3', i <= Math.round(rating.average) ? 'fill-current' : 'opacity-25')}
          />
        ))}
      </span>
      <span className="font-medium text-foreground">{rating.average.toFixed(1)}</span>
      <span>({rating.total})</span>
    </span>
  );
}
