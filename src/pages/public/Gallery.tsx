import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { galleryItems } from '@/lib/data';
import { cn } from '@/lib/utils';

const categories = ['Toutes', 'Vernis', 'Nail Art', 'Prothèses', 'Manucure', 'Pédicure'];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

export default function Gallery() {
  const [active, setActive] = useState('Toutes');
  const filtered = useMemo(
    () =>
      active === 'Toutes'
        ? galleryItems
        : galleryItems.filter((g) => g.category === active),
    [active]
  );

  return (
    <div>
      <section className="gradient-rose pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Galerie
            </Badge>
            <h1 className="font-display text-5xl font-semibold text-foreground sm:text-6xl">
              Nos plus belles réalisations
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              Une sélection de créations signées Nida Nail Studio. Laissez-vous
              inspirer pour votre prochain rendez-vous.
            </p>
          </motion.div>
        </div>
      </section>

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

          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
            {filtered.map((g, i) => (
              <motion.div
                key={g.id}
                {...fadeUp}
                transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl shadow-soft"
              >
                <img
                  src={g.image}
                  alt={g.title}
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="p-4 text-white">
                    <p className="text-xs uppercase tracking-wider text-white/80">{g.category}</p>
                    <p className="font-display text-lg font-semibold">{g.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
