export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ServicePopularity {
  name: string;
  percentage: number;
  count?: number;
}

export interface DashboardStats {
  dailyRevenue: number;
  monthlyRevenue: number;
  todayAppointmentsCount: number;
  totalClients: number;
  averageBasket: number;
  cancellationRate: number;
  retentionRate: number;
  dailyRevenueDelta: string;
  monthlyRevenueDelta: string;
  appointmentsDelta: number;
  clientsDelta: number;
}

export interface RevenueByMonth extends ChartDataPoint {
  label: string; // 'Jan', 'Fév', ...
  value: number;
}

export interface AppointmentsByMonth extends ChartDataPoint {
  label: string;
  value: number;
}

export interface CancellationDataPoint extends ChartDataPoint {
  label: string;
  cancellation: number;
  retention: number;
}
