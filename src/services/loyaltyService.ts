import { supabase } from '@/lib/supabase';

export interface LoyaltySettings {
  id: string;
  pointsPerVisit: number;
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
        .insert({ points_per_visit: 10 })
        .select()
        .single();

      if (createError) throw createError;
      return {
        id: created.id,
        pointsPerVisit: created.points_per_visit,
        updatedAt: created.updated_at,
      };
    }

    return {
      id: data.id,
      pointsPerVisit: data.points_per_visit,
      updatedAt: data.updated_at,
    };
  },

  // Mettre à jour les paramètres de fidélité
  async updateSettings(pointsPerVisit: number): Promise<LoyaltySettings> {
    const { data: existing } = await supabase
      .from('loyalty_settings')
      .select('id')
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .update({ points_per_visit: pointsPerVisit })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        pointsPerVisit: data.points_per_visit,
        updatedAt: data.updated_at,
      };
    } else {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .insert({ points_per_visit: pointsPerVisit })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        pointsPerVisit: data.points_per_visit,
        updatedAt: data.updated_at,
      };
    }
  },
};