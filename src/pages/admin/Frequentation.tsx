import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  Users, Eye, Layers, TrendingUp, TrendingDown, Minus, Globe, Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFrequentation } from '@/hooks/useFrequentation';
import { PERIODES, type Periode } from '@/types/audience';
import { formatShortDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';

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

const LIBELLE_PERIODE: Record<Periode, string> = {
  7: '7 jours',
  30: '30 jours',
  90: '90 jours',
};

/** Les chemins parlent au développeur, pas à la gérante. */
const NOMS_DE_PAGE: Record<string, string> = {
  '/': 'Accueil',
  '/prestations': 'Prestations',
  '/galerie': 'Galerie',
  '/reservation': 'Réservation',
  '/disponibilites': 'Disponibilités',
  '/avis': 'Avis',
  '/contact': 'Contact',
  '/mentions-legales': 'Mentions légales',
  '/confidentialite': 'Confidentialité',
  '/conditions': 'Conditions',
  '/autre': 'Page inconnue',
};

const nommerPage = (chemin: string) => NOMS_DE_PAGE[chemin] ?? chemin;

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
};

const entier = (value?: ValueType): string =>
  typeof value === 'number' ? new Intl.NumberFormat('fr-FR').format(value) : String(value ?? '0');

export default function Frequentation() {
  const [periode, setPeriode] = useState<Periode>(30);
  const { stats, loading, error } = useFrequentation(periode);

  const serie = (stats?.serie ?? []).map((p) => ({
    jour: formatShortDate(p.jour),
    visites: p.visites,
    pages: p.pagesVues,
  }));

  const pages = (stats?.pages ?? []).map((p) => ({
    page: nommerPage(p.chemin),
    vues: p.vues,
  }));

  const appareils = (stats?.appareils ?? []).map((a) => ({
    name: a.type,
    value: a.visites,
  }));

  const provenances = stats?.provenances ?? [];
  const totalProvenance = provenances.reduce((somme, p) => somme + p.visites, 0);

  const delta = stats?.deltaVisites ?? null;
  const IconeDelta = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  const kpis = [
    {
      label: 'Visites',
      value: entier(stats?.totalVisites ?? 0),
      icon: Users,
      color: 'text-primary',
    },
    {
      label: 'Pages vues',
      value: entier(stats?.totalPagesVues ?? 0),
      icon: Eye,
      color: 'text-accent',
    },
    {
      label: 'Pages par visite',
      value: (stats?.pagesParVisite ?? 0).toString().replace('.', ','),
      icon: Layers,
      color: 'text-sky-500',
    },
    {
      label: `Face aux ${LIBELLE_PERIODE[periode]} précédents`,
      // Sans période de référence peuplée, il n'y a rien à comparer : mieux
      // vaut le dire que d'afficher une progression qui n'existe pas.
      value: delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toString().replace('.', ',')} %`,
      icon: IconeDelta,
      color: delta === null || delta === 0
        ? 'text-muted-foreground'
        : delta > 0 ? 'text-emerald-500' : 'text-rose-500',
    },
  ];

  const aucuneVisite = !loading && !error && (stats?.totalPagesVues ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Fréquentation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Qui visite le site, par quel chemin, et sur quelles pages.
          </p>
        </div>

        <div className="flex gap-2">
          {PERIODES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriode(p)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                periode === p
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              )}
            >
              {LIBELLE_PERIODE[p]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50/60">
          <CardContent className="p-5 text-sm text-rose-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} {...fadeUp} transition={{ delay: i * 0.08 }}>
            <Card className="border-border/60 shadow-soft">
              <CardContent className="p-5">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-secondary ${k.color}`}>
                  <k.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xl font-semibold sm:text-2xl">{loading ? '…' : k.value}</p>
                <p className="text-sm text-muted-foreground">{k.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {aucuneVisite && (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Globe className="h-6 w-6" />
            </span>
            <p className="mt-4 font-medium">Aucune visite enregistrée sur cette période</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              La mesure démarre à la mise en ligne : les consultations faites depuis un poste de
              développement ne sont pas comptées, non plus que les passages de robots.
            </p>
          </CardContent>
        </Card>
      )}

      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Visites et pages vues</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={serie}>
                <defs>
                  <linearGradient id="grad-visites" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(340 55% 62%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(340 55% 62%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-pages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(40 55% 62%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(40 55% 62%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                {/* Sur quatre-vingt-dix jours, une étiquette par jour serait
                    illisible : Recharts en écarte au besoin. */}
                <XAxis dataKey="jour" tickLine={false} axisLine={false} fontSize={12} minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={entier} contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone" dataKey="visites" name="Visites"
                  stroke="hsl(340 55% 62%)" strokeWidth={2} fill="url(#grad-visites)"
                />
                <Area
                  type="monotone" dataKey="pages" name="Pages vues"
                  stroke="hsl(40 55% 62%)" strokeWidth={2} fill="url(#grad-pages)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="h-full border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Pages les plus consultées</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(240, pages.length * 34)}>
                <BarChart data={pages} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    type="category" dataKey="page" width={116}
                    tickLine={false} axisLine={false} fontSize={12}
                  />
                  <Tooltip formatter={entier} contentStyle={tooltipStyle} />
                  <Bar dataKey="vues" name="Vues" fill="hsl(340 55% 62%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="h-full border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Provenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {provenances.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Rien à afficher pour l'instant.
                </p>
              )}
              {provenances.map((p, i) => {
                const part = totalProvenance === 0 ? 0 : (p.visites / totalProvenance) * 100;
                return (
                  <div key={p.source} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{p.source}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {entier(p.visites)} · {Math.round(part)} %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${part}%`,
                          background: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="pt-2 text-xs text-muted-foreground">
                « Accès direct » regroupe les visiteurs arrivés sans lien référent : adresse saisie,
                favori, ou application masquant l'origine.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className="h-full border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                Appareils
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appareils.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Rien à afficher pour l'instant.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={appareils} dataKey="value" nameKey="name"
                      innerRadius={52} outerRadius={86} paddingAngle={3}
                    >
                      {appareils.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={entier} contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <Card className="h-full border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Comment ces chiffres sont établis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Une <strong className="text-foreground">visite</strong> correspond à une personne sur
                une journée. Quelqu'un qui revient trois jours de suite compte pour trois visites :
                les visiteurs sont distingués par une empreinte anonyme renouvelée chaque nuit, qui
                ne permet pas de les suivre au-delà.
              </p>
              <p>
                Aucun cookie n'est déposé et aucune adresse IP n'est conservée. C'est ce qui dispense
                le site de bandeau de consentement.
              </p>
              <p>
                Les robots d'indexation et les aperçus de lien sont écartés. Un visiteur équipé d'un
                bloqueur de publicité peut en revanche échapper au comptage : lisez ces chiffres
                comme un ordre de grandeur et une tendance, non comme un décompte exact.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
