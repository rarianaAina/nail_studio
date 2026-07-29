import { supabase } from '@/lib/supabase';
import type { PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto } from '@/types/payment';

interface PaymentMethodRow {
  id: string;
  name: string;
  label: string;
  icon: string | null;
  active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

function rowToPaymentMethod(r: PaymentMethodRow): PaymentMethod {
  return {
    id: r.id,
    name: r.name,
    label: r.label,
    icon: r.icon ?? undefined,
    active: r.active,
    sortOrder: r.sort_order,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const paymentService = {
  async getAll(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as PaymentMethodRow[]).map(rowToPaymentMethod);
  },

  async getActive(): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as PaymentMethodRow[]).map(rowToPaymentMethod);
  },

  async create(data: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const { data: created, error } = await supabase
      .from('payment_methods')
      .insert({
        name: data.name,
        label: data.label,
        icon: data.icon ?? null,
        active: data.active ?? true,
        sort_order: data.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return rowToPaymentMethod(created as PaymentMethodRow);
  },

  async update(id: string, data: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.label !== undefined) row.label = data.label;
    if (data.icon !== undefined) row.icon = data.icon ?? null;
    if (data.active !== undefined) row.active = data.active;
    if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;

    const { data: updated, error } = await supabase
      .from('payment_methods')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return rowToPaymentMethod(updated as PaymentMethodRow);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleActive(id: string, active: boolean): Promise<PaymentMethod> {
    return paymentService.update(id, { active });
  },

  async reorder(ids: string[]): Promise<void> {
    const updates = ids.map((id, index) => ({
      id,
      sort_order: index,
    }));

    const { error } = await supabase
      .from('payment_methods')
      .upsert(updates);

    if (error) throw error;
  },
};