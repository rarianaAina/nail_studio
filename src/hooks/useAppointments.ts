import { useCallback, useEffect, useState } from 'react';
import type { Appointment, AppointmentStatus, CreateAppointmentDto } from '@/types';
import { appointmentService } from '@/services/appointmentService';

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  createAppointment: (data: CreateAppointmentDto) => Promise<Appointment>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getByDate: (date: string) => Appointment[];
  refresh: () => Promise<void>;
}

export function useAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAll();
      setAppointments(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAppointment = async (data: CreateAppointmentDto) => {
    const created = await appointmentService.create(data);
    setAppointments((prev) => [...prev, created]);
    return created;
  };

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    const updated = await appointmentService.updateStatus(id, status);
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    const updated = await appointmentService.update(id, data);
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const deleteAppointment = async (id: string) => {
    await appointmentService.delete(id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const getByDate = (date: string) =>
    appointments.filter((a) => a.date === date);

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateStatus,
    updateAppointment,
    deleteAppointment,
    getByDate,
    refresh: load,
  };
}
