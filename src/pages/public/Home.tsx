import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarHeart,
  Sparkles,
  Heart,
  Award,
  Leaf,
  Clock,
  Phone,
  MapPin,
  Star,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { services, reviews, galleryItems, salonInfo, formatAriary } from '@/lib/data';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6 },
};

export default function Home() {
  return (
    <div className="overflow-hidden">
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
              <Sparkles className="h-3.5 w-3.5" /> Salon d'onglerie haut de gamme • Antananarivo
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-balance text-foreground sm:text-6xl lg:text-7xl">
              L'art des ongles,
              <span className="block italic text-primary">sublimé avec élégance</span>
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
            <div className="mt-10 flex items-center justify-center gap-4 sm:gap-6 lg:justify-start">
              <div className="flex -space-x-3">
                {[3997389, 3997391, 704815].map((id) => (
                  <img
                    key={id}
                    src={`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop`}
                    alt="Cliente"
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
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
                  +450 clientes satisfaites
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
                src="https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=900&h=1120&fit=crop"
                alt="Réalisation Nida Nail Studio"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute left-2 top-12 rounded-2xl bg-white/90 p-3 shadow-soft backdrop-blur sm:-left-8"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Award className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold">Produits premium</p>
                  <p className="text-[10px] text-muted-foreground">Vegan & cruelty-free</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute right-2 bottom-16 rounded-2xl bg-white/90 p-3 shadow-soft backdrop-blur sm:-right-8"
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

      {/* PRÉSENTATION */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Notre maison
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
              Un écrin dédié à la beauté de vos mains
            </h2>
            <p className="mt-5 text-foreground/70">
              Chez Nida Nail Studio, nous croyons que des ongles soignés sont
              une signature de style. Notre salon vous accueille dans une ambiance
              raffinée et apaisante, où chaque détail est pensé pour votre
              bien-être. Notre équipe de prothésistes ongulaires diplômées allie
              expertise technique et sens artistique pour sublimer vos mains.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '8', l: "années d'expérience" },
              { n: '450+', l: 'clientes fidèles' },
              { n: '60+', l: 'teintes disponibles' },
              { n: '4.9/5', l: 'note moyenne' },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-soft"
              >
                <p className="font-display text-4xl font-semibold text-primary">{s.n}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI NOUS CHOISIR */}
      <section className="bg-secondary/40 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Pourquoi nous choisir
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
              Une expérience beauté unique
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Award,
                title: 'Expertise certifiée',
                text: "Des prothésistes diplômées et formées aux dernières techniques internationales.",
              },
              {
                icon: Leaf,
                title: 'Produits premium',
                text: "Vernis et gels vegan, sans danger pour vos ongles ni pour l'environnement.",
              },
              {
                icon: Sparkles,
                title: 'Hygiène irréprochable',
                text: "Stérilisation aux normes hospitalières et matériel à usage unique.",
              },
              {
                icon: Heart,
                title: 'Accueil chaleureux',
                text: "Une ambiance cosy, thé offert, musique douce. Vous êtes notre priorité.",
              },
              {
                icon: CalendarHeart,
                title: 'Réservation flexible',
                text: "Réservez en ligne 24/7, modifiez ou annulez en quelques clics.",
              },
              {
                icon: Check,
                title: 'Satisfaction garantie',
                text: "Retouches offertes sous 48h si le résultat ne vous convient pas.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Card className="group h-full border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
                  <CardContent className="p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                <Card className="group h-full overflow-hidden border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {s.popular && (
                      <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow">
                        <Sparkles className="h-3 w-3" /> Populaire
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-semibold">{s.name}</h3>
                      <span className="text-sm font-semibold text-primary">
                        {formatAriary(s.price)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> {s.duration} min
                      </span>
                      <Button asChild size="sm" variant="secondary" className="rounded-full">
                        <Link to="/reservation">Réserver</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {galleryItems.slice(0, 8).map((g, i) => (
              <motion.div
                key={g.id}
                {...fadeUp}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl shadow-soft ${
                  i % 5 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''
                }`}
              >
                <div className={`aspect-square ${i % 5 === 0 ? 'sm:aspect-auto sm:h-full' : ''}`}>
                  <img
                    src={g.image}
                    alt={g.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="p-4 text-white">
                    <p className="text-xs uppercase tracking-wider text-white/80">{g.category}</p>
                    <p className="font-display text-lg font-semibold">{g.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/galerie">
                Voir toute la galerie <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AVIS */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Avis clientes
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
              Elles nous font confiance
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Card className="h-full border-border/60 bg-card shadow-soft">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-center gap-1 text-accent">
                      {[...Array(r.rating)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 flex-1 text-sm text-foreground/80">"{r.comment}"</p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-display text-lg font-semibold text-primary">
                        {r.name[0]}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/80 px-6 py-16 text-center text-primary-foreground shadow-glow sm:px-12"
        >
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">
              Prête à révéler votre élégance ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
              Réservez votre créneau en quelques secondes. Notre équipe vous
              confirmera votre rendez-vous dans les meilleurs délais.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-white px-6 text-primary hover:bg-white/90 sm:px-7">
                <Link to="/reservation">
                  <CalendarHeart className="mr-2 h-4 w-4" /> Prendre rendez-vous
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white sm:px-7">
                <a href={`tel:${salonInfo.phone}`}>
                  <Phone className="mr-2 h-4 w-4" /> <span className="text-sm sm:text-base">{salonInfo.phone}</span>
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* COORDONNÉES + HORAIRES */}
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

            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
                Horaires
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-foreground">
                Heures d'ouverture
              </h2>
              <Card className="mt-8 border-border/60 shadow-soft">
                <CardContent className="divide-y divide-border/60 p-2">
                  {salonInfo.hours.map((h) => (
                    <div
                      key={h.day}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="font-medium">{h.day}</span>
                      <span className={h.closed ? 'text-destructive' : 'text-muted-foreground'}>
                        {h.closed ? 'Fermé' : `${h.open} — ${h.close}`}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
