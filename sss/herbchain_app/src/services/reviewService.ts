import { supabase } from '@/lib/supabase';

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ProductReviewStats {
  productId: string;
  avgRating: number;
  reviewCount: number;
}

function mapReviewRow(row: any): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    authorName: row.app_login?.full_name || 'AyurTrace+ Member',
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export const reviewService = {
  async getStats(productId: string): Promise<ProductReviewStats> {
    const { data, error } = await supabase
      .from('product_review_stats')
      .select('product_id, avg_rating, review_count')
      .eq('product_id', productId)
      .maybeSingle();
    if (error) throw error;
    return {
      productId,
      avgRating: data ? Number(data.avg_rating) : 0,
      reviewCount: data ? Number(data.review_count) : 0,
    };
  },

  /** Batched stats fetch for a list screen — one query for all visible product ids. */
  async getStatsForMany(productIds: string[]): Promise<Record<string, ProductReviewStats>> {
    if (productIds.length === 0) return {};
    const { data, error } = await supabase
      .from('product_review_stats')
      .select('product_id, avg_rating, review_count')
      .in('product_id', productIds);
    if (error) throw error;
    const result: Record<string, ProductReviewStats> = {};
    for (const row of data ?? []) {
      result[row.product_id] = {
        productId: row.product_id,
        avgRating: Number(row.avg_rating),
        reviewCount: Number(row.review_count),
      };
    }
    return result;
  },

  async list(productId: string): Promise<ProductReview[]> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, user_id, rating, comment, created_at, app_login(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReviewRow);
  },

  async getMyReview(productId: string): Promise<ProductReview | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, user_id, rating, comment, created_at, app_login(full_name)')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapReviewRow(data) : null;
  },

  async submit(productId: string, rating: number, comment?: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const { error } = await supabase
      .from('product_reviews')
      .upsert(
        { product_id: productId, user_id: user.id, rating, comment: comment?.trim() || null, updated_at: new Date().toISOString() },
        { onConflict: 'product_id,user_id' }
      );
    if (error) throw error;
  },
};
