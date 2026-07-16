import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Wallet, XCircle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAriary } from '@/lib/data';

const dailyRevenue = [
  { jour: 'Lun', montant: 145000 },
  { jour: 'Mar', montant: 180000 },
  { jour: 'Mer', montant: 165000 },
  { jour: 'Jeu', montant: 210000 },
  { jour: 'Ven', montant: 245000 },
  { jour: 'Sam', montant: 290000 },
  { jour: 'Dim', montant: 0 },
];

const monthlyRevenue = [
  { mois: 'Jan', montant: 1850000 },
  { mois: 'Fév', montant: 2100000 },
  { mois: 'Mar', montant: 1950000 },
  { mois: 'Avr', montant: 2400000 },
  { mois: 'Mai', montant: 2750000 },
  { mois: 'Juin', montant: 2600000 },
  { mois: 'Juil', montant: 2980000 },
];

const topServices = [
  { name: 'Vernis semi-permanent', value: 38 },
  { name: 'Manucure russe', value: 24 },
  { name: 'Nail Art', value: 18 },
  { name: 'Pédicure spa', value: 12 },
  { name: 'Prothèses', value: 8 },
];

const cancellationRate = [
  { mois: 'Jan', taux: 5 },
  { mois: 'Fév', taux: 7 },
  { mois: 'Mar', taux: 4 },
  { mois: 'Avr', taux: 6 },
  { mois: 'Mai', taux: 3 },
  { mois: 'Juin', taux: 5 },
  { mois: 'Juil', taux: 4 },
];

const retention = [
  { mois: 'Jan', taux: 72 },
  { mois: 'Fév', taux: 75 },
  { mois: 'Mar', taux: 78 },
  { mois: 'Avr', taux: 80 },
  { mois: 'Mai', taux: 82 },
  { mois: 'Juin', taux: 85 },
  { mois: 'Juil', taux: 87 },
];

const PIE_COLORS = ['hsl(340 55% 62%)', 'hsl(40 55% 62%)', 'hsl(24 30% 70%)', 'hsl(200 30% 70%)', 'hsl(320 40% 72%)'];

const kpis = [
  { label: 'CA journalier moyen', value: formatAriary(190000), icon: Wallet, color: 'text-primary' },
  { label: 'CA mensuel', value: formatAriary(2980000), icon: TrendingUp, color: 'text-accent' },
  { label: 'Taux d\'annulation', value: '4,2%', icon: XCircle, color: 'text-rose-500' },
  { label: 'Fidélisation', value: '87%', icon: Heart, color: 'text-emerald-500' },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Statistics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Statistiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyse détaillée de la performance du salon.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} {...fadeUp} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/60 shadow-soft">
              <CardContent className="p-5">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-secondary ${k.color}`}>
                  <k.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xl font-semibold sm:text-2xl">{k.value}</p>
                <p className="text-sm text-muted-foreground">{k.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Chiffre d'affaires journalier</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="jour" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    formatter={(v: number) => formatAriary(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="montant" radius={[8, 8, 0, 0]} fill="hsl(340 55% 62%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Chiffre d'affaires mensuel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(v) => `${v / 1000000}M`} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    formatter={(v: number) => formatAriary(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Line type="monotone" dataKey="montant" stroke="hsl(40 55% 62%)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Prestations les plus vendues</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={topServices} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {topServices.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Taux d'annulation & fidélisation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={retention.map((r, i) => ({ ...r, annul: cancellationRate[i].taux }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="taux" name="Fidélisation" stroke="hsl(160 60% 45%)" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="annul" name="Annulation" stroke="hsl(0 70% 60%)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
