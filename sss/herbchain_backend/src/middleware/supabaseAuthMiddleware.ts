import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface SupabaseAuthRequest extends Request {
  /** The Supabase auth.users UUID, distinct from Mongo's authenticateJWT req.user (ObjectId + role). */
  supabaseUser?: { id: string; email?: string };
}

const supabaseUrl = process.env.SUPABASE_URL;

// Verified against the project's public JWKS rather than a shared secret —
// this is Supabase's current recommendation (asymmetric signing keys), and
// it means key rotation on Supabase's side never requires a redeploy here.
// Built once at module scope: createRemoteJWKSet caches keys internally.
const jwks = supabaseUrl ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)) : null;

/** Verifies a Supabase Auth access token — used only on the customer-facing
 *  routes that still touch this backend (order placement, the AI chat proxy).
 *  Every other route keeps using the Mongo-JWT authenticateJWT untouched. */
export const authenticateSupabaseJWT = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }
  if (!jwks || !supabaseUrl) {
    return res.status(500).json({ success: false, message: 'Supabase auth is not configured on the server.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });
    if (!payload.sub) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
    req.supabaseUser = { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};
