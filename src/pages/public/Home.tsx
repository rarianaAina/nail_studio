import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  CalendarHeart,
  Sparkles,
  Award,
  Clock,
  Phone,
  MapPin,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatAriary, formatDuration } from '@/utils';
import { useNailServices } from '@/hooks/useNailServices';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { useSpecialInfos } from '@/hooks/useSpecialInfos';
import { useReviews } from '@/hooks/useReviews';
import { cn } from '@/utils/cn';
import type { Service } from '@/types';
import Seo from '@/components/Seo';

const LOGO_URL = 'https://tzgcyehdjgqxljjttflj.supabase.co/storage/v1/object/public/images/logos/logo.webp';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6 },
};

// ✅ Fonction pour formater la durée (ex: 85 → "1h25")
// ✅ Composant ServiceCard avec carousel d'images
const ServiceCard = ({ service }: { service: Service }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = service.additionalImages && service.additionalImages.length > 0 
    ? [service.image, ...service.additionalImages] 
    : [service.image];
  const totalImages = allImages.length;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  return (
    <Card className="group h-full overflow-hidden border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden group/image">
        <img
          src={allImages[currentImageIndex]}
          alt={service.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        
        {/* Indicateur de position */}
        {totalImages > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
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
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-1.5 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-1.5 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Badge du nombre d'images supplémentaires */}
        {service.additionalImages && service.additionalImages.length > 0 && (
          <Badge className="absolute right-3 top-3 gap-1 rounded-full bg-black/60 text-white border-0">
            <span className="text-xs">+{service.additionalImages.length}</span>
          </Badge>
        )}

        {service.popular && (
          <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow">
            <Sparkles className="h-3 w-3" /> Populaire
          </Badge>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{service.name}</h2>
          <span className="text-sm font-semibold text-primary">
            {service.price === 0 ? 'Devis' : formatAriary(service.price)}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {service.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(service.duration)}
          </span>
          <Button asChild size="sm" variant="secondary" className="rounded-full">
            <Link to="/reservation">Réserver</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const { services } = useNailServices();
  const { settings } = useSettings();
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const { infos: specialInfos, loading: loadingInfos } = useSpecialInfos();
  const { reviews, averageRating } = useReviews();

  const salonInfo = settings || {
    name: 'Harrys Studio',
    tagline: "L'art des ongles, sublimé",
    address: '12 Rue Jean-Jaurès, Analakely, Antananarivo 101, Madagascar',
    phone: '+261 34 12 345 67',
    whatsapp: '+261 34 12 345 67',
    facebook: 'https://facebook.com/nida.nail.studio',
    instagram: 'https://instagram.com/nida.nail.studio',
    email: 'contact@nida-nail.mg',
    hours: [
      { day: 'Lundi', open: '09:00', close: '18:00' },
      { day: 'Mardi', open: '09:00', close: '18:00' },
      { day: 'Mercredi', open: '09:00', close: '18:00' },
      { day: 'Jeudi', open: '09:00', close: '18:00' },
      { day: 'Vendredi', open: '09:00', close: '19:00' },
      { day: 'Samedi', open: '09:00', close: '19:00' },
      { day: 'Dimanche', open: '00:00', close: '00:00', closed: true },
    ],
  };

  // Récupérer les images de la galerie
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('id, title, category, image')
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        setGalleryItems(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement de la galerie:', error);
      } finally {
        setLoadingGallery(false);
      }
    };

    fetchGallery();
  }, []);

  return (
    <div className="overflow-hidden">
      <Seo
        title="Salon d'onglerie — pose de gel, manucure et nail art"
        description="Salon d'onglerie : pose de gel, semi-permanent, manucure, beauté des pieds et nail art. Réservez votre rendez-vous en ligne en quelques minutes."
      />
      {/* HERO */}
      <section className="relative min-h-[92vh] gradient-rose">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-32 bottom-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" /> Salon d'onglerie haut de gamme
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-balance text-foreground sm:text-6xl lg:text-7xl">
              L'art des ongles,
              <span className="block italic text-primary">sublimé avec {salonInfo.name}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-foreground/70 lg:mx-0">
              Des mains soignées, des ongles sublimes. Découvrez un univers de
              raffinement où chaque geste est pensé pour révéler votre beauté.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="rounded-full px-7 shadow-glow">
                <Link to="/reservation">
                  <CalendarHeart className="mr-2 h-4 w-4" /> Prendre rendez-vous
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-white/60 px-7 backdrop-blur">
                <Link to="/prestations">Découvrir nos prestations</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center justify-center gap-6 lg:justify-start">
              <div className="flex -space-x-3">
                <Link to="/">
                  <img
                    src={LOGO_URL}
                    alt="Harrys Studio Logo"
                    className="h-10 w-10 rounded-full border-2 border-white object-cover cursor-pointer transition-transform hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
                {[3997389, 3997391, 704815].map((id) => (
                  <img
                    key={id}
                    src={`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop`}
                    alt="Cliente"
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Plusieurs clientes satisfaites
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-glow ring-1 ring-primary/10">
              <img
                src="https://tzgcyehdjgqxljjttflj.supabase.co/storage/v1/object/public/images/services/1785598830482-uymrlg1.webp"
                alt="Réalisation Harrys Studio"
                className="h-full w-full object-cover"
                fetchPriority="high"
                loading="eager"
                decoding="sync"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -left-4 top-12 rounded-2xl bg-white/90 p-3 shadow-soft backdrop-blur sm:-left-8"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Award className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Produits premium</p>
                  <p className="text-[13px] text-muted-foreground font-semibold">SANS TPO, SANS HEMA</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -right-4 bottom-16 rounded-2xl bg-white/90 p-3 shadow-soft backdrop-blur sm:-right-8"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Réservation 24/7</p>
                  <p className="text-[10px] text-muted-foreground">En ligne, simple</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION INFORMATIONS SPÉCIALES */}
      {!loadingInfos && specialInfos.length > 0 && (
        <section className="relative -mt-10 pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specialInfos.map((info, index) => (
                <motion.div
                  key={info.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="rounded-2xl bg-white/80 backdrop-blur-sm border border-primary/10 p-5 shadow-soft hover:shadow-glow transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <h2 className="font-display text-base font-semibold">{info.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{info.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NOS PRESTATIONS */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
                Nos prestations
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
                Des soins pour chaque envie
              </h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/prestations">
                Voir tout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((s, i) => (
              <motion.div
                key={s.id}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <ServiceCard service={s} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERIE */}
      <section className="bg-secondary/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Galerie
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
              Nos plus belles réalisations
            </h2>
          </motion.div>

          {loadingGallery ? (
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-2xl bg-secondary"
                />
              ))}
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="mt-14 text-center text-muted-foreground">
              <p>Aucune image dans la galerie pour le moment.</p>
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {galleryItems.slice(0, 8).map((g, i) => (
                <motion.div
                  key={g.id}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl shadow-soft aspect-square"
                >
                  <img
                    src={g.image}
                    alt={g.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="p-4 text-white">
                      <p className="text-xs uppercase tracking-wider text-white/80">{g.category}</p>
                      <p className="font-display text-lg font-semibold">{g.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AVIS — n'apparaît qu'une fois des avis publiés */}
      {reviews.length > 0 && (
        <section className="bg-secondary/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
                Elles en parlent
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
                Avis de nos clientes
              </h2>
              {averageRating > 0 && (
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="flex gap-0.5 text-primary">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn('h-4 w-4', n <= Math.round(averageRating) ? 'fill-current' : 'opacity-30')}
                      />
                    ))}
                  </span>
                  <strong className="text-foreground">{averageRating.toFixed(1)}</strong>
                  sur {reviews.length} avis
                </p>
              )}
            </motion.div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((r, i) => (
                <motion.div
                  key={r.id}
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.4) }}
                  className="flex flex-col rounded-2xl border border-border/60 bg-background p-6 shadow-soft"
                >
                  <div className="flex gap-0.5 text-primary">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn('h-4 w-4', n <= r.rating ? 'fill-current' : 'opacity-25')} />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm italic text-foreground/80">« {r.comment} »</p>
                  {r.imageUrls.length > 0 && (
                    <img
                      src={r.imageUrls[0]}
                      alt={`Réalisation partagée par ${r.name}`}
                      loading="lazy"
                      className="mt-4 h-32 w-full rounded-xl object-cover"
                    />
                  )}
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="text-sm font-medium">{r.name}</p>
                    {r.service && <p className="text-xs text-muted-foreground">{r.service}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COORDONNÉES */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
                Coordonnées
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-foreground">
                Venez nous rencontrer
              </h2>
              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">{salonInfo.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">{salonInfo.phone}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}