import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Sparkles, CalendarHeart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { formatAriary } from '@/utils';
import { useNailServices } from '@/hooks/useNailServices';
import { useActiveConfig } from '@/hooks/useActiveConfig';
import type { Service } from '@/types';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

// ✅ Composant ServiceCard avec carousel d'images
const ServiceCard = ({ service }: { service: Service }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = service.additionalImages && service.additionalImages.length > 0 
    ? [service.image, ...service.additionalImages] 
    : [service.image];
  const totalImages = allImages.length;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  // Fonction pour afficher le prix ou "Devis"
  const displayPrice = (price: number) => {
    return price === 0 ? 'Devis' : formatAriary(price);
  };

  // // Fonction pour gérer le clic sur la carte
  // const handleCardClick = () => {
  //   // Rediriger vers la page de réservation si nécessaire
  //   // Ou ne rien faire si la carte n'est pas cliquable
  // };

  return (
    <Card className="group h-full overflow-hidden border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden group/image">
        <img 
          src={allImages[currentImageIndex]} 
          alt={service.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        
        {/* Indicateur de position */}
        {totalImages > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {allImages.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  'h-1 w-3 rounded-full transition-all',
                  idx === currentImageIndex ? 'bg-white w-5' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}

        {/* Flèches de navigation */}
        {totalImages > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 z-20">
            <button
              type="button"
              onClick={prevImage}
              className="opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-1.5 text-white hover:scale-110 transform transition-transform"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-1.5 text-white hover:scale-110 transform transition-transform"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Badge du nombre d'images supplémentaires */}
        {service.additionalImages && service.additionalImages.length > 0 && (
          <Badge className="absolute right-3 top-3 gap-1 rounded-full bg-black/60 text-white border-0 z-10">
            <span className="text-xs">+{service.additionalImages.length}</span>
          </Badge>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent pointer-events-none" />
        
        {service.popular && (
          <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow z-10">
            <Sparkles className="h-3 w-3" /> Populaire
          </Badge>
        )}
        
        <Badge 
          className="absolute top-3 rounded-full bg-white/90 text-foreground shadow z-10"
          style={{ right: service.additionalImages && service.additionalImages.length > 0 ? '48px' : '12px' }}
        >
          {service.category}
        </Badge>
      </div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold">{service.name}</h3>
          <span className="whitespace-nowrap text-lg font-semibold text-primary">
            {displayPrice(service.price)}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {service.duration} min
          </span>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/reservation"><CalendarHeart className="mr-1.5 h-3.5 w-3.5" /> Réserver</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Services() {
  const { services } = useNailServices();
  const { categories } = useActiveConfig();
  const [active, setActive] = useState<string>('Toutes');

  const allCategories = useMemo(() => ['Toutes', ...categories], [categories]);

  const filtered = useMemo(
    () => (active === 'Toutes' ? services : services.filter((s) => s.category === active)),
    [services, active]
  );

  return (
    <div>
      <section className="gradient-rose pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Nos prestations
            </Badge>
            <h1 className="font-display text-5xl font-semibold text-foreground sm:text-6xl">Des soins pour chaque envie</h1>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/70">
              Explorez notre carte de prestations, des classiques aux créations les plus audacieuses.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto pb-2">
            {allCategories.map((c) => (
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
              <motion.div key={s.id} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <ServiceCard service={s} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}