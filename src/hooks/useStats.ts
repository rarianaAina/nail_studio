import { useCallback, useEffect, useState } from 'react';
import type {
  DashboardStats,
  ChartDataPoint,
  ServicePopularity,
  CancellationDataPoint,
} from '@/types';
import { statsService } from '@/services/statsService';

interface UseStatsReturn {
  dashboardStats: DashboardStats | null;
  revenueByMonth: ChartDataPoint[];
  revenueByDay: ChartDataPoint[];
  appointmentsByMonth: ChartDataPoint[];
  servicePopularity: ServicePopularity[];
  cancellationAndRetention: CancellationDataPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueByMonth, setRevenueByMonth] = useState<ChartDataPoint[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<ChartDataPoint[]>([]);
  const [appointmentsByMonth, setAppointmentsByMonth] = useState<ChartDataPoint[]>([]);
  const [servicePopularity, setServicePopularity] = useState<ServicePopularity[]>([]);
  const [cancellationAndRetention, setCancellationAndRetention] = useState<CancellationDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, revMonth, revDay, apptMonth, popularity, cancRet] =
        await Promise.all([
          statsService.getDashboardStats(),
          statsService.getRevenueByMonth(),
          statsService.getRevenueByDay(),
          statsService.getAppointmentsByMonth(),
          statsService.getServicePopularity(),
          statsService.getCancellationAndRetention(),
        ]);
      setDashboardStats(stats);
      setRevenueByMonth(revMonth);
      setRevenueByDay(revDay);
      setAppointmentsByMonth(apptMonth);
      setServicePopularity(popularity);
      setCancellationAndRetention(cancRet);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    dashboardStats,
    revenueByMonth,
    revenueByDay,
    appointmentsByMonth,
    servicePopularity,
    cancellationAndRetention,
    loading,
    error,
    refresh: load,
  };
}
