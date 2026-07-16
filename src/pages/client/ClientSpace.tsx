import { useMemo } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { appointments, services, formatAriary, statusColors, statusLabels } from '@/lib/data';
import { cn } from '@/lib/utils';

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

  const myAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.email === 'hanta.r@email.mg' || a.clientName === user?.name)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [user]
  );

  const upcoming = myAppointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );
  const past = myAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );

  const totalSpent = myAppointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);
  const visits = myAppointments.filter((a) => a.status === 'completed').length;
  const loyaltyPoints = visits * 50;

  const onLogout = () => {
    logout();
    navigate('/');
  };

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
              <p className="font-display text-lg font-semibold leading-tight">Nida</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Mon espace
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Bonjour, <span className="font-medium text-foreground">{user?.name.split(' ')[0]}</span>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">
              {user?.name[0]}
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
              <h1 className="font-display text-3xl font-semibold sm:text-4xl">{user?.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Membre depuis juillet 2024
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
            { label: 'Points fidélité', value: String(loyaltyPoints), icon: Gift, color: 'text-emerald-500' },
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
                      {loyaltyPoints} points • Plus que {Math.max(0, 500 - loyaltyPoints)} points avant votre soin offert
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
                const Icon = statusIcon[a.status];
                return (
                  <Card key={a.id} className="border-border/60 shadow-soft transition-all hover:shadow-glow">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-medium">{a.serviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })} à {a.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-sm font-semibold text-primary">{formatAriary(a.price)}</span>
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs', statusColors[a.status])}>
                          {statusLabels[a.status]}
                        </span>
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
                  past.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium">{a.serviceName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })} à {a.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-primary">{formatAriary(a.price)}</span>
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-xs', statusColors[a.status])}>
                          {statusLabels[a.status]}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommended services */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <h2 className="font-display text-2xl font-semibold">Recommandé pour vous</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.filter((s) => s.popular).slice(0, 3).map((s) => (
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
                    <span className="text-sm font-semibold text-primary">{formatAriary(s.price)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                  <Button asChild size="sm" variant="secondary" className="mt-3 w-full rounded-full">
                    <Link to="/reservation">Réserver</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
