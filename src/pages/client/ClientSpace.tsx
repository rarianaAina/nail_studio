import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarHeart,
  CalendarPlus,
  Clock,
  Sparkles,
  Heart,
  Wallet,
  Gift,
  LogOut,
  ChevronRight,
  Star,
  CheckCircle2,
  XCircle,
  Hourglass,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { useNailServices } from '@/hooks/useNailServices';
import { useAppointmentSettings } from '@/hooks/useAppointmentSettings';
import { useLoyalty } from '@/hooks/useLoyalty';
import ReviewDialog from '@/components/client/ReviewDialog';
import { reviewService } from '@/services/reviewService';
import { formatAriary, STATUS_COLORS, STATUS_LABELS } from '@/utils';
import { getTotalPrice, getServiceNames } from '@/types';
import { cn } from '@/utils/cn';
import type { Appointment } from '@/types';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const statusIcon: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  confirmed: CheckCircle2,
  cancelled: XCircle,
  pending: Hourglass,
};

export default function ClientSpace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { appointments, updateStatus, refresh } = useAppointments();

  // Rendez-vous ouvrant droit à un avis. La règle — confirmé ou terminé, et pas
  // encore commenté — est évaluée en base, l'écran ne fait que l'afficher.
  const [reviewable, setReviewable] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState<Appointment | null>(null);

  const loadReviewable = useCallback(async () => {
    try {
      setReviewable(await reviewService.getReviewableAppointmentIds());
    } catch {
      setReviewable([]);
    }
  }, []);

  useEffect(() => { loadReviewable(); }, [loadReviewable]);
  const { services } = useNailServices();
  const { settings: appointmentSettings } = useAppointmentSettings();
  const { points: loyaltyPoints, loading: loadingPoints } = useLoyalty(user?.id);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Filtrer les rendez-vous du client connecté
  const myAppointments = useMemo(() => {
    if (!user || !appointments) return [];
    
    return appointments
      .filter((a) => {
        return a.email === user.email || a.clientName === user.name;
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [appointments, user]);

  const upcoming = myAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );
  const past = myAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );

  const totalSpent = myAppointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + getTotalPrice(a), 0);
    
  const visits = myAppointments.filter((a) => a.status === 'completed').length;

  // Vérifier si un rendez-vous peut être annulé
  const canCancelAppointment = (appointment: Appointment): { allowed: boolean; reason?: string } => {
    if (appointmentSettings?.allowCancellation === false) {
      return { allowed: false, reason: 'Les annulations ne sont pas autorisées pour le moment.' };
    }

    const now = new Date();
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const deadlineHours = appointmentSettings?.cancellationDeadlineHours ?? 24;
    
    if (appointment.status === 'cancelled') {
      return { allowed: false, reason: 'Ce rendez-vous est déjà annulé.' };
    }
    if (appointment.status === 'completed') {
      return { allowed: false, reason: 'Ce rendez-vous est déjà terminé.' };
    }
    if (hoursUntilAppointment < deadlineHours) {
      const label = appointmentSettings?.cancellationDeadlineLabel || `${deadlineHours} heures avant`;
      return { 
        allowed: false, 
        reason: `L'annulation n'est plus possible moins de ${label}.` 
      };
    }
    return { allowed: true };
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    setIsCancelling(true);
    try {
      await updateStatus(appointment.id, 'cancelled');
      toast.success(`Rendez-vous "${getServiceNames(appointment)}" annulé avec succès.`);
      setCancellingAppointment(null);
      await refresh();
    } catch (error) {
      toast.error('Une erreur est survenue lors de l\'annulation.');
    } finally {
      setIsCancelling(false);
    }
  };

  const onLogout = () => {
    logout();
    navigate('/');
  };

  // Vérifier si user existe
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md p-6">
          <p className="text-center text-muted-foreground">
            Veuillez vous connecter pour accéder à votre espace.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link to="/connexion">Se connecter</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <CalendarHeart className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-tight">Harrys Studio</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Mon espace
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Bonjour, <span className="font-medium text-foreground">{user.name.split(' ')[0]}</span>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">
              {user.name[0]}
            </span>
            <Button size="icon" variant="ghost" className="rounded-full" onClick={onLogout} title="Déconnexion">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl gradient-rose p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Bienvenue,</p>
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{user.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Cliente fidèle
              </p>
            </div>
            <Button asChild size="lg" className="rounded-full shadow-glow">
              <Link to="/reservation">
                <CalendarPlus className="mr-2 h-4 w-4" /> Prendre rendez-vous
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Rendez-vous à venir', value: String(upcoming.length), icon: Clock, color: 'text-primary' },
            { label: 'Visites totales', value: String(visits), icon: Heart, color: 'text-rose-500' },
            { label: 'Total dépensé', value: formatAriary(totalSpent), icon: Wallet, color: 'text-accent' },
            { label: 'Points fidélité', value: loadingPoints ? '...' : String(loyaltyPoints), icon: Gift, color: 'text-emerald-500' },
          ].map((s, i) => (
            <motion.div key={s.label} {...fadeUp} transition={{ delay: i * 0.08 }}>
              <Card className="border-border/60 shadow-soft">
                <CardContent className="p-5">
                  <span className={cn('grid h-11 w-11 place-items-center rounded-2xl bg-secondary', s.color)}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-2xl font-semibold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Loyalty progress */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Gift className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold">Programme fidélité</p>
                    <p className="text-sm text-muted-foreground">
                      {loadingPoints ? '...' : `${loyaltyPoints} points`} • Plus que {Math.max(0, 500 - loyaltyPoints)} points avant votre soin offert
                    </p>
                  </div>
                </div>
                <Badge className="gap-1 rounded-full bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 fill-current" /> Gold
                </Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (loyaltyPoints / 500) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming appointments */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Mes rendez-vous à venir</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/reservation">
                Réserver <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <Card className="border-dashed border-border/60">
                <CardContent className="py-10 text-center">
                  <CalendarPlus className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Aucun rendez-vous à venir. Réservez votre prochain soin !
                  </p>
                  <Button asChild className="mt-4 rounded-full">
                    <Link to="/reservation">Prendre rendez-vous</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcoming.map((a) => {
                const Icon = statusIcon[a.status] || CheckCircle2;
                const cancelInfo = canCancelAppointment(a);
                const isCancellable = cancelInfo.allowed;
                const serviceNames = getServiceNames(a);
                const totalPrice = getTotalPrice(a);

                return (
                  <Card key={a.id} className="border-border/60 shadow-soft transition-all hover:shadow-glow">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-medium">{serviceNames}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })} à {a.time}
                          </p>
                          {!isCancellable && a.status !== 'cancelled' && (
                            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {cancelInfo.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-sm font-semibold text-primary">{formatAriary(totalPrice)}</span>
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs', STATUS_COLORS[a.status])}>
                          {STATUS_LABELS[a.status]}
                        </span>
                        {isCancellable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => setCancellingAppointment(a)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </motion.div>

        {/* History */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <h2 className="font-display text-2xl font-semibold">Historique</h2>
          <Card className="mt-4 border-border/60 shadow-soft">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {past.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Aucun historique pour le moment.
                  </p>
                ) : (
                  past.map((a) => {
                    const serviceNames = getServiceNames(a);
                    const totalPrice = getTotalPrice(a);
                    return (
                      <div key={a.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">{serviceNames}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })} à {a.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {reviewable.includes(a.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setReviewing(a)}
                            >
                              <Star className="mr-1.5 h-3.5 w-3.5" /> Donner mon avis
                            </Button>
                          )}
                          <span className="text-sm font-medium text-primary">{formatAriary(totalPrice)}</span>
                          <span className={cn('rounded-full border px-2.5 py-0.5 text-xs', STATUS_COLORS[a.status])}>
                            {STATUS_LABELS[a.status]}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <ReviewDialog
          appointment={reviewing}
          onClose={() => setReviewing(null)}
          onSubmitted={loadReviewable}
        />

        {/* Recommended services */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <h2 className="font-display text-2xl font-semibold">Recommandé pour vous</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.filter((s) => s.popular).slice(0, 3).map((s) => {
              const displayPrice = s.price === 0 ? 'Devis' : formatAriary(s.price);
              return (
                <Card key={s.id} className="group overflow-hidden border-border/60 shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={s.image} alt={s.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {s.popular && (
                      <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-primary text-primary-foreground shadow">
                        <Sparkles className="h-3 w-3" /> Populaire
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                      <span className="text-sm font-semibold text-primary">{displayPrice}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                    <Button asChild size="sm" variant="secondary" className="mt-3 w-full rounded-full">
                      <Link to="/reservation">Réserver</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* AlertDialog de confirmation d'annulation */}
      <AlertDialog open={!!cancellingAppointment} onOpenChange={(open) => !open && setCancellingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'annuler votre rendez-vous pour{' '}
              <span className="font-medium text-foreground">
                {cancellingAppointment && getServiceNames(cancellingAppointment)}
              </span>{' '}
              le{' '}
              <span className="font-medium text-foreground">
                {cancellingAppointment && new Date(cancellingAppointment.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })} à {cancellingAppointment?.time}
              </span>.
              <br /><br />
              Cette action est irréversible. Souhaitez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Retour</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancellingAppointment && handleCancelAppointment(cancellingAppointment)}
              disabled={isCancelling}
            >
              {isCancelling ? 'Annulation en cours...' : 'Oui, annuler'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}