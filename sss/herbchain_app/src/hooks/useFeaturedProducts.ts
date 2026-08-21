import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface FeaturedProduct {
  id: string;
  productId: string | null;
  imageUrl: string;
  title: string;
  shortDescription: string | null;
}

interface UseFeaturedProductsResult {
  products: FeaturedProduct[];
  loading: boolean;
  error: string | null;
}

/**
 * Active, in-schedule rows from public.featured_products
 * (see herbchain_app/supabase/migrations/0009_featured_products.sql,
 * 0010_featured_products_placement.sql), ordered for the carousel. RLS
 * already filters is_active/date range server-side, and grants anon read
 * access — this loads before login. `placement` distinguishes the login
 * screen's carousel content from the home screen's.
 */
export function useFeaturedProducts(placement: 'login' | 'home' = 'login'): UseFeaturedProductsResult {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error: fetchError } = await supabase
        .from('featured_products')
        .select('id, product_id, image_url, title, short_description')
        .eq('placement', placement)
        .order('display_order', { ascending: true })
        .limit(8);

      if (cancelled) return;

      if (fetchError) {
        // Never surfaced to the user directly — the carousel just doesn't render.
        setError(fetchError.message);
        setProducts([]);
      } else {
        setProducts(
          (data ?? []).map((row) => ({
            id: row.id,
            productId: row.product_id,
            imageUrl: row.image_url,
            title: row.title,
            shortDescription: row.short_description,
          }))
        );
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [placement]);

  return { products, loading, error };
}
