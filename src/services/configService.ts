import { supabase } from '@/lib/supabase';
import type { ServiceCategoryConfig, TimeSlotConfig, CreateCategoryDto, CreateTimeSlotDto } from '@/types/config';

interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

interface SlotRow {
  id: string;
  date: string;        // ✅ Date spécifique
  label: string;
  sort_order: number;
  active: boolean;
}

function rowToCategory(r: CategoryRow): ServiceCategoryConfig {
  return { id: r.id, name: r.name, sortOrder: r.sort_order, active: r.active };
}

function rowToSlot(r: SlotRow): TimeSlotConfig {
  return { 
    id: r.id, 
    date: r.date,      // ✅ Date spécifique
    label: r.label, 
    sortOrder: r.sort_order, 
    active: r.active 
  };
}

export const configService = {
  async getCategories(): Promise<ServiceCategoryConfig[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as CategoryRow[]).map(rowToCategory);
  },

  async getActiveCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('name')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as Pick<CategoryRow, 'name'>[]).map((r) => r.name);
  },

  async createCategory(data: CreateCategoryDto): Promise<ServiceCategoryConfig> {
    const { data: row, error } = await supabase
      .from('service_categories')
      .insert({ name: data.name, sort_order: data.sortOrder ?? 0 })
      .select()
      .single();
    if (error) throw error;
    return rowToCategory(row as CategoryRow);
  },

  async updateCategory(id: string, data: Partial<ServiceCategoryConfig>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
    if (data.active !== undefined) row.active = data.active;
    const { error } = await supabase.from('service_categories').update(row).eq('id', id);
    if (error) throw error;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('service_categories').delete().eq('id', id);
    if (error) throw error;
  },

  // ✅ Récupérer tous les créneaux
  async getTimeSlots(): Promise<TimeSlotConfig[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('date', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as SlotRow[]).map(rowToSlot);
  },

  // ✅ Récupérer les créneaux pour une date spécifique
  async getTimeSlotsByDate(date: string): Promise<TimeSlotConfig[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('date', date)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as SlotRow[]).map(rowToSlot);
  },

  // ✅ Récupérer les créneaux actifs pour une date spécifique
  async getActiveTimeSlotsByDate(date: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('label')
      .eq('date', date)
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as Pick<SlotRow, 'label'>[]).map((r) => r.label);
  },

  // ✅ Récupérer tous les créneaux actifs (pour compatibilité)
  async getActiveTimeSlots(): Promise<string[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('label')
      .eq('active', true)
      .order('date', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as Pick<SlotRow, 'label'>[]).map((r) => r.label);
  },

  // ✅ Créer un créneau avec date
  async createTimeSlot(data: CreateTimeSlotDto): Promise<TimeSlotConfig> {
    const { data: row, error } = await supabase
      .from('time_slots')
      .insert({ 
        date: data.date,      // ✅ Date spécifique
        label: data.label, 
        sort_order: data.sortOrder ?? 0,
        active: data.active ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToSlot(row as SlotRow);
  },

  async updateTimeSlot(id: string, data: Partial<TimeSlotConfig>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (data.date !== undefined) row.date = data.date;
    if (data.label !== undefined) row.label = data.label;
    if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
    if (data.active !== undefined) row.active = data.active;
    const { error } = await supabase.from('time_slots').update(row).eq('id', id);
    if (error) throw error;
  },

  async deleteTimeSlot(id: string): Promise<void> {
    const { error } = await supabase.from('time_slots').delete().eq('id', id);
    if (error) throw error;
  },

  // ✅ Supprimer tous les créneaux d'une date
  async deleteTimeSlotsByDate(date: string): Promise<void> {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('date', date);
    if (error) throw error;
  },

  // ✅ Copier les créneaux d'une date vers une autre
  async copyTimeSlots(fromDate: string, toDate: string): Promise<void> {
    const { data: sourceSlots } = await supabase
      .from('time_slots')
      .select('label, sort_order, active')
      .eq('date', fromDate);

    if (!sourceSlots || sourceSlots.length === 0) {
      throw new Error('Aucun créneau à copier');
    }

    // Supprimer les créneaux existants de la date cible
    await supabase
      .from('time_slots')
      .delete()
      .eq('date', toDate);

    // Insérer les nouveaux créneaux
    const newSlots = sourceSlots.map(s => ({
      date: toDate,
      label: s.label,
      sort_order: s.sort_order,
      active: s.active,
    }));

    const { error } = await supabase
      .from('time_slots')
      .insert(newSlots);

    if (error) throw error;
  },
};