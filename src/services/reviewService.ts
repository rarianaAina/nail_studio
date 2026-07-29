import { supabase } from '@/lib/supabase';
import type { Review } from '@/types';

interface ReviewRow {
  id: string;
  name: string;
  rating: number;
  comment: string;
  service: string | null;
  verified: boolean;
  date: string;
  created_at: string | null;
  updated_at: string | null;
}

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    service: r.service ?? undefined,
    verified: r.verified,
    date: r.date,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export const reviewService = {
  async getAll(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data as ReviewRow[]).map(rowToReview);
  },

  async getRecent(limit = 4): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as ReviewRow[]).map(rowToReview);
  },

  async getAverageRating(): Promise<number> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating');
    if (error) throw error;
    const rows = data as Pick<ReviewRow, 'rating'>[];
    if (rows.length === 0) return 0;
    const sum = rows.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / rows.length) * 10) / 10;
  },
};
