// Reusable count helper for a set of (adapted) listings. Used by the Dashboard
// overview; keeps status-counting logic in one place.
export function computeListingStats(listings = []) {
  const stats = {
    total: listings.length,
    active: 0, // approved + live
    pending: 0,
    sold: 0,
    hidden: 0,
    rejected: 0,
    featured: 0, // featuredActive
    pendingFeatured: 0, // requested but not yet activated
  };
  for (const l of listings) {
    if (l.status === 'approved') stats.active += 1;
    else if (l.status === 'pending') stats.pending += 1;
    else if (l.status === 'sold') stats.sold += 1;
    else if (l.status === 'hidden') stats.hidden += 1;
    else if (l.status === 'rejected') stats.rejected += 1;

    if (l.featured) stats.featured += 1;
    if (l.featuredRequested && !l.featured) stats.pendingFeatured += 1;
  }
  return stats;
}
