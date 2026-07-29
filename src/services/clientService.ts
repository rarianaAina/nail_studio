import { supabase } from '@/lib/supabase';
import type { Client, CreateClientDto, UpdateClientDto } from '@/types';

interface ClientRow {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  visit_count: number;
  total_spent: number;
  last_visit: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToClient(r: ClientRow): Client {
  return {
    id: r.id,
    userId: r.user_id ?? undefined,
    name: r.name,
    phone: r.phone,
    email: r.email ?? undefined,
    notes: r.notes ?? undefined,
    visitCount: r.visit_count,
    totalSpent: r.total_spent,
    lastVisit: r.last_visit ?? undefined,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const clientService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ClientRow[]).map(rowToClient);
  },

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToClient(data as ClientRow);
  },

  async getByEmail(email: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToClient(data as ClientRow);
  },

  async search(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ClientRow[]).map(rowToClient);
  },

  async create(data: CreateClientDto): Promise<Client> {
    const row: Record<string, unknown> = {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      notes: data.notes ?? null,
    };
    if (data.userId) row.user_id = data.userId;
    const { data: created, error } = await supabase
      .from('clients')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToClient(created as ClientRow);
  },

  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.phone !== undefined) row.phone = data.phone;
    if (data.email !== undefined) row.email = data.email ?? null;
    if (data.notes !== undefined) row.notes = data.notes ?? null;
    if (data.visitCount !== undefined) row.visit_count = data.visitCount;
    if (data.totalSpent !== undefined) row.total_spent = data.totalSpent;
    if (data.lastVisit !== undefined) row.last_visit = data.lastVisit;
    const { data: updated, error } = await supabase
      .from('clients')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToClient(updated as ClientRow);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  async getAggregates(): Promise<{ totalClients: number; totalVisits: number; totalRevenue: number }> {
    const { data, error } = await supabase
      .from('clients')
      .select('visit_count, total_spent');
    if (error) throw error;
    const rows = data as Pick<ClientRow, 'visit_count' | 'total_spent'>[];
    return {
      totalClients: rows.length,
      totalVisits: rows.reduce((s, r) => s + r.visit_count, 0),
      totalRevenue: rows.reduce((s, r) => s + r.total_spent, 0),
    };
  },
};
