// Enumerated values shared by validators, controllers and the seed.
// (SQLite has no native enums, so these are the single source of truth.)

export const ACCOUNT_TYPES = ['personal', 'business'];

export const CATEGORIES = [
  'vehicles', 'property', 'electronics', 'home-living', 'fashion',
  'services', 'food', 'jobs', 'fitness', 'other',
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
export const BUSINESS_ONLY_CATEGORIES = ['food', 'services'];
export const IMAGE_OPTIONAL_CATEGORIES = ['jobs', 'services', 'other'];
export const MAX_FEATURED_PER_BUSINESS = 2;

export const MIN_IMAGES = 1;
export const MAX_IMAGES = 10;

export const LISTING_STATUSES = ['pending', 'approved', 'rejected', 'sold', 'hidden'];

// Statuses an owner may set on their own listing (lifecycle, not moderation).
// Only allowed when the listing is already in one of these states — a pending /
// rejected listing must be handled by an admin first.
export const OWNER_SETTABLE_STATUSES = ['approved', 'sold', 'hidden'];

export const PAYMENT_STATUSES = ['payment_required', 'payment_pending', 'paid', 'waived'];

export const CODE_TTL_MINUTES = Number(process.env.CODE_TTL_MINUTES) || 10;

// Max failed verify/reset attempts per code before it's rejected (request a new one).
export const MAX_CODE_ATTEMPTS = 5;
