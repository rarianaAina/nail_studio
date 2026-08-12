import { supabase } from '@/lib/supabase';
import type { Review, ReviewStatus, SubmitReviewDto } from '@/types';

interface ReviewRow {
  id: string;
  appointment_id: string | null;
  client_id: string | null;
  name: string;
  rating: number;
  comment: string;
  service: string | null;
  image_url: string | null;
  verified: boolean;
  status: ReviewStatus;
  date: string;
  moderated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    appointmentId: r.appointment_id ?? undefined,
    clientId: r.client_id ?? undefined,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    service: r.service ?? undefined,
    imageUrl: r.image_url ?? undefined,
    verified: r.verified,
    status: r.status,
    date: r.date,
    moderatedAt: r.moderated_at ?? undefined,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const reviewService = {
  /**
   * Avis publics. La RLS ne renvoie que les avis approuvés : le filtre est
   * appliqué en base, pas ici.
   */
  async getPublished(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data as ReviewRow[]).map(rowToReview);
  },

  /** Tous les avis, quel que soit leur état — réservé à l'administratrice. */
  async getAllForModeration(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ReviewRow[]).map(rowToReview);
  },

  async getAverageRating(): Promise<number> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('status', 'approved');
    if (error) throw error;
    const rows = data as Pick<ReviewRow, 'rating'>[];
    if (rows.length === 0) return 0;
    const sum = rows.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / rows.length) * 10) / 10;
  },

  /**
   * Rendez-vous de la cliente connectée ouvrant droit à un avis : confirmés ou
   * terminés, et pas encore commentés. La règle est évaluée en base.
   */
  async getReviewableAppointmentIds(): Promise<string[]> {
    const { data, error } = await supabase.rpc('reviewable_appointments');
    if (error) throw error;
    return ((data as { appointment_id: string }[] | null) ?? []).map((r) => r.appointment_id);
  },

  async submit(dto: SubmitReviewDto): Promise<string> {
    const { data, error } = await supabase.rpc('submit_review', {
      p_appointment_id: dto.appointmentId,
      p_rating: dto.rating,
      p_comment: dto.comment,
      p_image_url: dto.imageUrl ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  async moderate(id: string, status: Exclude<ReviewStatus, 'pending'>): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .update({ status, moderated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToReview(data as ReviewRow);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
  },
};
