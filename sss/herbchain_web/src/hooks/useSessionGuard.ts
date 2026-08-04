import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

const CHECK_INTERVAL_MS = 15_000; // how often to re-validate the session
const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes of no interaction -> auto logout
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

/**
 * Enterprise-grade session enforcement for the authenticated app shell:
 *  1. Hard session expiry — logs out once `expiresAt` (set at login) has passed.
 *  2. Idle timeout — logs out after `IDLE_LIMIT_MS` of no mouse/keyboard/touch activity.
 * Both paths route back to /login with a toast so the user understands why they were signed out.
 * Mount this once, inside the authenticated shell (GlobalLayout).
 */
export function useSessionGuard() {
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    const markActive = () => { lastActivityRef.current = Date.now(); };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const forceLogout = (reason: string) => {
      useAuthStore.getState().logout();
      toast.error(reason);
      navigate('/login', { replace: true });
    };

    const interval = window.setInterval(() => {
      const { user, isSessionValid } = useAuthStore.getState();
      if (!user) return;

      if (!isSessionValid()) {
        forceLogout('Your session has expired. Please sign in again.');
        return;
      }

      if (Date.now() - lastActivityRef.current > IDLE_LIMIT_MS) {
        forceLogout('You were logged out due to inactivity.');
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActive));
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
