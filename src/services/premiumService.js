/**
 * Premium request service — the state-transition layer for premium workflows.
 *
 * These are the operations a future admin dashboard / backend will perform on
 * premium requests (featured listings + business applications). They are pure
 * functions: each takes a request (or the entity holding one) and returns a new
 * object — no side effects, no storage, no network. That keeps the transition
 * rules in ONE place so the eventual admin UI and any API endpoint stay in sync.
 *
 * Backend migration:
 *   approveRequest / rejectRequest  → PATCH /api/admin/requests/:id { decision }
 *   markPaid                        → called by the billing webhook on success
 *   isPremiumActive                 → mirror the same rule server-side
 */

import { APPLICATION_STATUS, PAYMENT_STATUS } from '../data/premiumConfig';

/* ── Admin decisions ─────────────────────────────────────────────────────────── */

export function approveRequest(request) {
  if (!request) return request;
  return { ...request, approvalStatus: APPLICATION_STATUS.APPROVED, reviewedAt: Date.now() };
}

export function rejectRequest(request) {
  if (!request) return request;
  return { ...request, approvalStatus: APPLICATION_STATUS.REJECTED, reviewedAt: Date.now() };
}

/* ── Billing (called by a future payment webhook — not implemented yet) ───────── */

export function markPaid(request) {
  if (!request) return request;
  return { ...request, paymentStatus: PAYMENT_STATUS.PAID };
}

/* ── Activation rule ─────────────────────────────────────────────────────────── */

/**
 * A premium feature is live only when it is APPROVED *and* settled —
 * i.e. payment is not required (free / billing disabled) or already PAID.
 * Payment unlocks processing; approval is always required.
 */
export function isPremiumActive(request) {
  if (!request) return false;
  const approved = request.approvalStatus === APPLICATION_STATUS.APPROVED;
  const settled =
    request.paymentStatus === PAYMENT_STATUS.NOT_REQUIRED ||
    request.paymentStatus === PAYMENT_STATUS.PAID;
  return approved && settled;
}

/* ── Entity-level helpers (admin-ready; not wired to UI at this stage) ─────────── */

/**
 * Apply an admin decision to a listing's featured request and recompute its
 * `featured` activation flag. A future admin action calls this, then persists
 * the returned listing.
 */
export function applyFeaturedDecision(listing, decision) {
  if (!listing?.featuredRequest) return listing;
  const featuredRequest =
    decision === 'approve'
      ? approveRequest(listing.featuredRequest)
      : rejectRequest(listing.featuredRequest);
  return { ...listing, featuredRequest, featured: isPremiumActive(featuredRequest) };
}

/**
 * Apply an admin decision to a business application. Returns the profile patch
 * an admin action would persist via updateProfile().
 */
export function applyBusinessDecision(businessRequest, decision) {
  return decision === 'approve'
    ? approveRequest(businessRequest)
    : rejectRequest(businessRequest);
}
