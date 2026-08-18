import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseSecretKey);

/**
 * Service-role client — bypasses RLS entirely, so it must only ever be used
 * server-side (never shipped to a client) and only for operations that
 * genuinely need to act across users: writing an order after validating it
 * against the Mongo product/store catalog, admin-dashboard reads across all
 * customers' complaints/orders/chat, etc. Anything a user can legitimately do
 * to their own rows should go through the app's own anon-key client instead,
 * where RLS still applies.
 */
export const supabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseSecretKey || 'placeholder-key', {
  auth: { autoRefreshToken: false, persistSession: false },
});
