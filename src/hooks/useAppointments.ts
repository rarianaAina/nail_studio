import type { Appointment, AppointmentStatus, CreateAppointmentDto, UpdateAppointmentDto } from '@/types';
import { appointmentService } from '@/services/appointmentService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  createAppointment: (data: CreateAppointmentDto) => Promise<Appointment>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  updateAppointment: (id: string, data: UpdateAppointmentDto) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getByDate: (date: string) => Appointment[];
  refresh: () => Promise<void>;
}

const EMPTY: Appointment[] = [];

export function useAppointments(): UseAppointmentsReturn {
  const { data: appointments, loading, error, refresh } = useResource(
    queryKeys.appointments,
    () => appointmentService.getAll(),
    EMPTY
  );
  const write = useCacheWriter<Appointment[]>(queryKeys.appointments, EMPTY);

  const createAppointment = async (data: CreateAppointmentDto) => {
    const created = await appointmentService.create(data);
    write((prev) => [...prev, created]);
    return created;
  };

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    const updated = await appointmentService.updateStatus(id, status);
    write((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const updateAppointment = async (id: string, data: UpdateAppointmentDto) => {
    const updated = await appointmentService.update(id, data);
    write((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const deleteAppointment = async (id: string) => {
    await appointmentService.delete(id);
    write((prev) => prev.filter((a) => a.id !== id));
  };

  const getByDate = (date: string) => appointments.filter((a) => a.date === date);

  return {
    appointments,
    loading,
    error,
    createAppointment,
    updateStatus,
    updateAppointment,
    deleteAppointment,
    getByDate,
    refresh,
  };
}

/**
 * Variante réservée à la prise de rendez-vous publique.
 *
 * `useAppointments()` charge l'intégralité du carnet, ce dont le tunnel de
 * réservation n'a aucun usage : il ne fait qu'écrire. Sur une page publique,
 * cette lecture était une requête inutile de plus dans une rafale déjà dense.
 */
export function useCreateAppointment() {
  const write = useCacheWriter<Appointment[]>(queryKeys.appointments, EMPTY);

  return async (data: CreateAppointmentDto) => {
    const created = await appointmentService.create(data);
    // Le carnet n'est alimenté que s'il a déjà été chargé ailleurs (espace
    // administratrice) ; sinon l'écriture reste sans effet.
    write((prev) => (prev.length > 0 ? [...prev, created] : prev));
    return created;
  };
}
