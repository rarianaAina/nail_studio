import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, BadgeCheck, MessageSquareHeart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReviews } from '@/hooks/useReviews';
import { useNailServices } from '@/hooks/useNailServices';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('flex gap-0.5 text-primary', className)} aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('h-4 w-4', i <= rating ? 'fill-current' : 'opacity-25')} />
      ))}
    </span>
  );
}

export default function Reviews() {
  const { reviews, averageRating, loading } = useReviews();
  const { services } = useNailServices();
  const [serviceId, setServiceId] = useState<string>('');

  // Seules les prestations réellement commentées sont proposées : un filtre qui
  // ne renvoie jamais rien n'a pas d'intérêt.
  const filterable = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach((r) => r.serviceIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
    return services
      .filter((s) => counts.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, count: counts.get(s.id) ?? 0 }));
  }, [reviews, services]);

  const filtered = useMemo(
    () => (serviceId ? reviews.filter((r) => r.serviceIds.includes(serviceId)) : reviews),
    [reviews, serviceId]
  );

  const filteredAverage = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round((filtered.reduce((s, r) => s + r.rating, 0) / filtered.length) * 10) / 10;
  }, [filtered]);

  return (
    <div>
      <section className="gradient-rose pt-32 pb-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge
              variant="secondary"
              className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur"
            >
              <MessageSquareHeart className="h-3.5 w-3.5" /> Avis
            </Badge>
            <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
              Ce qu'en disent nos clientes
            </h1>
            {reviews.length > 0 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <Stars rating={Math.round(averageRating)} className="scale-110" />
                <span className="font-display text-2xl font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-foreground/60">
                  sur {reviews.length} avis
                </span>
              </div>
            )}
            <p className="mx-auto mt-4 max-w-xl text-sm text-foreground/70">
              Chaque avis provient d'une cliente ayant réellement eu un rendez-vous au salon.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {filterable.length > 1 && (
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setServiceId('')}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-all',
                  serviceId === ''
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/40'
                )}
              >
                Toutes ({reviews.length})
              </button>
              {filterable.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm transition-all',
                    serviceId === s.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {s.name} ({s.count})
                </button>
              ))}
            </div>
          )}

          {serviceId && filtered.length > 0 && (
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Moyenne pour cette prestation :{' '}
              <span className="font-semibold text-foreground">{filteredAverage.toFixed(1)}</span> sur 5
            </p>
          )}

          {loading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Chargement des avis…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 py-16 text-center text-sm text-muted-foreground">
              {reviews.length === 0
                ? 'Aucun avis publié pour le moment.'
                : 'Aucun avis pour cette prestation.'}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((r) => (
                <motion.div key={r.id} {...fadeUp}>
                  <Card className="h-full border-border/60 shadow-soft">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                        </div>
                        <Stars rating={r.rating} />
                      </div>

                      {r.service && (
                        <p className="mt-2 text-xs text-primary">{r.service}</p>
                      )}

                      <Quote className="mt-3 h-4 w-4 text-primary/40" />
                      <p className="mt-1 flex-1 text-sm text-foreground/80">{r.comment}</p>

                      {r.imageUrls.length > 0 && (
                        <div
                          className={cn(
                            'mt-3 grid gap-2',
                            r.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                          )}
                        >
                          {r.imageUrls.map((url, i) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`Réalisation ${i + 1} partagée par ${r.name}`}
                                loading="lazy"
                                className={cn(
                                  'w-full rounded-xl border border-border/60 object-cover transition-transform hover:scale-[1.02]',
                                  r.imageUrls.length === 1 ? 'h-40' : 'h-28'
                                )}
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {r.verified && (
                        <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Cliente vérifiée
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
