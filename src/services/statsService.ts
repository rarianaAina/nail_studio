import { supabase } from '@/lib/supabase';
import type {
  DashboardStats,
  ChartDataPoint,
  ServicePopularity,
  CancellationDataPoint,
} from '@/types';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface ServiceEntry {
  id: string;
  name: string;
  price: number;
  duration: number;
}

/**
 * La table `appointments` porte deux générations de colonnes :
 * - héritées : `price` / `service_name`, une seule prestation par rendez-vous ;
 * - actuelles : `services` (JSONB), plusieurs prestations par rendez-vous.
 *
 * `appointmentService.create()` n'alimente plus que `services`, laissant les
 * colonnes héritées à NULL. Les agrégats lus depuis `price` renvoyaient donc 0
 * pour tout rendez-vous récent — sans lever d'erreur, `0 + null` valant 0 en
 * JavaScript. D'où un chiffre d'affaires silencieusement faux.
 *
 * Les deux formes sont lues ici, avec repli sur les colonnes héritées, afin de
 * conserver l'historique antérieur à la bascule.
 */
interface AppointmentStatsRow {
  date: string;
  status: string;
  services: ServiceEntry[] | null;
  price: number | null;
  service_name: string | null;
}

/** Montant d'un rendez-vous : somme du JSONB, à défaut la colonne héritée. */
function rowRevenue(r: AppointmentStatsRow): number {
  if (Array.isArray(r.services) && r.services.length > 0) {
    return r.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }
  return Number(r.price) || 0;
}

/** Prestations d'un rendez-vous : noms du JSONB, à défaut la colonne héritée. */
function rowServiceNames(r: AppointmentStatsRow): string[] {
  if (Array.isArray(r.services) && r.services.length > 0) {
    return r.services.map((s) => s.name).filter(Boolean);
  }
  return r.service_name ? [r.service_name] : [];
}

/**
 * Interprète 'YYYY-MM-DD' dans le fuseau local.
 * `new Date('2026-08-12')` est interprété en UTC par le moteur JS et peut donc
 * basculer d'un jour — et d'un mois, en fin de mois — selon le fuseau.
 */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const isActive = (r: AppointmentStatsRow) => r.status !== 'cancelled';

export interface StatsBundle {
  dashboardStats: DashboardStats;
  revenueByMonth: ChartDataPoint[];
  revenueByDay: ChartDataPoint[];
  appointmentsByMonth: ChartDataPoint[];
  servicePopularity: ServicePopularity[];
  cancellationAndRetention: CancellationDataPoint[];
}

function buildDashboardStats(rows: AppointmentStatsRow[], totalClients: number): DashboardStats {
  const now = new Date();
  const today = toIsoDate(now);
  const monthStartIso = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const dailyRevenue = rows
    .filter((r) => r.date === today && isActive(r))
    .reduce((s, r) => s + rowRevenue(r), 0);

  const monthlyRevenue = rows
    .filter((r) => r.date >= monthStartIso && isActive(r))
    .reduce((s, r) => s + rowRevenue(r), 0);

  const todayAppointmentsCount = rows.filter((r) => r.date === today && isActive(r)).length;

  const completed = rows.filter((r) => r.status === 'completed');
  const averageBasket = completed.length > 0
    ? Math.round(completed.reduce((s, r) => s + rowRevenue(r), 0) / completed.length)
    : 0;

  const cancelled = rows.filter((r) => r.status === 'cancelled').length;
  const total = rows.length;
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;
  const retentionRate = total > 0 ? Math.round(((total - cancelled) / total) * 100) : 0;

  return {
    dailyRevenue,
    monthlyRevenue,
    todayAppointmentsCount,
    totalClients,
    averageBasket,
    cancellationRate: Math.round(cancellationRate * 10) / 10,
    retentionRate,
    // TODO : ces quatre indicateurs sont des valeurs fixes depuis l'origine.
    // Les calculer suppose de définir la période de comparaison (mois glissant,
    // mois calendaire précédent, même mois de l'année passée) — décision métier.
    dailyRevenueDelta: '+0%',
    monthlyRevenueDelta: '+0%',
    appointmentsDelta: 0,
    clientsDelta: 0,
  };
}

