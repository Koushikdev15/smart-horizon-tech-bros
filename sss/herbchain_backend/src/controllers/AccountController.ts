import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { sendResponse } from '../utils/response';
import { SupabaseAuthRequest } from '../middleware/supabaseAuthMiddleware';

export class AccountController {
  /**
   * Permanently deletes the caller's own account. Deleting the auth.users
   * row cascades through every user-owned table (app_login, customer_wellness,
   * customer_chat_sessions/messages, customer_orders, forum_posts,
   * product_reviews, ...) via their existing `on delete cascade` foreign
   * keys — this is one delete, not a manual per-table sweep, so any table
   * added later that correctly FKs to app_login(id) on delete cascade is
   * covered automatically. Requires the service-role key, which only the
   * backend holds — a client can never delete a Supabase Auth user directly.
   */
  deleteAccount = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(req.supabaseUser!.id);
      if (error) throw { status: 500, message: 'Could not delete account.', isOperational: true };
      return sendResponse(res, 200, true, 'Account deleted');
    } catch (err) {
      next(err);
    }
  };
}
