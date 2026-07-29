import { supabase } from '@/lib/supabase';
import type { SalonSettings, BusinessHours } from '@/types';

interface BusinessSettingsRow {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  facebook: string | null;
  instagram: string | null;
  email: string;
  hours: BusinessHours[];
  primary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToSettings(r: BusinessSettingsRow): SalonSettings {
  return {
    id: r.id,
    name: r.name,
    tagline: r.tagline,
    address: r.address,
    phone: r.phone,
    whatsapp: r.whatsapp,
    facebook: r.facebook ?? '',
    instagram: r.instagram ?? '',
    email: r.email,
    hours: r.hours,
    primaryColor: r.primary_color ?? undefined,
    accentColor: r.accent_color ?? undefined,
    logoUrl: r.logo_url ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const settingsService = {
  async get(): Promise<SalonSettings> {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    console.log('📦 Data brut:', data);
    console.log('❌ Error:', error);
    if (!data) {
      // Fallback defaults if no settings row exists yet
      return {
        name: 'Harrys Studio',
        tagline: "L'art des ongles, sublimé",
        address: '',
        phone: '',
        whatsapp: '',
        facebook: '',
        instagram: '',
        email: '',
        hours: [],
      };
    }
    return rowToSettings(data as BusinessSettingsRow);
  },

  async update(data: Partial<SalonSettings>): Promise<SalonSettings> {
    const { data: existing } = await supabase
      .from('business_settings')
      .select('id')
      .maybeSingle();

    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.tagline !== undefined) row.tagline = data.tagline;
    if (data.address !== undefined) row.address = data.address;
    if (data.phone !== undefined) row.phone = data.phone;
    if (data.whatsapp !== undefined) row.whatsapp = data.whatsapp;
    if (data.facebook !== undefined) row.facebook = data.facebook;
    if (data.instagram !== undefined) row.instagram = data.instagram;
    if (data.email !== undefined) row.email = data.email;
    if (data.hours !== undefined) row.hours = data.hours;
    if (data.primaryColor !== undefined) row.primary_color = data.primaryColor;
    if (data.accentColor !== undefined) row.accent_color = data.accentColor;
    if (data.logoUrl !== undefined) row.logo_url = data.logoUrl;

    if (existing) {
      const { data: updated, error } = await supabase
        .from('business_settings')
        .update(row)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return rowToSettings(updated as BusinessSettingsRow);
    } else {
      const { data: created, error } = await supabase
        .from('business_settings')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return rowToSettings(created as BusinessSettingsRow);
    }
  },
};