function buildRevenueByMonth(rows: AppointmentStatsRow[]): ChartDataPoint[] {
  const byMonth: Record<number, number> = {};
  rows.filter(isActive).forEach((r) => {
    const m = parseLocalDate(r.date).getMonth();
    byMonth[m] = (byMonth[m] ?? 0) + rowRevenue(r);
  });
  return MONTH_LABELS.map((label, i) => ({ label, value: byMonth[i] ?? 0 }));
}

function buildRevenueByDay(rows: AppointmentStatsRow[]): ChartDataPoint[] {
  const byDay: Record<number, number> = {};
  rows.filter(isActive).forEach((r) => {
    const d = parseLocalDate(r.date).getDay();
    byDay[d] = (byDay[d] ?? 0) + rowRevenue(r);
  });
  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: DAY_LABELS[d], value: byDay[d] ?? 0 }));
}

function buildAppointmentsByMonth(rows: AppointmentStatsRow[]): ChartDataPoint[] {
  const byMonth: Record<number, number> = {};
  rows.filter(isActive).forEach((r) => {
    const m = parseLocalDate(r.date).getMonth();
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  });
  return MONTH_LABELS.map((label, i) => ({ label, value: byMonth[i] ?? 0 }));
}

function buildServicePopularity(rows: AppointmentStatsRow[]): ServicePopularity[] {
  // Un rendez-vous pouvant porter plusieurs prestations, chacune est comptée.
  const counts: Record<string, number> = {};
  rows.filter(isActive).forEach((r) => {
    rowServiceNames(r).forEach((name) => {
      counts[name] = (counts[name] ?? 0) + 1;
    });
  });

  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  const result = Object.entries(counts)
    .map(([name, count]) => ({
      name,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return result.length > 0 ? result : [{ name: 'Aucune donnée', percentage: 100, count: 0 }];
}

function buildCancellationAndRetention(rows: AppointmentStatsRow[]): CancellationDataPoint[] {
  const byMonth: Record<number, { total: number; cancelled: number }> = {};
  rows.forEach((r) => {
    const m = parseLocalDate(r.date).getMonth();
    byMonth[m] ??= { total: 0, cancelled: 0 };
    byMonth[m].total += 1;
    if (r.status === 'cancelled') byMonth[m].cancelled += 1;
  });

  return MONTH_LABELS.map((label, i) => {
    const stats = byMonth[i] ?? { total: 0, cancelled: 0 };
    const cancellation = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;
    const retention = stats.total > 0 ? 100 - cancellation : 0;
    return { label, value: retention, cancellation, retention };
  });
}

export const statsService = {
  /**
   * Calcule l'ensemble des indicateurs à partir d'une seule lecture de
   * `appointments`. Les six méthodes précédentes déclenchaient chacune leur
   * propre lecture complète de la table, soit six parcours pour un affichage.
   */
  async getAll(): Promise<StatsBundle> {
    const [appointmentsResult, clientsResult] = await Promise.all([
      supabase.from('appointments').select('date, status, services, price, service_name'),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
    ]);

    if (appointmentsResult.error) throw appointmentsResult.error;

    const rows = (appointmentsResult.data as AppointmentStatsRow[]) ?? [];
    const totalClients = clientsResult.count ?? 0;

    return {
      dashboardStats: buildDashboardStats(rows, totalClients),
      revenueByMonth: buildRevenueByMonth(rows),
      revenueByDay: buildRevenueByDay(rows),
      appointmentsByMonth: buildAppointmentsByMonth(rows),
      servicePopularity: buildServicePopularity(rows),
      cancellationAndRetention: buildCancellationAndRetention(rows),
    };
  },
};
