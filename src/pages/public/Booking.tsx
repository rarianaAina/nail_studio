import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarHeart,
  Check,
  Clock,
  ArrowLeft,
  ArrowRight,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { services, timeSlots, formatAriary } from '@/lib/data';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4 | 5;

const stepsMeta = [
  { n: 1, label: 'Prestation' },
  { n: 2, label: 'Date' },
  { n: 3, label: 'Créneau' },
  { n: 4, label: 'Vos infos' },
  { n: 5, label: 'Confirmation' },
] as const;

export default function Booking() {
  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [info, setInfo] = useState({ name: '', phone: '', email: '' });

  const service = useMemo(() => services.find((s) => s.id === serviceId), [serviceId]);

  const minDate = new Date().toISOString().slice(0, 10);

  const canNext =
    (step === 1 && !!serviceId) ||
    (step === 2 && !!date) ||
    (step === 3 && !!time) ||
    (step === 4 && info.name && info.phone && info.email);

  const next = () => canNext && setStep((s) => Math.min(5, s + 1) as Step);
  const prev = () => setStep((s) => Math.max(1, s - 1) as Step);

  return (
    <div className="min-h-screen gradient-rose pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur">
            <CalendarHeart className="h-3.5 w-3.5" /> Réservation
          </Badge>
          <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
            Prendre rendez-vous
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">
            Réservez votre créneau en quelques étapes simples.
          </p>
        </motion.div>

        {/* Stepper */}
        <div className="mt-10 flex items-center justify-center">
          <div className="flex w-full max-w-2xl items-center justify-between">
            {stepsMeta.map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-semibold transition-all',
                      step === s.n
                        ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                        : step > s.n
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                  </div>
                  <span
                    className={cn(
                      'mt-2 hidden text-xs font-medium sm:block',
                      step >= s.n ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stepsMeta.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 flex-1 rounded-full transition-colors',
                      step > s.n ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="mt-10 border-border/60 bg-card/90 shadow-soft backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1 — Service */}
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl font-semibold">Choisissez une prestation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sélectionnez le soin que vous souhaitez réserver.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setServiceId(s.id)}
                        className={cn(
                          'flex items-center gap-4 rounded-2xl border p-3 text-left transition-all',
                          serviceId === s.id
                            ? 'border-primary bg-primary/5 shadow-glow'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        <img src={s.image} alt={s.name} className="h-16 w-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{s.name}</p>
                            {serviceId === s.id && (
                              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{s.duration} min</p>
                          <p className="mt-1 text-sm font-semibold text-primary">{formatAriary(s.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Date */}
              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl font-semibold">Choisissez une date</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sélectionnez le jour de votre rendez-vous.
                  </p>
                  <div className="mt-6 mx-auto max-w-md">
                    <Input
                      type="date"
                      min={minDate}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-14 rounded-2xl text-lg"
                    />
                    <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {Array.from({ length: 14 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const iso = d.toISOString().slice(0, 10);
                        const isSunday = d.getDay() === 0;
                        return (
                          <button
                            key={i}
                            disabled={isSunday}
                            onClick={() => setDate(iso)}
                            className={cn(
                              'flex flex-col items-center rounded-xl border py-2 text-xs transition-all disabled:opacity-30',
                              date === iso
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:border-primary/40'
                            )}
                          >
                            <span className="text-[10px] uppercase">
                              {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </span>
                            <span className="font-semibold">{d.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — Time */}
              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl font-semibold">Choisissez un créneau</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Créneaux disponibles pour le{' '}
                    {new Date(date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                    .
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {timeSlots.map((t, i) => {
                      const taken = i % 7 === 0;
                      return (
                        <button
                          key={t}
                          disabled={taken}
                          onClick={() => setTime(t)}
                          className={cn(
                            'flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm transition-all disabled:opacity-30 disabled:line-through',
                            time === t
                              ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                              : 'border-border hover:border-primary/40'
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" /> {t}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 4 — Info */}
              {step === 4 && (
                <motion.div
                  key="s4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="font-display text-2xl font-semibold">Vos informations</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pour confirmer votre rendez-vous.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        value={info.name}
                        onChange={(e) => setInfo({ ...info, name: e.target.value })}
                        placeholder="Votre nom"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        value={info.phone}
                        onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                        placeholder="+261 ..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={info.email}
                        onChange={(e) => setInfo({ ...info, email: e.target.value })}
                        placeholder="vous@email.com"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5 — Confirmation */}
              {step === 5 && (
                <motion.div
                  key="s5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary"
                  >
                    <PartyPopper className="h-9 w-9" />
                  </motion.div>
                  <h2 className="mt-6 font-display text-3xl font-semibold">
                    Réservation confirmée !
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Merci {info.name.split(' ')[0]} ! Nous avons bien reçu votre
                    demande. Un email de confirmation vous a été envoyé.
                  </p>

                  <Card className="mt-8 border-border/60 bg-secondary/40 text-left">
                    <CardContent className="space-y-3 p-6 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prestation</span>
                        <span className="font-medium">{service?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">
                          {new Date(date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Heure</span>
                        <span className="font-medium">{time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Durée</span>
                        <span className="font-medium">{service?.duration} min</span>
                      </div>
                      <div className="flex justify-between border-t border-border/60 pt-3">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold text-primary">
                          {service ? formatAriary(service.price) : ''}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild size="lg" variant="outline" className="rounded-full">
                      <Link to="/">Retour à l'accueil</Link>
                    </Button>
                    <Button asChild size="lg" className="rounded-full">
                      <Link to="/prestations">
                        <Sparkles className="mr-2 h-4 w-4" /> Réserver une autre prestation
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Nav buttons */}
            {step < 5 && (
              <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
                <Button
                  variant="ghost"
                  onClick={prev}
                  disabled={step === 1}
                  className="rounded-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <Button onClick={next} disabled={!canNext} className="rounded-full">
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
