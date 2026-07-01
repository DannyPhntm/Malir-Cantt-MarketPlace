// Enumerated values shared by validators, controllers and the seed.
// (SQLite has no native enums, so these are the single source of truth.)

export const ACCOUNT_TYPES = ['personal', 'business'];

export const CATEGORIES = [
  'vehicles', 'property', 'electronics', 'home-living', 'fashion',
  'services', 'food', 'jobs', 'fitness', 'education', 'other',
];

// Subcategory slugs per category (unique within a category).
export const SUBCATEGORIES = {
  vehicles:     ['cars', 'bikes', 'auto-parts', 'accessories'],
  property:     ['houses', 'apartments', 'plots', 'rentals'],
  electronics:  ['phones', 'laptops', 'gaming', 'appliances'],
  'home-living':['furniture', 'home-decor', 'kitchen', 'garden', 'household'],
  fashion:      ['shoes', 'clothing', 'accessories'],
  services:     ['tutors', 'repair', 'freelance', 'cleaning', 'professional'],
  food:         ['home-food', 'baking', 'catering', 'meal-prep'],
  jobs:         ['full-time', 'part-time', 'internship'],
  fitness:      ['equipment', 'memberships', 'supplements', 'activewear'],
  education:    ['tuition', 'tutors', 'academies', 'courses', 'study-material'],
  other:        [],
};

export function isValidSubcategory(category, sub) {
  if (sub == null || sub === '') return true;
  return (SUBCATEGORIES[category] || []).includes(sub);
}

export const BUSINESS_TYPES = [
  'food-beverage', 'home-decor', 'furniture', 'electronics', 'automotive',
  'fashion', 'fitness', 'services', 'education', 'beauty', 'health',
  'real-estate', 'other',
];

export const POSTING_TYPES = ['personal', 'business'];
export const SELLER_STATUSES = ['not_applied', 'pending', 'approved', 'rejected'];

// Categories that are inherently commercial → listings forced to business.
// Services allows a personal path (individual tutor / casual help), so it is NOT
// here; food (cooked-food sale) stays commercial-only.
export const BUSINESS_ONLY_CATEGORIES = ['food'];
export const IMAGE_OPTIONAL_CATEGORIES = ['jobs', 'services', 'education', 'other'];

// ── Beta listing limits ───────────────────────────────────────────────────────
// Statuses that occupy a "slot" toward a user's active-listing limit. Pending
// counts so a user can't spam unlimited listings before admin review. Sold /
// hidden / rejected free the slot.
export const ACTIVE_LISTING_STATUSES = ['pending', 'approved'];
export const MAX_PERSONAL_ACTIVE_LISTINGS = 2;
export const MAX_BUSINESS_ACTIVE_LISTINGS = 6;
// Featured slots per business (free during beta — no payment gateway).
export const MAX_FEATURED_PER_BUSINESS = 3;
// How long a featured listing stays featured before its slot frees automatically.
export const FEATURED_DURATION_DAYS = 14;

export const MIN_IMAGES = 1;
export const MAX_IMAGES = 10;

// Smallest decoded size we'll accept as a plausibly-real photo. A blank/empty
// canvas export (the iOS Safari large-photo bug) is only a few hundred bytes;
// real downscaled photos are tens of KB+. Used to reject placeholder uploads
// both at validation and after the Cloudinary upload returns.
export const MIN_IMAGE_BYTES = 2048;
// A base64 data URL is ~4/3 the byte size, plus the `data:image/...;base64,`
// prefix — the minimum acceptable data-URL string length.
export const MIN_IMAGE_DATA_URL_LEN = Math.ceil(MIN_IMAGE_BYTES * 4 / 3) + 32;

// ── Shops directory ──────────────────────────────────────────────────────────
export const SHOP_CATEGORIES = [
  'grocery', 'food-restaurants', 'electronics-mobile', 'clothing-fashion',
  'pharmacy-health', 'car-services', 'home-furniture', 'beauty-salon',
  'stationery-books', 'gyms-fitness', 'services-repairs', 'other',
];
export const SHOP_STATUSES = ['pending', 'approved', 'hidden'];
export const MAX_SHOP_IMAGES = 6;

export const LISTING_STATUSES = ['pending', 'approved', 'rejected', 'sold', 'hidden'];

// Statuses an owner may set on their own listing (lifecycle, not moderation).
// Only allowed when the listing is already in one of these states — a pending /
// rejected listing must be handled by an admin first.
export const OWNER_SETTABLE_STATUSES = ['approved', 'sold', 'hidden'];

export const PAYMENT_STATUSES = ['payment_required', 'payment_pending', 'paid', 'waived'];

export const CODE_TTL_MINUTES = Number(process.env.CODE_TTL_MINUTES) || 10;

// Max failed verify/reset attempts per code before it's rejected (request a new one).
export const MAX_CODE_ATTEMPTS = 5;
