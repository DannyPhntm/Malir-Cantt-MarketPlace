/**
 * Recently Viewed service — localStorage implementation.
 *
 * Tracks the listings a user has opened so they can rediscover them later.
 * Centralised here so both the writer (ListingCard) and the reader
 * (RecentlyViewed) share one source of truth — same key, same cap, same
 * dedupe + move-to-front behaviour.
 *
 * To connect a real backend later (e.g. a per-user "view history" table):
 *   1. addRecentlyViewed → POST /api/users/me/views { listingId } (fire-and-forget).
 *   2. getRecentlyViewed → GET  /api/users/me/views (returns ordered listings).
 *   3. clearRecentlyViewed → DELETE /api/users/me/views.
 *   4. Keep localStorage as an optimistic cache for guests / offline; on login,
 *      merge the local list into the server list once, then read from the server.
 *
 * Only `listing.id` is strictly needed server-side — the full object is stored
 * locally so cards can render without a data fetch while there is no backend.
 */

const RECENTLY_VIEWED_KEY = 'malir-recently-viewed';
const MAX_RECENTLY_VIEWED = 20;

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentlyViewed(listing) {
  if (!listing?.id) return;
  try {
    const stored = getRecentlyViewed();
    // Remove any existing entry, then push to the front (move-to-front on revisit).
    const next = [listing, ...stored.filter(l => l.id !== listing.id)].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors (quota, private mode, etc.)
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch {
    // ignore storage errors
  }
}
