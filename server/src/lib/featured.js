import { FEATURED_DURATION_DAYS } from './constants.js';

// A listing is *currently* featured only when its flag is on AND its window
// hasn't expired. Counting against featuredUntil > now means an expired slot
// frees automatically without a cron job — no listing stays featured forever.
export function isFeaturedNow(listing, now = new Date()) {
  if (!listing?.featuredActive) return false;
  if (!listing.featuredUntil) return false;
  return new Date(listing.featuredUntil).getTime() > now.getTime();
}

// The featuredUntil timestamp to set when a listing is featured.
export function featuredUntilFromNow(now = new Date()) {
  return new Date(now.getTime() + FEATURED_DURATION_DAYS * 24 * 60 * 60 * 1000);
}
