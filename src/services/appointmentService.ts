// services/appointmentService.ts
import { supabase } from '@/lib/supabase';
import type { Appointment, AppointmentStatus, CreateAppointmentDto, UpdateAppointmentDto, ServiceItem } from '@/types';
import { reminderSettingsService } from './reminderSettingsService';
import { reminderService } from './reminderService';

interface AppointmentRow {
  id: string;
  client_id: string | null;
  client_name: string;
  phone: string;
  email: string | null;
  services: any; // JSONB
  date: string;
  time: string;
  status: string;
  payment_method_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToAppointment(r: AppointmentRow): Appointment {
  // ✅ Récupérer les services depuis le JSONB
  const services = (r.services as ServiceItem[]) || [];
  
  return {
    id: r.id,
    clientId: r.client_id ?? undefined,
    clientName: r.client_name,
    phone: r.phone,
    email: r.email ?? undefined,
    services: services,
    date: r.date,
    time: r.time,
    status: r.status as AppointmentStatus,
    paymentMethodId: r.payment_method_id ?? undefined,
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
    services: [], // Sera rempli après récupération des services
    date: data.date,
    time: data.time,
    payment_method_id: data.paymentMethodId ?? null,
    notes: data.notes ?? null,
  };
}

function patchToRow(data: UpdateAppointmentDto): Partial<AppointmentRow> {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId ?? null;
  if (data.clientName !== undefined) row.client_name = data.clientName;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.email !== undefined) row.email = data.email ?? null;
  if (data.date !== undefined) row.date = data.date;
  if (data.time !== undefined) row.time = data.time;
  if (data.status !== undefined) row.status = data.status;
  if (data.paymentMethodId !== undefined) row.payment_method_id = data.paymentMethodId ?? null;
  if (data.notes !== undefined) row.notes = data.notes ?? null;
  return row as Partial<AppointmentRow>;
}

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        payment_method:payment_method_id (
          id,
          name,
          label,
          icon
        )
      `)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw error;
    return (data as AppointmentRow[]).map(rowToAppointment);
  },

  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        payment_method:payment_method_id (
          id,
          name,
          label,
          icon
        )
      `)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToAppointment(data as AppointmentRow);
  },

  async getByDate(date: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        payment_method:payment_method_id (
          id,
          name,
          label,
          icon
        )
      `)
      .eq('date', date)
      .order('time', { ascending: true });
    if (error) throw error;
    return (data as AppointmentRow[]).map(rowToAppointment);
  },

  async getByClientEmail(email: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        payment_method:payment_method_id (
          id,
          name,
          label,
          icon
        )
      `)
      .eq('email', email)
      .order('date', { ascending: true });
    if (error) throw error;
    return (data as AppointmentRow[]).map(rowToAppointment);
  },

  async create(data: CreateAppointmentDto): Promise<Appointment> {
    // 1. Vérifier qu'il y a au moins un service
    if (!data.serviceIds || data.serviceIds.length === 0) {
      throw new Error('Au moins un service est requis');
    }

    // 2. Récupérer les services sélectionnés
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price, duration')
      .in('id', data.serviceIds);

    if (servicesError) throw servicesError;
    if (!servicesData || servicesData.length === 0) {
      throw new Error('Services non trouvés');
    }

    // 3. Construire le tableau de services
    const services: ServiceItem[] = servicesData.map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      duration: s.duration,
    }));

    // 4. Créer le row avec les services en JSON
    const row = {
      client_id: data.clientId ?? null,
      client_name: data.clientName,
      phone: data.phone,
      email: data.email ?? null,
      services: services, // ✅ Stocké en JSONB
      date: data.date,
      time: data.time,
      status: 'pending',
      payment_method_id: data.paymentMethodId ?? null,
      notes: data.notes ?? null,
    };

    // 5. Gestion du client pour les réservations invitées
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

    // 6. Insérer le rendez-vous
    const { error: insertError } = await supabase
      .from('appointments')
      .insert(row);
    if (insertError) throw insertError;

    // 7. Récupérer le rendez-vous créé
    const { data: rows, error: selError } = await supabase
      .from('appointments')
      .select(`
        *,
        payment_method:payment_method_id (
          id,
          name,
          label,
          icon
        )
      `)
      .eq('client_name', data.clientName)
      .eq('phone', data.phone)
      .eq('date', data.date)
      .eq('time', data.time)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selError) throw selError;
    if (!rows || rows.length === 0) {
      // Fallback
      return {
        id: '',
        clientId: data.clientId,
        clientName: data.clientName,
        phone: data.phone,
        email: data.email,
        services: services,
        date: data.date,
        time: data.time,
        status: 'pending',
        paymentMethodId: data.paymentMethodId,
        notes: data.notes,
      };
    }

    const appointment = rowToAppointment(rows[0] as AppointmentRow);

    // 8. Créer un rappel pour le rendez-vous (avec le premier service pour le nom)
    try {
      const settings = await reminderSettingsService.get();
      if (settings.enabled) {
        const serviceNames = appointment.services.map(s => s.name).join(' + ');
        await reminderService.create({
          appointmentId: appointment.id,
          clientName: appointment.clientName,
          clientPhone: appointment.phone,
          clientEmail: appointment.email,
          serviceName: serviceNames, // ✅ Nom des services combinés
          appointmentDate: appointment.date,
          appointmentTime: appointment.time,
          delayHours: settings.delayHours,
          recipients: settings.recipients,
        });
        console.log(`✅ Rappel créé pour le rendez-vous ${appointment.id}`);
      }
    } catch (reminderError) {
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

    const row = patchToRow(data);

    // ✅ Si les services sont modifiés
    if (data.serviceIds !== undefined) {
      if (data.serviceIds.length === 0) {
        throw new Error('Au moins un service est requis');
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .in('id', data.serviceIds);

      if (servicesError) throw servicesError;
      if (!servicesData || servicesData.length === 0) {
        throw new Error('Services non trouvés');
      }

      const services: ServiceItem[] = servicesData.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
      }));

      // ✅ Mettre à jour les services dans le JSON
      (row as any).services = services;
    }

    const { data: updatedRow, error } = await supabase
      .from('appointments')
      .update(row)
      .eq('id', id)
      .select(`
        *,
        payment_method:payment_method_id (
          id,
          name,
          label,
          icon
        )
      `)
      .single();

    if (error) throw error;
    
    const appointment = rowToAppointment(updatedRow as AppointmentRow);

    // Si le rendez-vous est confirmé et que les rappels sont activés
    if (data.status === 'confirmed' && !data.date && !data.time && !data.serviceIds) {
      try {
        const settings = await reminderSettingsService.get();
        if (settings.enabled) {
          await reminderService.deleteByAppointmentId(id);
          
          const serviceNames = appointment.services.map(s => s.name).join(' + ');
          await reminderService.create({
            appointmentId: appointment.id,
            clientName: appointment.clientName,
            clientPhone: appointment.phone,
            clientEmail: appointment.email,
            serviceName: serviceNames,
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
        await reminderService.deleteByAppointmentId(id);
        
        const settings = await reminderSettingsService.get();
        if (settings.enabled) {
          const serviceNames = appointment.services.map(s => s.name).join(' + ');
          await reminderService.create({
            appointmentId: appointment.id,
            clientName: appointment.clientName,
            clientPhone: appointment.phone,
            clientEmail: appointment.email,
            serviceName: serviceNames,
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
    return appointment;
  },

  async delete(id: string): Promise<void> {
    try {
      await reminderService.deleteByAppointmentId(id);
      console.log(`🗑️ Rappels supprimés pour le rendez-vous ${id}`);
    } catch (reminderError) {
      console.error('Erreur lors de la suppression des rappels:', reminderError);
    }

    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
  },
};