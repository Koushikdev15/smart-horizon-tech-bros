import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * One realtime channel per table, shared by every listener.
 *
 * `supabase.channel(name)` returns the *same* channel instance for a given
 * name, and calling `.on()` on it after it has been subscribed throws:
 *
 *     cannot add `postgres_changes` callbacks for realtime:batches-changes
 *     after `subscribe()`
 *
 * Each store used to open its own channel per mount, which was fine while only
 * one hook consumed it. As soon as a screen used two hooks that both watch the
 * same table — the Reports page reads network stats *and* the audit trail —
 * the second call threw inside an effect and blanked the page.
 *
 * So the channel is created once and reference-counted: listeners are added to
 * a set, and the channel is torn down when the last one goes away.
 */

type Listener = () => void;

const registry = new Map<string, { channel: RealtimeChannel; listeners: Set<Listener> }>();

export function subscribeToTable(table: string, listener: Listener): () => void {
  let entry = registry.get(table);

  if (!entry) {
    const listeners = new Set<Listener>();
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        // Copied before iterating: a listener may unsubscribe in response.
        [...listeners].forEach((l) => l());
      })
      .subscribe();
    entry = { channel, listeners };
    registry.set(table, entry);
  }

  entry.listeners.add(listener);

  return () => {
    const current = registry.get(table);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      supabase.removeChannel(current.channel);
      registry.delete(table);
    }
  };
}
