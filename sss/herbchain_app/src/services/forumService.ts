import { supabase } from '@/lib/supabase';

export type ForumPostType = 'question' | 'thought';

export interface ForumPost {
  id: string;
  userId: string;
  authorName: string;
  postType: ForumPostType;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
}

export interface ForumComment {
  id: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

function mapPostRow(row: any, myUserId: string | null): ForumPost {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.app_login?.full_name || 'AyurTrace+ Member',
    postType: row.post_type,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    commentCount: row.forum_comments?.[0]?.count ?? 0,
    likeCount: row.forum_likes?.[0]?.count ?? 0,
    likedByMe: myUserId ? (row.forum_likes ?? []).some((l: any) => l.user_id === myUserId) : false,
  };
}

async function getMyUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export const forumService = {
  async listPosts(type: ForumPostType): Promise<ForumPost[]> {
    const myUserId = await getMyUserId();
    const { data, error } = await supabase
      .from('forum_posts')
      .select(
        'id, user_id, post_type, title, body, image_url, created_at, app_login!forum_posts_user_id_fkey(full_name), forum_comments(count), forum_likes(user_id)'
      )
      .eq('post_type', type)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row) => mapPostRow(row, myUserId));
  },

  async getPost(id: string): Promise<ForumPost | null> {
    const myUserId = await getMyUserId();
    const { data, error } = await supabase
      .from('forum_posts')
      .select(
        'id, user_id, post_type, title, body, image_url, created_at, app_login!forum_posts_user_id_fkey(full_name), forum_comments(count), forum_likes(user_id)'
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapPostRow(data, myUserId) : null;
  },

  async createPost(input: { postType: ForumPostType; title: string; body: string; imageUrl?: string }): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ user_id: user.id, post_type: input.postType, title: input.title, body: input.body, image_url: input.imageUrl ?? null })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  /** Uploads a post image to the public forum-content bucket and returns its public URL. */
  async uploadImage(uri: string): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('forum-content').upload(path, blob, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('forum-content').getPublicUrl(path);
    return data.publicUrl;
  },

  async listComments(postId: string): Promise<ForumComment[]> {
    const { data, error } = await supabase
      .from('forum_comments')
      .select('id, user_id, body, created_at, app_login(full_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      authorName: row.app_login?.full_name || 'AyurTrace+ Member',
      body: row.body,
      createdAt: row.created_at,
    }));
  },

  async addComment(postId: string, body: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');
    const { error } = await supabase.from('forum_comments').insert({ post_id: postId, user_id: user.id, body });
    if (error) throw error;
  },

  async toggleLike(postId: string, currentlyLiked: boolean): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    if (currentlyLiked) {
      const { error } = await supabase.from('forum_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('forum_likes').insert({ post_id: postId, user_id: user.id });
      if (error) throw error;
    }
  },
};
