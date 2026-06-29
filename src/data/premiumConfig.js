/**
 * Premium marketplace configuration — single source of truth for everything
 * related to monetisation, verification, and admin approval.
 *
 * Nothing here talks to a payment gateway or a backend yet. These are the
 * shared constants and data shapes the UI reads from today (mock mode) and
 * that a real backend / admin panel / billing provider will populate later.
 *
 * Backend migration notes are inline next to each export.
 */

/* ──────────────────────────────────────────────────────────────────────────
 * Approval states (admin-ready)
 *
 * Both business applications and featured-listing requests move through the
 * same lifecycle. An admin dashboard will flip these between states; until
 * then they default to NONE / PENDING and are never auto-approved.
 * ────────────────────────────────────────────────────────────────────────── */
export const APPLICATION_STATUS = {
  NONE:     'none',
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Featured listings share the exact same lifecycle — aliased for readability.
export const FEATURED_STATUS = APPLICATION_STATUS;

export const STATUS_LABELS = {
  [APPLICATION_STATUS.NONE]:     'Not Applied',
  [APPLICATION_STATUS.PENDING]:  'Pending Approval',
  [APPLICATION_STATUS.APPROVED]: 'Approved',
  [APPLICATION_STATUS.REJECTED]: 'Rejected',
};

/* Business Seller status — mirrors the backend business_accounts.seller_status
   (note: 'not_applied', not the legacy 'none'). */
export const SELLER_STATUS = {
  NOT_APPLIED: 'not_applied',
  PENDING:     'pending',
  APPROVED:    'approved',
  REJECTED:    'rejected',
};
export const SELLER_STATUS_LABELS = {
  not_applied: 'Not Applied',
  pending:     'Pending Approval',
  approved:    'Approved',
  rejected:    'Rejected',
};

/* Business Seller payment readiness — mirrors business_accounts.payment_status.
   No gateway yet: admin waives or marks paid for beta. */
export const SELLER_PAYMENT_STATUS = {
  REQUIRED: 'payment_required',
  PENDING:  'payment_pending',
  PAID:     'paid',
  WAIVED:   'waived',
};
export const SELLER_PAYMENT_STATUS_LABELS = {
  payment_required: 'Payment Required',
  payment_pending:  'Payment Pending',
  paid:             'Paid',
  waived:           'Waived',
};

/* ──────────────────────────────────────────────────────────────────────────
 * Payment state (independent of approval)
 *
 * Premium requests carry TWO independent gates so future billing slots in
 * cleanly without changing the approval flow:
 *   • approvalStatus — admin review (ALWAYS required for premium features)
 *   • paymentStatus  — billing (NOT_REQUIRED until a gateway is connected)
 *
 * Marketplace rule: payment unlocks premium *processing*, but a premium
 * feature only activates once it is ALSO approved. See isPremiumActive().
 * ────────────────────────────────────────────────────────────────────────── */
export const PAYMENT_STATUS = {
  NOT_REQUIRED: 'not_required', // free, or billing not yet enabled
  UNPAID:       'unpaid',       // fee due once billing is enabled
  PAID:         'paid',
};

// What kind of thing a premium request is for.
export const PREMIUM_TYPE = {
  FEATURED_LISTING: 'featured_listing',
  BUSINESS_ACCOUNT: 'business_account',
};

/* ──────────────────────────────────────────────────────────────────────────
 * Account types & listing tiers
 * ────────────────────────────────────────────────────────────────────────── */
export const ACCOUNT_TYPE = {
  RESIDENT: 'resident', // personal Malir Cantt resident
  BUSINESS: 'business',
};

export const LISTING_TIER = {
  STANDARD: 'standard',
  FEATURED: 'featured',
};

/* ──────────────────────────────────────────────────────────────────────────
 * Verification badge kinds (consumed by <VerifiedBadge type=… />)
 * ────────────────────────────────────────────────────────────────────────── */
export const BADGE_TYPE = {
  EMAIL:    'email',    // ✓ Email Verified
  RESIDENT: 'resident', // 🏠 Verified Resident
  BUSINESS: 'business', // 🏢 Verified Business
};

/* ──────────────────────────────────────────────────────────────────────────
 * Benefit copy — rendered by BusinessBenefitsCard / FeaturedListingOption.
 * Kept here (not hardcoded in components) so marketing copy lives in one place.
 * ────────────────────────────────────────────────────────────────────────── */
export const BUSINESS_BENEFITS = [
  'Verified Business badge',
  'Ability to list in the Services category',
  'Priority visibility in search & categories',
  'Eligible for future featured promotions',
  'Dedicated business profile page',
];

export const FEATURED_BENEFITS = [
  'Priority placement',
  'Featured badge',
  'Homepage visibility',
  'More reach inside Malir Cantt',
];

/* ──────────────────────────────────────────────────────────────────────────
 * Future payment hooks — NO gateway is implemented.
 *
 * Each plan is shaped like a billing "price" object so a future integration
 * (Stripe, local PSP, JazzCash/Easypaisa, etc.) can map `id` → a real price
 * and flip `enabled` to true. `amount` is intentionally 0 until a backend
 * supplies live pricing. Read these via getFee(); never hardcode amounts.
 * ────────────────────────────────────────────────────────────────────────── */
export const PRICING = {
  businessAccount: {
    id: 'business_account_fee',
    label: 'Business Account',
    amount: 0,            // PKR — supplied by billing provider later
    currency: 'PKR',
    interval: 'month',    // 'month' | 'year' | 'one_time'
    enabled: false,       // billing off until a gateway is connected
  },
  featuredListing: {
    id: 'featured_listing_fee',
    label: 'Featured Listing',
    amount: 0,
    currency: 'PKR',
    interval: 'one_time',
    durationDays: 30,
    enabled: false,
  },
  sponsoredPromotion: {
    id: 'sponsored_promotion_fee',
    label: 'Sponsored Promotion',
    amount: 0,
    currency: 'PKR',
    interval: 'one_time',
    enabled: false,
  },
};

export function getFee(key) {
  return PRICING[key] || null;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Premium request factory — the single shape used for BOTH featured-listing
 * requests and business-account applications. Keeping one shape means the
 * future admin panel and any backend endpoint handle them identically.
 *
 * `paymentStatus` is derived from the fee: while billing is disabled
 * (fee.enabled === false) it is NOT_REQUIRED, so approval alone activates the
 * feature. When a gateway is later enabled, new requests start UNPAID and the
 * feature stays inactive until both PAID and APPROVED (see isPremiumActive in
 * services/premiumService.js).
 * ────────────────────────────────────────────────────────────────────────── */
export function createPremiumRequest({ type, fee = null }) {
  return {
    type,                                       // PREMIUM_TYPE.*
    approvalStatus: APPLICATION_STATUS.PENDING, // never auto-approved
    paymentStatus:  fee?.enabled ? PAYMENT_STATUS.UNPAID : PAYMENT_STATUS.NOT_REQUIRED,
    feeId:          fee?.id || null,
    requestedAt:    Date.now(),
    reviewedAt:     null,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Sponsored homepage promotions — placeholder.
 *
 * Empty until billing + admin exist. When a sponsored slot is purchased and
 * approved, the backend returns entries shaped like SPONSORED_SHAPE below and
 * the homepage can render them above / within the featured grid. No UI yet.
 * ────────────────────────────────────────────────────────────────────────── */
export const SPONSORED_SHAPE = {
  id: '',
  listingId: null,
  sponsorName: '',
  placement: 'homepage_hero', // 'homepage_hero' | 'homepage_grid' | 'category_top'
  status: APPLICATION_STATUS.PENDING,
  startsAt: null,
  endsAt: null,
};

export const SPONSORED_PLACEMENTS = [];
