import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../../utils/logger';
import { IUser } from '../../models/User';

/**
 * Mirrors a copy of each new account into Supabase's public.account_mirror
 * table (see herbchain_app/supabase/migrations/0002_account_mirror.sql) for
 * the team's own records/analytics.
 *
 * This is NOT part of authentication — MongoDB + JWT (AuthService) remains
 * the only system that actually logs anyone in. This mirror is a one-way,
 * best-effort copy: if Supabase is unreachable or unconfigured, registration
 * must still succeed, so every failure here is caught and logged, never
 * thrown back to the caller.
 */
export class SupabaseMirrorService {
  private client: SupabaseClient | null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    this.client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async mirrorAccount(user: IUser): Promise<void> {
    if (!this.client) return;

    try {
      const { error } = await this.client.from('account_mirror').upsert(
        {
          mongo_user_id: String(user._id),
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          language: user.language ?? null,
          region: user.region ?? null,
        },
        { onConflict: 'mongo_user_id' }
      );
      if (error) throw error;
    } catch (err) {
      // Best-effort only — never let a Supabase hiccup break registration.
      logger.error(`[SupabaseMirrorService] mirrorAccount failed: ${(err as Error).message}`);
    }
  }
}
