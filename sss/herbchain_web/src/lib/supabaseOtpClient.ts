import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Anon Key in environment variables');
}

/**
 * Isolated client used only for OTP email verification in Member Registration.
 * The admin submitting the form is already signed in on the main `supabase` client —
 * signInWithOtp/verifyOtp would otherwise silently replace that session with the
 * applicant's, so this client never persists, refreshes, or reads a session at all.
 */
export const supabaseOtpClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
