import type {
  DashboardStats,
  ChartDataPoint,
  ServicePopularity,
  CancellationDataPoint,
} from '@/types';

// Static mock data — will be replaced by Firestore aggregation queries
// (e.g. Cloud Functions or client-side aggregations over the appointments collection)

const revenueByMonth: ChartDataPoint[] = [
  { label: 'Jan', value: 1850000 },
  { label: 'Fév', value: 2100000 },
  { label: 'Mar', value: 1950000 },
  { label: 'Avr', value: 2400000 },
  { label: 'Mai', value: 2750000 },
  { label: 'Juin', value: 2600000 },
  { label: 'Juil', value: 2980000 },
];

const revenueByDay: ChartDataPoint[] = [
  { label: 'Lun', value: 145000 },
  { label: 'Mar', value: 180000 },
  { label: 'Mer', value: 165000 },
  { label: 'Jeu', value: 210000 },
  { label: 'Ven', value: 245000 },
  { label: 'Sam', value: 290000 },
  { label: 'Dim', value: 0 },
];

const appointmentsByMonth: ChartDataPoint[] = [
  { label: 'Jan', value: 42 },
  { label: 'Fév', value: 48 },
  { label: 'Mar', value: 45 },
  { label: 'Avr', value: 55 },
  { label: 'Mai', value: 62 },
  { label: 'Juin', value: 58 },
  { label: 'Juil', value: 67 },
];

const servicePopularity: ServicePopularity[] = [
  { name: 'Vernis semi-permanent', percentage: 38 },
  { name: 'Manucure russe', percentage: 24 },
  { name: 'Nail Art', percentage: 18 },
  { name: 'Pédicure spa', percentage: 12 },
  { name: 'Prothèses', percentage: 8 },
];

const cancellationAndRetention: CancellationDataPoint[] = [
  { label: 'Jan', value: 72, cancellation: 5, retention: 72 },
  { label: 'Fév', value: 75, cancellation: 7, retention: 75 },
  { label: 'Mar', value: 78, cancellation: 4, retention: 78 },
  { label: 'Avr', value: 80, cancellation: 6, retention: 80 },
  { label: 'Mai', value: 82, cancellation: 3, retention: 82 },
  { label: 'Juin', value: 85, cancellation: 5, retention: 85 },
  { label: 'Juil', value: 87, cancellation: 4, retention: 87 },
];

export const statsService = {
  /**
   * Fetch KPI summary for the dashboard.
   * Firebase: aggregate queries or Cloud Functions
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    return {
      dailyRevenue: 190000,
      monthlyRevenue: 2980000,
      todayAppointmentsCount: 4,
      totalClients: 7,
      averageBasket: 44500,
      cancellationRate: 4.2,
      retentionRate: 87,
      dailyRevenueDelta: '+12%',
      monthlyRevenueDelta: '+8%',
      appointmentsDelta: 2,
      clientsDelta: 3,
    };
  },

  /**
   * Monthly revenue chart data.
   * Firebase: aggregated from appointments collection
   */
  getRevenueByMonth: async (): Promise<ChartDataPoint[]> => {
    return revenueByMonth;
  },

  /**
   * Daily revenue chart data for current week.
   * Firebase: aggregated from appointments collection
   */
  getRevenueByDay: async (): Promise<ChartDataPoint[]> => {
    return revenueByDay;
  },

  /**
   * Monthly appointments count.
   * Firebase: count() aggregation per month
   */
  getAppointmentsByMonth: async (): Promise<ChartDataPoint[]> => {
    return appointmentsByMonth;
  },

  /**
   * Service popularity distribution.
   * Firebase: aggregated from appointments collection
   */
  getServicePopularity: async (): Promise<ServicePopularity[]> => {
    return servicePopularity;
  },

  /**
   * Combined cancellation rate + retention rate by month.
   * Firebase: computed aggregations
   */
  getCancellationAndRetention: async (): Promise<CancellationDataPoint[]> => {
    return cancellationAndRetention;
  },
};
