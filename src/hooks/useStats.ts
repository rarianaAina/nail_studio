import type {
  DashboardStats,
  ChartDataPoint,
  ServicePopularity,
  CancellationDataPoint,
} from '@/types';
import { statsService, type StatsBundle } from '@/services/statsService';
import { queryKeys } from '@/lib/queryClient';
import { useResource } from './useResource';

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

const EMPTY = {
  dashboardStats: null,
  revenueByMonth: [],
  revenueByDay: [],
  appointmentsByMonth: [],
  servicePopularity: [],
  cancellationAndRetention: [],
} as unknown as StatsBundle;

export function useStats(): UseStatsReturn {
  const { data, loading, error, refresh } = useResource(
    queryKeys.stats,
    () => statsService.getAll(),
    EMPTY
  );

  return {
    dashboardStats: data.dashboardStats ?? null,
    revenueByMonth: data.revenueByMonth ?? [],
    revenueByDay: data.revenueByDay ?? [],
    appointmentsByMonth: data.appointmentsByMonth ?? [],
    servicePopularity: data.servicePopularity ?? [],
    cancellationAndRetention: data.cancellationAndRetention ?? [],
    loading,
    error,
    refresh,
  };
}
