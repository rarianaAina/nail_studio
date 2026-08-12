import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Check, X, Trash2, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useReviewModeration } from '@/hooks/useReviews';
import type { Review, ReviewStatus } from '@/types';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

const FILTERS: Array<{ key: ReviewStatus | 'all'; label: string }> = [
  { key: 'pending', label: 'À relire' },
  { key: 'approved', label: 'Publiés' },
  { key: 'rejected', label: 'Refusés' },
  { key: 'all', label: 'Tous' },
];

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: 'border-amber-300 bg-amber-50 text-amber-700',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-300 bg-rose-50 text-rose-700',
};

const STATUS_TEXT: Record<ReviewStatus, string> = {
  pending: 'En attente',
  approved: 'Publié',
  rejected: 'Refusé',
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('h-3.5 w-3.5', n <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/30')}
        />
      ))}
    </span>
  );
}

export default function Reviews() {
  const { reviews, pending, loading, moderate, remove } = useReviewModeration();
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const shown: Review[] = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);

  const act = async (id: string, action: () => Promise<unknown>, message: string) => {
    setBusy(id);
    try {
      await action();
      toast.success(message);
    } catch {
      toast.error('L\'opération a échoué.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Avis clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque avis est relu avant d'apparaître sur le site. Seules les clientes ayant eu un
          rendez-vous confirmé peuvent en déposer.
        </p>
      </div>

      {pending.length > 0 && (
        <Card className="border-amber-300/60 bg-amber-50/50 shadow-soft">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="text-sm">
              <strong>{pending.length}</strong> avis {pending.length > 1 ? 'attendent' : 'attend'} votre
              relecture.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.key === 'all' ? reviews.length : reviews.filter((r) => r.status === f.key).length;
          return (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setFilter(f.key)}
            >
              {f.label} <span className="ml-1.5 opacity-70">{count}</span>
            </Button>
          );
        })}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Chargement…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-14 text-center">
          <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === 'pending' ? 'Aucun avis en attente de relecture.' : 'Aucun avis dans cette catégorie.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className="border-border/60 shadow-soft">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{r.name}</p>
                        <Badge variant="outline" className={cn('text-xs', STATUS_STYLE[r.status])}>
                          {STATUS_TEXT[r.status]}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Stars rating={r.rating} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.date)}
                          {r.service ? ` · ${r.service}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="whitespace-pre-line text-sm text-foreground/85">{r.comment}</p>

                  {r.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {r.imageUrls.map((url, i) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Photo ${i + 1} jointe par ${r.name}`}
                            loading="lazy"
                            className="h-28 w-28 rounded-xl border border-border/60 object-cover transition-transform hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    {r.status !== 'approved' && (
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, () => moderate(r.id, 'approved'), 'Avis publié.')}
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Publier
                      </Button>
                    )}
                    {r.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={busy === r.id}
                        onClick={() => act(r.id, () => moderate(r.id, 'rejected'), 'Avis refusé.')}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        {r.status === 'approved' ? 'Retirer du site' : 'Refuser'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-muted-foreground hover:text-rose-600"
                      disabled={busy === r.id}
                      onClick={() => {
                        if (confirm(`Supprimer définitivement l'avis de ${r.name} ?`)) {
                          act(r.id, () => remove(r.id), 'Avis supprimé.');
                        }
                      }}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
