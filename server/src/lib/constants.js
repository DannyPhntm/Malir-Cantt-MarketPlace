// Enumerated values shared by validators, controllers and the seed.
// (SQLite has no native enums, so these are the single source of truth.)

export const ACCOUNT_TYPES = ['personal', 'business'];

export const CATEGORIES = [
  'vehicles',
  'technology',
  'property',
  'furniture',
  'jobs',
  'services',
  'gym',
  'shoes',
  'food',
];

// Categories reserved for verified business accounts.
export const BUSINESS_ONLY_CATEGORIES = ['food'];

// Categories where a listing image is optional (everything else needs >= 1).
export const IMAGE_OPTIONAL_CATEGORIES = ['jobs', 'services'];

export const MIN_IMAGES = 1;
export const MAX_IMAGES = 10;

export const LISTING_STATUSES = ['pending', 'approved', 'rejected', 'sold', 'hidden'];

// Statuses an owner may set on their own listing (lifecycle, not moderation).
// Only allowed when the listing is already in one of these states — a pending /
// rejected listing must be handled by an admin first.
export const OWNER_SETTABLE_STATUSES = ['approved', 'sold', 'hidden'];

export const PAYMENT_STATUSES = ['not_required', 'unpaid', 'paid'];

export const CODE_TTL_MINUTES = Number(process.env.CODE_TTL_MINUTES) || 10;
