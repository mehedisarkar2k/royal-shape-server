import NodeCache from "node-cache";

// Initialize cache with no standard expiration (infinity),
// we will invalidate it manually on mutations.
export const appCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

/** Deletes every cached key starting with `prefix` — used for caches keyed per-id
 *  (e.g. `booking_single_<id>`) where a mutation needs to drop all matching entries. */
export function clearCacheByPrefix(prefix: string): void {
  const matching = appCache.keys().filter((key) => key.startsWith(prefix));
  if (matching.length > 0) {
    appCache.del(matching);
  }
}
