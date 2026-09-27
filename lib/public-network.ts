export type PublicStore = {
  id: string; name: string; city: string; state: string; type: string; description: string;
};
export type StoreFilters = { query: string; state: string; type: string };

// Explicit projection: never expose capacity, counts, rates, owners, or requests.
export const publicStoresQuery = `SELECT s.id,s.name,s.city,s.state,s.type,s.description
FROM stores s
WHERE s.status='published' AND s.capacity>(SELECT COUNT(*) FROM requests r WHERE r.store_id=s.id AND r.status='confirmed')
ORDER BY s.state,s.city,s.name`;

export function parsePublicStores(payload: unknown): PublicStore[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as {stores?: unknown}).stores)) {
    throw new Error("Invalid public retailer response.");
  }
  return (payload as {stores: unknown[]}).stores.map((row) => {
    if (!row || typeof row !== "object") throw new Error("Invalid retailer.");
    const value = row as Record<string, unknown>;
    const fields = ["id", "name", "city", "state", "type", "description"] as const;
    if (fields.some((field) => typeof value[field] !== "string") || !value.id || !value.name) {
      throw new Error("Incomplete retailer.");
    }
    // Drop unknown fields even if a future server change accidentally adds them.
    return { id: value.id as string, name: value.name as string, city: value.city as string, state: value.state as string, type: value.type as string, description: value.description as string };
  });
}
export function filterPublicStores(stores: PublicStore[], filters: StoreFilters): PublicStore[] {
  const query = filters.query.trim().toLocaleLowerCase("en-US");
  return stores.filter((store) =>
    (!query || `${store.name} ${store.city} ${store.state} ${store.type}`.toLocaleLowerCase("en-US").includes(query)) &&
    (!filters.state || store.state === filters.state) && (!filters.type || store.type === filters.type));
}
