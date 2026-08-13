import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Member, UserRole } from '../../types';

interface UseActiveMembersResult {
  members: Member[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Live list of Active members for a given role, read from the same `members`
 * table the Government portal approves into — so a member approved there shows
 * up here without any duplication of data.
 *
 * Subscribes to postgres changes so an approval made in another tab/portal is
 * reflected here immediately.
 */
export function useActiveMembers(role: UserRole): UseActiveMembersResult {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = () => setNonce((n) => n + 1);

  useEffect(() => {
    let cancelled = false;

    const fetchMembers = async () => {
      const { data, error: queryError } = await supabase
        .from('members')
        .select('*')
        .eq('role', role)
        .eq('status', 'Active')
        .order('registeredDate', { ascending: false });

      if (cancelled) return;

      if (queryError) {
        console.error(`Error fetching ${role} members:`, queryError);
        setError(queryError.message);
      } else {
        setError(null);
        setMembers((data ?? []) as Member[]);
      }
      setLoading(false);
    };

    fetchMembers();

    // Channel name is role-scoped so the Farmers and Wild Collectors pages do
    // not collide when both are mounted.
    const channel = supabase
      .channel(`collection-members-${role}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [role, nonce]);

  return { members, loading, error, refetch };
}
