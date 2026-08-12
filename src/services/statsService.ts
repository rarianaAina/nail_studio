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
 * Les prestations d'un rendez-vous vivent dans le JSONB `services`.
 *
 * Les colonnes héritées `price` et `service_name` — un seul soin par
 * rendez-vous — ont été reprises dans ce JSONB puis supprimées. Le repli qui
 * les lisait n'a plus d'objet.
 */
interface AppointmentStatsRow {
  date: string;
  status: string;
  services: ServiceEntry[] | null;
}

/** Montant d'un rendez-vous : somme des prestations. */
export function rowRevenue(r: AppointmentStatsRow): number {
  if (!Array.isArray(r.services)) return 0;
  return r.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
}

/** Noms des prestations d'un rendez-vous. */
export function rowServiceNames(r: AppointmentStatsRow): string[] {
  if (!Array.isArray(r.services)) return [];
  return r.services.map((s) => s.name).filter(Boolean);
}

/**
 * Interprète 'YYYY-MM-DD' dans le fuseau local.
 * `new Date('2026-08-12')` est interprété en UTC par le moteur JS et peut donc
 * basculer d'un jour — et d'un mois, en fin de mois — selon le fuseau.
 */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const isActive = (r: AppointmentStatsRow) => r.status !== 'cancelled';

/**
 * Les graphiques mensuels portent douze cases étiquetées « Jan » à « Déc ».
 * Sans filtre d'année, janvier 2025 et janvier 2026 s'additionnaient dans la
 * même barre. Ils sont désormais bornés à une année civile.
 */
export const inYear = (year: number) => (r: AppointmentStatsRow) =>
  parseLocalDate(r.date).getFullYear() === year;

export type { AppointmentStatsRow };

export interface StatsBundle {
  dashboardStats: DashboardStats;
  revenueByMonth: ChartDataPoint[];
  revenueByDay: ChartDataPoint[];
  appointmentsByMonth: ChartDataPoint[];
  servicePopularity: ServicePopularity[];
  cancellationAndRetention: CancellationDataPoint[];
}

/** Écart relatif entre deux montants, formaté pour l'affichage. */
function formatDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '+0%';
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

export function buildDashboardStats(
  rows: AppointmentStatsRow[],
  totalClients: number,
  clientsDelta = 0,
  now: Date = new Date()
): DashboardStats {
  const today = toIsoDate(now);
  const yesterday = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const monthStartIso = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));

  // Mois précédent, borné au même quantième : comparer un mois à date avec un
  // mois complet donnerait un recul artificiel en début de mois.
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStartIso = toIsoDate(prevMonthStart);
  const prevMonthSameDayIso = toIsoDate(
    new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), now.getDate())
  );

  const sumBetween = (fromIso: string, toIso: string) =>
    rows
      .filter((r) => r.date >= fromIso && r.date <= toIso && isActive(r))
      .reduce((s, r) => s + rowRevenue(r), 0);

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
    dailyRevenueDelta: formatDelta(
      dailyRevenue,
      rows.filter((r) => r.date === yesterday && isActive(r)).reduce((s, r) => s + rowRevenue(r), 0)
    ),
    monthlyRevenueDelta: formatDelta(
      monthlyRevenue,
      sumBetween(prevMonthStartIso, prevMonthSameDayIso)
    ),
    appointmentsDelta:
      todayAppointmentsCount -
      rows.filter((r) => r.date === yesterday && isActive(r)).length,
    clientsDelta,
  };
}

export function buildRevenueByMonth(rows: AppointmentStatsRow[], year: number = new Date().getFullYear()): ChartDataPoint[] {
  const byMonth: Record<number, number> = {};
  rows.filter(isActive).filter(inYear(year)).forEach((r) => {
    const m = parseLocalDate(r.date).getMonth();
    byMonth[m] = (byMonth[m] ?? 0) + rowRevenue(r);
  });
  return MONTH_LABELS.map((label, i) => ({ label, value: byMonth[i] ?? 0 }));
}

export function buildRevenueByDay(rows: AppointmentStatsRow[], year: number = new Date().getFullYear()): ChartDataPoint[] {
  const byDay: Record<number, number> = {};
  rows.filter(isActive).filter(inYear(year)).forEach((r) => {
    const d = parseLocalDate(r.date).getDay();
    byDay[d] = (byDay[d] ?? 0) + rowRevenue(r);
  });
  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: DAY_LABELS[d], value: byDay[d] ?? 0 }));
}

export function buildAppointmentsByMonth(rows: AppointmentStatsRow[], year: number = new Date().getFullYear()): ChartDataPoint[] {
  const byMonth: Record<number, number> = {};
  rows.filter(isActive).filter(inYear(year)).forEach((r) => {
    const m = parseLocalDate(r.date).getMonth();
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  });
  return MONTH_LABELS.map((label, i) => ({ label, value: byMonth[i] ?? 0 }));
}

export function buildServicePopularity(rows: AppointmentStatsRow[]): ServicePopularity[] {
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

export function buildCancellationAndRetention(rows: AppointmentStatsRow[], year: number = new Date().getFullYear()): CancellationDataPoint[] {
  const byMonth: Record<number, { total: number; cancelled: number }> = {};
  rows.filter(inYear(year)).forEach((r) => {
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
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [appointmentsResult, clientsResult, newThisMonth, newPrevMonth] = await Promise.all([
      supabase.from('appointments').select('date, status, services'),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      // Nouvelles clientes du mois, et du mois précédent, pour l'écart affiché
      // sur le tableau de bord. Deux comptages sans transfert de lignes.
      supabase.from('clients').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevMonthStart)
        .lt('created_at', monthStart),
    ]);

    if (appointmentsResult.error) throw appointmentsResult.error;

    const rows = (appointmentsResult.data as AppointmentStatsRow[]) ?? [];
    const totalClients = clientsResult.count ?? 0;
    const clientsDelta = (newThisMonth.count ?? 0) - (newPrevMonth.count ?? 0);

    return {
      dashboardStats: buildDashboardStats(rows, totalClients, clientsDelta, now),
      revenueByMonth: buildRevenueByMonth(rows),
      revenueByDay: buildRevenueByDay(rows),
      appointmentsByMonth: buildAppointmentsByMonth(rows),
      servicePopularity: buildServicePopularity(rows),
      cancellationAndRetention: buildCancellationAndRetention(rows),
    };
  },
};
