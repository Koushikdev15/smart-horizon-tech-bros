const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  timestamp: string;
}

// Module-scoped rather than routed through Zustand: every apiRequest call
// (including ones made from services that run before authStore has set the
// user, like registrationService's post-register health-profile write) needs
// the current token synchronously, without importing the store and risking a
// cycle. authStore/authService call setAuthToken whenever the token changes.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Thin fetch wrapper for the HerbChain Express backend. Talks to the same
 * `{success, message, data, errors, timestamp}` envelope every controller in
 * herbchain_backend returns (see utils/response.ts), and throws ApiError so
 * callers can branch on `.status` without re-parsing the body.
 *
 * `timeoutMs` is opt-in (no timeout by default, matching prior behavior) —
 * meaningfully larger requests, like a base64-encoded audio/image attachment,
 * can sit on a slow connection far longer than a normal JSON call before
 * genuinely failing, and fetch has no built-in timeout of its own.
 */
export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}, timeoutMs?: number): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const controller = timeoutMs ? new AbortController() : undefined;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller?.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(0, 'The request timed out — check your connection and try again.');
    }
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.");
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  let body: ApiEnvelope<T> | undefined;
  try {
    body = await response.json();
  } catch {
    // Some error responses (e.g. a proxy 502) may not carry a JSON body.
  }

  if (!response.ok || !body?.success) {
    throw new ApiError(response.status, body?.message || `Request failed (${response.status})`, body?.errors);
  }

  return body.data as T;
}
