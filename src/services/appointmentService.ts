import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentStatus, CreateAppointmentDto, UpdateAppointmentDto } from '@/types';
import { reminderSettingsService } from './reminderSettingsService';
import { reminderService } from './reminderService';

interface AppointmentRow {
  id: string;
  client_id: string | null;
  client_name: string;
  phone: string;
  email: string | null;
  service_id: string;
  service_name: string;
  price: number;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToAppointment(r: AppointmentRow): Appointment {
  return {
    id: r.id,
    clientId: r.client_id ?? undefined,
    clientName: r.client_name,
    phone: r.phone,
    email: r.email ?? undefined,
    serviceId: r.service_id,
    serviceName: r.service_name,
    price: r.price,
    date: r.date,
    time: r.time,
    status: r.status as AppointmentStatus,
    notes: r.notes ?? undefined,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

function dtoToRow(data: CreateAppointmentDto): Partial<AppointmentRow> {
  return {
    client_id: data.clientId ?? null,
    client_name: data.clientName,
    phone: data.phone,
    email: data.email ?? null,
    service_id: data.serviceId,
    service_name: data.serviceName,
    price: data.price,
    date: data.date,
    time: data.time,
    notes: data.notes ?? null,
  };
}

function patchToRow(data: UpdateAppointmentDto): Partial<AppointmentRow> {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId ?? null;
  if (data.clientName !== undefined) row.client_name = data.clientName;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.email !== undefined) row.email = data.email ?? null;
  if (data.serviceId !== undefined) row.service_id = data.serviceId;
  if (data.serviceName !== undefined) row.service_name = data.serviceName;
  if (data.price !== undefined) row.price = data.price;
  if (data.date !== undefined) row.date = data.date;
  if (data.time !== undefined) row.time = data.time;
  if (data.status !== undefined) row.status = data.status;
  if (data.notes !== undefined) row.notes = data.notes ?? null;
  return row as Partial<AppointmentRow>;
}

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw error;
    return (data as AppointmentRow[]).map(rowToAppointment);
  },

  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToAppointment(data as AppointmentRow);
  },

  async getByDate(date: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });
    if (error) throw error;
    return (data as AppointmentRow[]).map(rowToAppointment);
  },

  async getByClientEmail(email: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('email', email)
      .order('date', { ascending: true });
    if (error) throw error;
    return (data as AppointmentRow[]).map(rowToAppointment);
  },

  async create(data: CreateAppointmentDto): Promise<Appointment> {
    const row = dtoToRow(data);

    // For guest bookings (no clientId), try to find an existing client by
    // email and link the appointment. If none exists, create a client row
    // so the appointment is never orphaned and will auto-link on register.
    if (!row.client_id && row.email) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('email', row.email)
        .maybeSingle();
      if (existing) {
        row.client_id = (existing as { id: string }).id;
      } else {
        const { data: created, error: clientErr } = await supabase
          .from('clients')
          .insert({
            name: data.clientName,
            phone: data.phone,
            email: row.email,
          })
          .select('id')
          .single();
        if (!clientErr && created) {
          row.client_id = (created as { id: string }).id;
        }
      }
    }

    const { error } = await supabase
      .from('appointments')
      .insert(row);
    if (error) throw error;

    // Read-back: try to fetch the just-created appointment.
    const { data: rows, error: selError } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_name', data.clientName)
      .eq('phone', data.phone)
      .eq('date', data.date)
      .eq('time', data.time)
      .order('created_at', { ascending: false })
      .limit(1);
    if (selError) throw selError;
    if (!rows || rows.length === 0) {
      // Fallback: return a locally-constructed object if read-back fails
      return {
        id: '',
        ...data,
        status: 'pending' as AppointmentStatus,
      };
    }

    const appointment = rowToAppointment(rows[0] as AppointmentRow);

    // --- CRÉER UN RAPPEL POUR LE RENDEZ-VOUS ---
    try {
      // Récupérer les paramètres de rappel
      const settings = await reminderSettingsService.get();
      
      // Créer un rappel si activé
      if (settings.enabled) {
        await reminderService.create({
          appointmentId: appointment.id,
          clientName: appointment.clientName,
          clientPhone: appointment.phone,
          clientEmail: appointment.email,
          serviceName: appointment.serviceName,
          appointmentDate: appointment.date,
          appointmentTime: appointment.time,
          delayHours: settings.delayHours,
          recipients: settings.recipients,
        });
        console.log(`✅ Rappel créé pour le rendez-vous ${appointment.id}`);
      }
    } catch (reminderError) {
      // Ne pas bloquer la création du rendez-vous si le rappel échoue
      console.error('Erreur lors de la création du rappel:', reminderError);
    }

    return appointment;
  },

  async update(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    // Si le statut change vers 'cancelled', supprimer les rappels
    if (data.status === 'cancelled') {
      await reminderService.deleteByAppointmentId(id);
      console.log(`🗑️ Rappels supprimés pour le rendez-vous annulé ${id}`);
    }

    const { data: row, error } = await supabase
      .from('appointments')
      .update(patchToRow(data))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    const appointment = rowToAppointment(row as AppointmentRow);

    // Si le rendez-vous est confirmé et que les rappels sont activés, créer/mettre à jour le rappel
    if (data.status === 'confirmed' && !data.date && !data.time) {
      try {
        const settings = await reminderSettingsService.get();
        if (settings.enabled) {
          // Supprimer l'ancien rappel s'il existe
          await reminderService.deleteByAppointmentId(id);
          
          // Créer un nouveau rappel avec les nouvelles infos
          await reminderService.create({
            appointmentId: appointment.id,
            clientName: appointment.clientName,
            clientPhone: appointment.phone,
            clientEmail: appointment.email,
            serviceName: appointment.serviceName,
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            delayHours: settings.delayHours,
            recipients: settings.recipients,
          });
          console.log(`✅ Rappel recréé pour le rendez-vous confirmé ${id}`);
        }
      } catch (reminderError) {
        console.error('Erreur lors de la mise à jour du rappel:', reminderError);
      }
    }

    // Si la date ou l'heure change, mettre à jour le rappel
    if (data.date || data.time) {
      try {
        // Supprimer l'ancien rappel
        await reminderService.deleteByAppointmentId(id);
        
        const settings = await reminderSettingsService.get();
        if (settings.enabled) {
          // Créer un nouveau rappel avec les nouvelles dates
          await reminderService.create({
            appointmentId: appointment.id,
            clientName: appointment.clientName,
            clientPhone: appointment.phone,
            clientEmail: appointment.email,
            serviceName: appointment.serviceName,
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            delayHours: settings.delayHours,
            recipients: settings.recipients,
          });
          console.log(`🔄 Rappel mis à jour pour le rendez-vous ${id}`);
        }
      } catch (reminderError) {
        console.error('Erreur lors de la mise à jour du rappel:', reminderError);
      }
    }

    return appointment;
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const appointment = await appointmentService.update(id, { status });
    
    // Si le statut est 'cancelled', les rappels sont déjà supprimés dans update()
    
    return appointment;
  },

  async delete(id: string): Promise<void> {
    // Supprimer d'abord les rappels associés
    try {
      await reminderService.deleteByAppointmentId(id);
      console.log(`🗑️ Rappels supprimés pour le rendez-vous ${id}`);
    } catch (reminderError) {
      console.error('Erreur lors de la suppression des rappels:', reminderError);
    }

    // Puis supprimer le rendez-vous
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  },
};