import type { Appointment, AppointmentStatus, CreateAppointmentDto } from '@/types';
import { mockAppointments } from '@/data/mock/appointments';

// Module-level mutable store — will be replaced by Firestore collection calls
let store: Appointment[] = [...mockAppointments];

export const appointmentService = {
  /**
   * Fetch all appointments.
   * Firebase: getDocs(collection(db, 'appointments'))
   */
  getAll: async (): Promise<Appointment[]> => {
    return [...store];
  },

  /**
   * Fetch a single appointment by id.
   * Firebase: getDoc(doc(db, 'appointments', id))
   */
  getById: async (id: string): Promise<Appointment | null> => {
    return store.find((a) => a.id === id) ?? null;
  },

  /**
   * Fetch appointments for a specific date.
   * Firebase: query(collection(db, 'appointments'), where('date', '==', date))
   */
  getByDate: async (date: string): Promise<Appointment[]> => {
    return store.filter((a) => a.date === date);
  },

  /**
   * Fetch appointments for a client email.
   * Firebase: query(collection(db, 'appointments'), where('email', '==', email))
   */
  getByClientEmail: async (email: string): Promise<Appointment[]> => {
    return store.filter((a) => a.email === email);
  },

  /**
   * Create a new appointment.
   * Firebase: addDoc(collection(db, 'appointments'), data)
   */
  create: async (data: CreateAppointmentDto): Promise<Appointment> => {
    const appointment: Appointment = {
      ...data,
      id: 'a-' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    store.push(appointment);
    return appointment;
  },

  /**
   * Update appointment fields.
   * Firebase: updateDoc(doc(db, 'appointments', id), data)
   */
  update: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    const idx = store.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Appointment ${id} not found`);
    store[idx] = { ...store[idx], ...data };
    return store[idx];
  },

  /**
   * Shorthand to update only the status.
   */
  updateStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    return appointmentService.update(id, { status });
  },

  /**
   * Delete an appointment.
   * Firebase: deleteDoc(doc(db, 'appointments', id))
   */
  delete: async (id: string): Promise<void> => {
    store = store.filter((a) => a.id !== id);
  },
};
