/**
 * Where a product's QR code should point.
 *
 * Derived at render time rather than stored on the product, because an
 * absolute URL captured at creation time bakes in whichever host happened to be
 * used — a product created on `localhost:5173` would carry a QR that no phone
 * can ever resolve, for the rest of its life.
 *
 * Resolution order:
 *   1. VITE_PUBLIC_BASE_URL — set this in production (and to your LAN address
 *      during development) so codes always point somewhere publicly reachable.
 *   2. The current origin — correct whenever the app is opened on the host that
 *      scanners can also reach.
 */
const configuredBase = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim();

export function verifyBaseUrl(): string {
  if (configuredBase) return configuredBase.replace(/\/+$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function verifyUrlFor(productCode: string): string {
  return `${verifyBaseUrl()}/verify/${productCode}`;
}

/**
 * True when the resolved base is an address only this machine can reach, so a
 * phone camera would scan a code it cannot open. The UI warns rather than
 * silently producing a dead QR.
 */
export function isUnreachableFromPhone(base = verifyBaseUrl()): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:|\/|$)/i.test(base);
}
