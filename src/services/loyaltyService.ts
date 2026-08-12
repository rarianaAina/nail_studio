import { supabase } from '@/lib/supabase';

export interface LoyaltySettings {
  id: string;
  pointsPerEuro: number;
  updatedAt?: string;
}

export const loyaltyService = {
  // Récupérer les points d'un client
  async getClientPoints(clientId: string): Promise<number> {
    const { data, error } = await supabase
      .from('clients')
      .select('loyalty_points')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return data?.loyalty_points ?? 0;
  },

  // Récupérer les points d'un client par user_id
  async getClientPointsByUserId(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('clients')
      .select('loyalty_points')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.loyalty_points ?? 0;
  },

  // Récupérer les paramètres de fidélité
  async getSettings(): Promise<LoyaltySettings> {
    const { data, error } = await supabase
      .from('loyalty_settings')
      .select('*')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Créer les paramètres par défaut
      const { data: created, error: createError } = await supabase
        .from('loyalty_settings')
        .insert({ points_per_euro: 1 })
        .select()
        .single();

      if (createError) throw createError;
      return {
        id: created.id,
        pointsPerEuro: created.points_per_euro,
        updatedAt: created.updated_at,
      };
    }

    return {
      id: data.id,
      pointsPerEuro: data.points_per_euro,
      updatedAt: data.updated_at,
    };
  },

  // Mettre à jour les paramètres de fidélité
  async updateSettings(pointsPerEuro: number): Promise<LoyaltySettings> {
    const { data: existing } = await supabase
      .from('loyalty_settings')
      .select('id')
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .update({ points_per_euro: pointsPerEuro })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        pointsPerEuro: data.points_per_euro,
        updatedAt: data.updated_at,
      };
    } else {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .insert({ points_per_euro: pointsPerEuro })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        pointsPerEuro: data.points_per_euro,
        updatedAt: data.updated_at,
      };
    }
  },
};