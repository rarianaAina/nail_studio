import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Sparkles, CalendarHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { services, formatAriary, type ServiceCategory } from '@/lib/data';
import { cn } from '@/lib/utils';

const categories: ('Toutes' | ServiceCategory)[] = [
  'Toutes',
  'Manucure',
  'Pédicure',
  'Vernis semi-permanent',
  'Prothèses',
  'Soins',
  'Nail Art',
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

export default function Services() {
  const [active, setActive] = useState<'Toutes' | ServiceCategory>('Toutes');

  const filtered = useMemo(
    () => (active === 'Toutes' ? services : services.filter((s) => s.category === active)),
    [active]
  );

  return (
    <div>
      {/* Header */}
      <section className="gradient-rose pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Nos prestations
            </Badge>
            <h1 className="font-display text-5xl font-semibold text-foreground sm:text-6xl">
              Des soins pour chaque envie
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              Explorez notre carte de prestations, des classiques aux créations
              les plus audacieuses. Tarifs en Ariary, durée indicative.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto pb-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all',
                  active === c
                    ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                    : 'border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-foreground'
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="group h-full overflow-hidden border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
                    {s.popular && (
                      <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow">
                        <Sparkles className="h-3 w-3" /> Populaire
                      </Badge>
                    )}
                    <Badge className="absolute right-3 top-3 rounded-full bg-white/90 text-foreground shadow">
                      {s.category}
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl font-semibold">{s.name}</h3>
                      <span className="whitespace-nowrap text-lg font-semibold text-primary">
                        {formatAriary(s.price)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> {s.duration} min
                      </span>
                      <Button asChild size="sm" className="rounded-full">
                        <Link to="/reservation">
                          <CalendarHeart className="mr-1.5 h-3.5 w-3.5" /> Réserver
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
