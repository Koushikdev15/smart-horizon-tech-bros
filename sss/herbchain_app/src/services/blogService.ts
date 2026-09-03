import { supabase } from '@/lib/supabase';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
}

function mapRow(row: any): BlogPost {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    imageUrl: row.image_url,
    author: row.author,
    publishedAt: row.published_at,
  };
}

const SELECT_FIELDS = 'id, title, excerpt, body, image_url, author, published_at';

export const blogService = {
  async listRecent(limit = 10): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT_FIELDS)
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async getById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase.from('blog_posts').select(SELECT_FIELDS).eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  },
};
