import { motion } from 'framer-motion';
import {
  TrendingUp,
  CalendarDays,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointments, clients, formatAriary, statusColors, statusLabels } from '@/lib/data';

const revenueData = [
  { mois: 'Jan', montant: 1850000 },
  { mois: 'Fév', montant: 2100000 },
  { mois: 'Mar', montant: 1950000 },
  { mois: 'Avr', montant: 2400000 },
  { mois: 'Mai', montant: 2750000 },
  { mois: 'Juin', montant: 2600000 },
  { mois: 'Juil', montant: 2980000 },
];

const popularServices = [
  { name: 'Vernis semi-permanent', value: 38 },
  { name: 'Manucure russe', value: 24 },
  { name: 'Nail Art', value: 18 },
  { name: 'Pédicure spa', value: 12 },
  { name: 'Prothèses', value: 8 },
];

const appointmentsByMonth = [
  { mois: 'Jan', rdv: 42 },
  { mois: 'Fév', rdv: 48 },
  { mois: 'Mar', rdv: 45 },
  { mois: 'Avr', rdv: 55 },
  { mois: 'Mai', rdv: 62 },
  { mois: 'Juin', rdv: 58 },
  { mois: 'Juil', rdv: 67 },
];

const PIE_COLORS = ['hsl(340 55% 62%)', 'hsl(40 55% 62%)', 'hsl(24 30% 70%)', 'hsl(200 30% 70%)', 'hsl(320 40% 72%)'];

const stats = [
  {
    label: "CA du jour",
    value: formatAriary(190000),
    delta: '+12%',
    up: true,
    icon: Wallet,
  },
  {
    label: "CA du mois",
    value: formatAriary(2980000),
    delta: '+8%',
    up: true,
    icon: TrendingUp,
  },
  {
    label: "Rendez-vous aujourd'hui",
    value: '4',
    delta: '+2',
    up: true,
    icon: CalendarDays,
  },
  {
    label: 'Clientes',
    value: String(clients.length),
    delta: '+3',
    up: true,
    icon: Users,
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Dashboard() {
  const todayAppointments = appointments
    .filter((a) => a.status !== 'cancelled')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenue ! Voici un aperçu de votre activité aujourd'hui.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/60 shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      s.up ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {s.delta}
                  </span>
                </div>
                <p className="mt-4 text-xl font-semibold sm:text-2xl">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Panier moyen */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 shadow-soft">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Panier moyen</p>
              <p className="mt-1 font-display text-3xl font-semibold text-primary">
                {formatAriary(44500)}
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </span>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Évolution du chiffre d'affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(340 55% 62%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(340 55% 62%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    formatter={(v: number) => formatAriary(v)}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                    }}
                  />
                  <Area type="monotone" dataKey="montant" stroke="hsl(340 55% 62%)" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Prestations les plus populaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={popularServices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {popularServices.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--card))',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Rendez-vous par mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={appointmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Bar dataKey="rdv" radius={[8, 8, 0, 0]} fill="hsl(40 55% 62%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's appointments */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Rendez-vous à venir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayAppointments.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                    {a.clientName[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.serviceName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {a.time}
                  </span>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${statusColors[a.status]}`}>
                    {statusLabels[a.status]}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
