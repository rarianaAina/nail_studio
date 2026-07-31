import { supabase } from '@/lib/supabase';
import type { SpecialInfo, CreateSpecialInfoDto, UpdateSpecialInfoDto } from '@/types';

export const specialInfoService = {
  async getAll(): Promise<SpecialInfo[]> {
    const { data, error } = await supabase
      .from('special_infos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as SpecialInfo[];
  },

  async getActive(): Promise<SpecialInfo[]> {
    const { data, error } = await supabase
      .from('special_infos')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as SpecialInfo[];
  },

  async create(data: CreateSpecialInfoDto): Promise<SpecialInfo> {
    const { data: created, error } = await supabase
      .from('special_infos')
      .insert({
        title: data.title,
        content: data.content,
        icon: data.icon || '✨',
        active: data.active ?? true,
        sort_order: data.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return created as SpecialInfo;
  },

  async update(id: string, data: UpdateSpecialInfoDto): Promise<SpecialInfo> {
    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) row.title = data.title;
    if (data.content !== undefined) row.content = data.content;
    if (data.icon !== undefined) row.icon = data.icon;
    if (data.active !== undefined) row.active = data.active;
    if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;

    const { data: updated, error } = await supabase
      .from('special_infos')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as SpecialInfo;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('special_infos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async toggleActive(id: string, active: boolean): Promise<SpecialInfo> {
    return specialInfoService.update(id, { active });
  },

  async reorder(ids: string[]): Promise<void> {
    const updates = ids.map((id, index) => ({
      id,
      sort_order: index,
    }));

    const { error } = await supabase
      .from('special_infos')
      .upsert(updates);

    if (error) throw error;
  },
};