import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { TrendingUp, Wallet, XCircle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/hooks/useStats';
import { formatAriary } from '@/utils';

const PIE_COLORS = [
  'hsl(340 55% 62%)',
  'hsl(40 55% 62%)',
  'hsl(24 30% 70%)',
  'hsl(200 30% 70%)',
  'hsl(320 40% 72%)',
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Statistics() {
  const {
    dashboardStats,
    revenueByDay,
    revenueByMonth,
    servicePopularity,
    cancellationAndRetention,
  } = useStats();

  const dailyData = revenueByDay.map((d) => ({ jour: d.label, montant: d.value }));
  const monthlyData = revenueByMonth.map((d) => ({ mois: d.label, montant: d.value }));
  const pieData = servicePopularity.map((s) => ({ name: s.name, value: s.percentage }));
  const retentionData = cancellationAndRetention.map((d) => ({
    mois: d.label,
    taux: d.retention,
    annul: d.cancellation,
  }));

  const kpis = [
    { label: 'CA journalier moyen', value: formatAriary(dashboardStats?.dailyRevenue ?? 0), icon: Wallet, color: 'text-primary' },
    { label: 'CA mensuel', value: formatAriary(dashboardStats?.monthlyRevenue ?? 0), icon: TrendingUp, color: 'text-accent' },
    { label: "Taux d'annulation", value: `${dashboardStats?.cancellationRate?.toFixed(1) ?? '0'}%`, icon: XCircle, color: 'text-rose-500' },
    { label: 'Fidélisation', value: `${dashboardStats?.retentionRate ?? 0}%`, icon: Heart, color: 'text-emerald-500' },
  ];

  // Formatters avec un typage permissif
  const formatAriaryTooltip = (value?: ValueType): string => {
    if (typeof value === 'number') {
      return formatAriary(value);
    }
    return String(value ?? '0');
  };

  const formatCurrencyYAxis = (value?: ValueType): string => {
    if (typeof value === 'number') {
      return `${value / 1000}k`;
    }
    return String(value ?? '0');
  };

  const formatMillionsYAxis = (value?: ValueType): string => {
    if (typeof value === 'number') {
      return `${value / 1000000}M`;
    }
    return String(value ?? '0');
  };

  const formatPercentageYAxis = (value?: ValueType): string => {
    if (typeof value === 'number') {
      return `${value}%`;
    }
    return String(value ?? '0%');
  };

  const formatPercentageTooltip = (value?: ValueType): string => {
    if (typeof value === 'number') {
      return `${value}%`;
    }
    return String(value ?? '0%');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Statistiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">Analyse détaillée de la performance du salon.</p>
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
            <CardHeader><CardTitle className="font-display text-lg">Chiffre d'affaires journalier</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="jour" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={formatCurrencyYAxis} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={formatAriaryTooltip} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="montant" radius={[8, 8, 0, 0]} fill="hsl(340 55% 62%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader><CardTitle className="font-display text-lg">Chiffre d'affaires mensuel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={formatMillionsYAxis} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={formatAriaryTooltip} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Line type="monotone" dataKey="montant" stroke="hsl(40 55% 62%)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader><CardTitle className="font-display text-lg">Prestations les plus vendues</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={formatPercentageTooltip} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className="border-border/60 shadow-soft">
            <CardHeader><CardTitle className="font-display text-lg">Taux d'annulation & fidélisation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={formatPercentageYAxis} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip 
                    formatter={formatPercentageTooltip}
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} 
                  />
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