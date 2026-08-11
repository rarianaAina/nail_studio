import { supabase } from '@/lib/supabase';
import type { Service, CreateServiceDto, UpdateServiceDto, ServiceCategory } from '@/types';

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  image: string;
  additional_images: string[] | null;
  popular: boolean;
  active: boolean;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToService(r: ServiceRow): Service {
  return {
    id: r.id,
    name: r.name,
    category: r.category as ServiceCategory,
    description: r.description,
    duration: r.duration,
    price: r.price,
    image: r.image,
    additionalImages: r.additional_images || [],
    popular: r.popular,
    active: r.active,
    sortOrder: r.sort_order ?? 0,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const nailServiceService = {
  async getAll(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data as ServiceRow[]).map(rowToService);
  },

  async getPopular(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('popular', true)
      .eq('active', true)
      .order('sort_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data as ServiceRow[]).map(rowToService);
  },

  async getByCategory(category: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('category', category)
      .eq('active', true)
      .order('sort_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data as ServiceRow[]).map(rowToService);
  },

  async getById(id: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToService(data as ServiceRow);
  },

  async create(data: CreateServiceDto): Promise<Service> {
    // ✅ Convertir camelCase en snake_case pour la DB
    const dbData: Record<string, unknown> = {
      name: data.name,
      category: data.category,
      description: data.description,
      duration: data.duration,
      price: data.price,
      image: data.image,
      popular: data.popular ?? false,
      // ✅ active n'est pas dans CreateServiceDto, on met une valeur par défaut
      active: true,
      sort_order: data.sortOrder ?? 0,
    };

    // ✅ Gérer additionalImages
    if (data.additionalImages && data.additionalImages.length > 0) {
      dbData.additional_images = data.additionalImages;
    }

    const { data: row, error } = await supabase
      .from('services')
      .insert(dbData)
      .select()
      .single();
    if (error) throw error;
    return rowToService(row as ServiceRow);
  },

  async update(id: string, data: UpdateServiceDto): Promise<Service> {
    const row: Record<string, unknown> = {};
    
    if (data.name !== undefined) row.name = data.name;
    if (data.category !== undefined) row.category = data.category;
    if (data.description !== undefined) row.description = data.description;
    if (data.duration !== undefined) row.duration = data.duration;
    if (data.price !== undefined) row.price = data.price;
    if (data.image !== undefined) row.image = data.image;
    if (data.popular !== undefined) row.popular = data.popular;
    if (data.active !== undefined) row.active = data.active;
    
    // ✅ Convertir sortOrder en sort_order
    if (data.sortOrder !== undefined) {
      row.sort_order = data.sortOrder;
    }
    
    // ✅ Gérer additionalImages
    if (data.additionalImages !== undefined) {
      row.additional_images = data.additionalImages;
    }

    const { data: updated, error } = await supabase
      .from('services')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToService(updated as ServiceRow);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },
};