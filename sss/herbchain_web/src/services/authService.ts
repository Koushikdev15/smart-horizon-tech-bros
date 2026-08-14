import { supabase } from '../lib/supabase';
import type { Member, User, UserRole } from '../types';

export interface AuthFailure {
  title: string;
  message: string;
}

export type SignInResult =
  | { ok: true; user: User; token: string }
  | { ok: false; error: AuthFailure };

/** Non-Active members get a specific explanation rather than "invalid credentials". */
const STATUS_MESSAGES: Record<string, AuthFailure> = {
  Pending: {
    title: 'Registration pending approval',
    message:
      'Your registration has not been approved yet. A Government administrator must approve your account before you can sign in.',
  },
  Rejected: {
    title: 'Registration rejected',
    message: 'Your registration was rejected. Please contact your Government administrator.',
  },
  Suspended: {
    title: 'Account suspended',
    message: 'This account is currently suspended. Please contact your Government administrator.',
  },
  Disabled: {
    title: 'Account disabled',
    message: 'This account has been disabled. Please contact your Government administrator.',
  },
};

function mapAuthError(message: string): AuthFailure {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return { title: 'Incorrect credentials', message: 'The email or password is incorrect.' };
  }
  if (m.includes('email not confirmed')) {
    return {
      title: 'Email not verified',
      message: 'Verify your email address before signing in.',
    };
  }
  if (m.includes('rate') || m.includes('too many')) {
    return { title: 'Too many attempts', message: 'Please wait a moment and try again.' };
  }
  if (m.includes('fetch') || m.includes('network')) {
    return { title: 'Connection problem', message: "Couldn't reach the server. Check your connection." };
  }
  return { title: 'Sign-in failed', message };
}

function memberToUser(member: Member): User {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    ayurvedicId: member.ayurvedicId,
    mobile: member.phone,
    organizationName: member.organizationName,
    role: member.role,
    region: member.region,
    status: member.status as User['status'],
  };
}

export const authService = {
  /**
   * Signs a member in with the credentials issued during registration.
   *
   * The password is verified by Supabase Auth (never stored in `members`); the
   * Ayurvedic ID and the selected role are then checked against the member
   * record for that same email, so a valid password alone is not enough — the
   * ID must match the account, and the role must be the one it was granted.
   *
   * The role is checked against the database, never taken from the form: picking
   * "Government" on the login screen cannot escalate a Collection Center account.
   */
  async signInWithAyurvedicId(
    ayurvedicId: string,
    email: string,
    password: string,
    expectedRole?: UserRole,
  ): Promise<SignInResult> {
    const normalisedEmail = email.trim().toLowerCase();
    const normalisedId = ayurvedicId.trim().toUpperCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalisedEmail,
      password,
    });

    if (error) return { ok: false, error: mapAuthError(error.message) };
    if (!data.session) {
      return {
        ok: false,
        error: { title: 'Sign-in failed', message: 'No session was returned. Please try again.' },
      };
    }

    // Look the member up by email — the authenticated identity — then confirm the
    // supplied Ayurvedic ID belongs to it.
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('email', normalisedEmail)
      .maybeSingle();

    if (memberError) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: { title: 'Lookup failed', message: `Could not load your member record: ${memberError.message}` },
      };
    }

    if (!member) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: {
          title: 'No member record',
          message: 'This account has no member registration. Contact your Government administrator.',
        },
      };
    }

    if ((member.ayurvedicId ?? '').toUpperCase() !== normalisedId) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: {
          title: 'Ayurvedic ID mismatch',
          message: 'That Ayurvedic ID does not match this email address.',
        },
      };
    }

    if (expectedRole && member.role !== expectedRole) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: {
          title: 'Wrong role selected',
          message: `This account is registered as ${member.role}, not ${expectedRole}. Select the correct role and try again.`,
        },
      };
    }

    if (member.status !== 'Active') {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: STATUS_MESSAGES[member.status] ?? {
          title: 'Account unavailable',
          message: `This account is ${member.status}.`,
        },
      };
    }

    return {
      ok: true,
      user: memberToUser(member as Member),
      token: data.session.access_token,
    };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};
