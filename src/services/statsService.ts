import { supabase } from '@/lib/supabase';
import type {
  DashboardStats,
  ChartDataPoint,
  ServicePopularity,
  CancellationDataPoint,
} from '@/types';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

interface AppointmentRow {
  price: number;
  date: string;
  status: string;
  service_name: string;
}

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartIso = monthStart.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('appointments')
      .select('price, date, status, service_name');
    if (error) throw error;

    const rows = (data as AppointmentRow[]) ?? [];

    const dailyRevenue = rows
      .filter((r) => r.date === today && r.status !== 'cancelled')
      .reduce((s, r) => s + r.price, 0);

    const monthlyRevenue = rows
      .filter((r) => r.date >= monthStartIso && r.status !== 'cancelled')
      .reduce((s, r) => s + r.price, 0);

    const todayAppointmentsCount = rows.filter((r) => r.date === today && r.status !== 'cancelled').length;

    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    const completed = rows.filter((r) => r.status === 'completed');
    const averageBasket = completed.length > 0
      ? Math.round(completed.reduce((s, r) => s + r.price, 0) / completed.length)
      : 0;

    const cancelled = rows.filter((r) => r.status === 'cancelled').length;
    const total = rows.length;
    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

    const retentionRate = total > 0
      ? Math.round(((total - cancelled) / total) * 100)
      : 0;

    return {
      dailyRevenue,
      monthlyRevenue,
      todayAppointmentsCount,
      totalClients: totalClients ?? 0,
      averageBasket,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      retentionRate,
      dailyRevenueDelta: '+0%',
      monthlyRevenueDelta: '+0%',
      appointmentsDelta: 0,
      clientsDelta: 0,
    };
  },

  async getRevenueByMonth(): Promise<ChartDataPoint[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('price, date, status');
    if (error) throw error;
    const rows = (data as { price: number; date: string; status: string }[]) ?? [];

    const byMonth: Record<number, number> = {};
    rows
      .filter((r) => r.status !== 'cancelled')
      .forEach((r) => {
        const m = new Date(r.date).getMonth();
        byMonth[m] = (byMonth[m] ?? 0) + r.price;
      });

    return MONTH_LABELS.map((label, i) => ({
      label,
      value: byMonth[i] ?? 0,
    }));
  },

  async getRevenueByDay(): Promise<ChartDataPoint[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('price, date, status');
    if (error) throw error;
    const rows = (data as { price: number; date: string; status: string }[]) ?? [];

    const byDay: Record<number, number> = {};
    rows
      .filter((r) => r.status !== 'cancelled')
      .forEach((r) => {
        const d = new Date(r.date).getDay();
        byDay[d] = (byDay[d] ?? 0) + r.price;
      });

    return [1, 2, 3, 4, 5, 6, 0].map((d) => ({
      label: DAY_LABELS[d],
      value: byDay[d] ?? 0,
    }));
  },

  async getAppointmentsByMonth(): Promise<ChartDataPoint[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('date, status');
    if (error) throw error;
    const rows = (data as { date: string; status: string }[]) ?? [];

    const byMonth: Record<number, number> = {};
    rows
      .filter((r) => r.status !== 'cancelled')
      .forEach((r) => {
        const m = new Date(r.date).getMonth();
        byMonth[m] = (byMonth[m] ?? 0) + 1;
      });

    return MONTH_LABELS.map((label, i) => ({
      label,
      value: byMonth[i] ?? 0,
    }));
  },

  async getServicePopularity(): Promise<ServicePopularity[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('service_name, status');
    if (error) throw error;
    const rows = (data as { service_name: string; status: string }[]) ?? [];

    const counts: Record<string, number> = {};
    rows
      .filter((r) => r.status !== 'cancelled')
      .forEach((r) => {
        counts[r.service_name] = (counts[r.service_name] ?? 0) + 1;
      });

    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    const result = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        count,
      }))
      .sort((a, b) => b.count! - a.count!)
      .slice(0, 5);

    return result.length > 0 ? result : [
      { name: 'Aucune donnée', percentage: 100, count: 0 },
    ];
  },
  
  async getRevenueByClient(): Promise<{ clientId: string; clientName: string; totalSpent: number; appointmentsCount: number }[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        price,
        status,
        client_id,
        clients (
          first_name,
          last_name
        )
      `);
    if (error) throw error;

    // Typage correct : clients est un tableau
    type AppointmentWithClient = {
      price: number;
      status: string;
      client_id: string;
      clients: {
        first_name: string;
        last_name: string;
      }[];
    };

    const rows = data as unknown as AppointmentWithClient[] ?? [];

    const clientMap = new Map<string, { 
      totalSpent: number; 
      count: number; 
      firstName: string; 
      lastName: string;
    }>();

    rows
      .filter((r) => r.status !== 'cancelled' && r.clients && r.clients.length > 0)
      .forEach((r) => {
        const client = r.clients[0]; // On prend le premier client (il n'y en a qu'un)
        const current = clientMap.get(r.client_id) ?? {
          totalSpent: 0,
          count: 0,
          firstName: client.first_name,
          lastName: client.last_name,
        };
        current.totalSpent += r.price;
        current.count += 1;
        clientMap.set(r.client_id, current);
      });

    const result = Array.from(clientMap.entries()).map(([id, data]) => ({
      clientId: id,
      clientName: `${data.firstName} ${data.lastName}`,
      totalSpent: data.totalSpent,
      appointmentsCount: data.count,
    }));

    return result.sort((a, b) => b.totalSpent - a.totalSpent);
  },

  async getCancellationAndRetention(): Promise<CancellationDataPoint[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('date, status');
    if (error) throw error;
    const rows = (data as { date: string; status: string }[]) ?? [];

    const byMonth: Record<number, { total: number; cancelled: number }> = {};
    rows.forEach((r) => {
      const m = new Date(r.date).getMonth();
      byMonth[m] ??= { total: 0, cancelled: 0 };
      byMonth[m].total += 1;
      if (r.status === 'cancelled') byMonth[m].cancelled += 1;
    });

    return MONTH_LABELS.map((label, i) => {
      const stats = byMonth[i] ?? { total: 0, cancelled: 0 };
      const cancellation = stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0;
      const retention = stats.total > 0 ? 100 - cancellation : 0;
      return {
        label,
        value: retention,
        cancellation,
        retention,
      };
    });
  },
};
