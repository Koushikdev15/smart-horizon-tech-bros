/**
 * Same-city heuristic: no live courier/logistics integration exists, so this
 * compares the store's city (Store.region) against the free-text delivery
 * address the user typed/saved — a substring match, not exact geocoding.
 * Good enough for a rough estimate, not authoritative for a delivery promise.
 */
export function estimateDelivery(storeRegion: string | undefined, deliveryAddress: string | undefined): string {
  if (!storeRegion) return 'Delivery in 3-5 days';
  const sameCity = Boolean(deliveryAddress) && deliveryAddress!.toLowerCase().includes(storeRegion.toLowerCase());
  return sameCity ? 'Delivery by tomorrow' : 'Delivery in 3-5 days';
}
