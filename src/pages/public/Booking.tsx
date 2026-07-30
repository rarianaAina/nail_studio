// pages/Booking.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarHeart, Check, Clock, ArrowLeft, ArrowRight, PartyPopper, Sparkles, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/cn';
import { formatAriary } from '@/utils';
import { useNailServices } from '@/hooks/useNailServices';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { useActiveConfig } from '@/hooks/useActiveConfig';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4 | 5;

const stepsMeta = [
  { n: 1, label: 'Prestation(s)' },
  { n: 2, label: 'Date' },
  { n: 3, label: 'Créneau' },
  { n: 4, label: 'Vos infos' },
  { n: 5, label: 'Confirmation' },
] as const;

export default function Booking() {
  const { services } = useNailServices();
  const { createAppointment } = useAppointments();
  const { user } = useAuth();
  const { timeSlots: configuredSlots } = useActiveConfig();
  const { paymentMethods, loading: loadingPayments } = usePaymentMethods();
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  const [step, setStep] = useState<Step>(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]); // ✅ Changé de serviceId à selectedServiceIds
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [info, setInfo] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const activePaymentMethods = useMemo(
    () => paymentMethods.filter(m => m.active),
    [paymentMethods]
  );

  // ✅ Récupérer les services sélectionnés
  const selectedServices = useMemo(
    () => services.filter(s => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  // ✅ Calculer le total
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration, 0),
    [selectedServices]
  );

  useEffect(() => {
    if (!date) { setBookedSlots([]); return; }
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('appointments')
        .select('time')
        .eq('date', date)
        .in('status', ['pending', 'confirmed']);
      if (mounted) setBookedSlots((data as { time: string }[] | null)?.map((r) => r.time) ?? []);
    })();
    return () => { mounted = false; };
  }, [date]);

  const minDate = new Date().toISOString().slice(0, 10);

  const canNext =
    (step === 1 && selectedServiceIds.length > 0) || // ✅ Au moins un service
    (step === 2 && !!date) ||
    (step === 3 && !!time) ||
    (step === 4 && !!(info.name && info.phone && info.email && paymentMethodId));

  const next = async () => {
    if (!canNext) return;
    if (step === 4) {
      setSubmitting(true);
      try {
        let clientId: string | undefined;
        if (isLoggedIn && user) {
          const { data: clientRow } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          clientId = (clientRow as { id: string } | null)?.id ?? undefined;
        }
        
        // ✅ Envoyer les IDs des services sélectionnés
        await createAppointment({
          clientId,
          clientName: info.name,
          phone: info.phone,
          email: info.email,
          serviceIds: selectedServiceIds, // ✅ Changé de serviceId à serviceIds
          date,
          time,
          paymentMethodId,
        });
        setStep(5);
      } catch (error) {
        console.error(error);
        toast.error('Une erreur est survenue. Veuillez réessayer.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep((s) => Math.min(5, s + 1) as Step);
    }
  };
  const prev = () => setStep((s) => Math.max(1, s - 1) as Step);

  // ✅ Fonction pour basculer la sélection d'un service
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <div className="min-h-screen gradient-rose pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs text-primary backdrop-blur">
            <CalendarHeart className="h-3.5 w-3.5" /> Réservation
          </Badge>
          <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">Prendre rendez-vous</h1>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">Réservez votre créneau en quelques étapes simples.</p>
        </motion.div>

        {/* Stepper */}
        <div className="mt-10 flex items-center justify-center">
          <div className="flex w-full max-w-2xl items-center justify-between">
            {stepsMeta.map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn('grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-semibold transition-all',
                    step === s.n ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                    : step > s.n ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground')}>
                    {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                  </div>
                  <span className={cn('mt-2 hidden text-xs font-medium sm:block', step >= s.n ? 'text-foreground' : 'text-muted-foreground')}>
                    {s.label}
                  </span>
                </div>
                {i < stepsMeta.length - 1 && (
                  <div className={cn('mx-2 h-0.5 flex-1 rounded-full transition-colors', step > s.n ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="mt-10 border-border/60 bg-card/90 shadow-soft backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-2xl font-semibold">Choisissez vos prestations</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sélectionnez une ou plusieurs prestations. Vous pouvez en choisir plusieurs.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {services.map((s) => {
                      const isSelected = selectedServiceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={cn(
                            'flex items-center gap-4 rounded-2xl border p-3 text-left transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-glow'
                              : 'border-border hover:border-primary/40'
                          )}
                        >
                          <img src={s.image} alt={s.name} className="h-16 w-16 rounded-xl object-cover" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{s.name}</p>
                              {isSelected && (
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                                  <Check className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{s.duration} min</p>
                            <p className="mt-1 text-sm font-semibold text-primary">{formatAriary(s.price)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ✅ Récapitulatif des services sélectionnés */}
                  {selectedServices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4"
                    >
                      <p className="font-medium text-sm">Récapitulatif</p>
                      <div className="mt-2 space-y-1">
                        {selectedServices.map(s => (
                          <div key={s.id} className="flex justify-between text-sm">
                            <span>{s.name}</span>
                            <span>{formatAriary(s.price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 border-t border-primary/20 pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span className="text-primary">{formatAriary(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Durée totale</span>
                          <span>{totalDuration} min</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-2xl font-semibold">Choisissez une date</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Sélectionnez le jour de votre rendez-vous.</p>
                  <div className="mt-6 mx-auto max-w-md">
                    <Input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className="h-14 rounded-2xl text-lg" />
                    <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {Array.from({ length: 14 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const iso = d.toISOString().slice(0, 10);
                        const isSunday = d.getDay() === 0;
                        return (
                          <button key={i} disabled={isSunday} onClick={() => setDate(iso)}
                            className={cn('flex flex-col items-center rounded-xl border py-2 text-xs transition-all disabled:opacity-30',
                              date === iso ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40')}>
                            <span className="text-[10px] uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                            <span className="font-semibold">{d.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-2xl font-semibold">Choisissez un créneau</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Créneaux disponibles pour le {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {configuredSlots.map((t) => {
                      const taken = bookedSlots.includes(t);
                      return (
                        <button key={t} disabled={taken} onClick={() => setTime(t)}
                          className={cn('flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm transition-all disabled:opacity-30 disabled:line-through',
                            time === t ? 'border-primary bg-primary text-primary-foreground shadow-glow' : 'border-border hover:border-primary/40')}>
                          <Clock className="h-3.5 w-3.5" /> {t}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-2xl font-semibold">Vos informations</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Pour confirmer votre rendez-vous.</p>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input id="name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} placeholder="Votre nom" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input id="phone" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="+33 ..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} placeholder="vous@email.com" />
                    </div>
                    
                    {/* Moyen de paiement */}
                    <div className="space-y-1.5">
                      <Label htmlFor="payment">Moyen de paiement *</Label>
                      <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Sélectionnez un moyen de paiement" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingPayments ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                            </div>
                          ) : activePaymentMethods.length === 0 ? (
                            <SelectItem value="" disabled>Aucun moyen de paiement disponible</SelectItem>
                          ) : (
                            activePaymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{method.icon || '💳'}</span>
                                  {method.label}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ✅ Récapitulatif de la commande */}
                    <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                      <p className="font-medium">Récapitulatif de votre commande</p>
                      {selectedServices.map(s => (
                        <div key={s.id} className="flex justify-between text-xs">
                          <span>{s.name}</span>
                          <span>{formatAriary(s.price)}</span>
                        </div>
                      ))}
                      <div className="mt-1 border-t border-border/60 pt-1 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatAriary(totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary">
                    <PartyPopper className="h-12 w-12" />
                  </motion.div>
                  <h2 className="mt-6 font-display text-3xl font-semibold">Rendez-vous confirmé !</h2>
                  <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
                    Votre rendez-vous pour{' '}
                    <span className="font-medium text-foreground">
                      {selectedServices.map(s => s.name).join(' + ')}
                    </span>{' '}
                    le{' '}
                    <span className="font-medium text-foreground">
                      {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {time}
                    </span>{' '}
                    a bien été enregistré.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Total : <span className="font-medium text-primary">{formatAriary(totalPrice)}</span> • 
                    Durée : <span className="font-medium">{totalDuration} min</span>
                  </p>
                  <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    {isLoggedIn ? (
                      <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/mon-espace')}>
                        <Sparkles className="mr-2 h-4 w-4" /> Retour à mon espace
                      </Button>
                    ) : (
                      <>
                        <Button asChild size="lg" className="rounded-full px-8"><Link to="/">Retour à l'accueil</Link></Button>
                        <Button asChild size="lg" variant="outline" className="rounded-full"><Link to="/mon-espace"><Sparkles className="mr-2 h-4 w-4" /> Mon espace</Link></Button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {step < 5 && (
              <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
                <Button variant="ghost" className="rounded-full" onClick={prev} disabled={step === 1}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <Button className="rounded-full" onClick={next} disabled={!canNext || submitting}>
                  {step === 4 ? (submitting ? 'Confirmation...' : 'Confirmer') : 'Suivant'}
                  {step < 4 && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}