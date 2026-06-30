// Checks for the beta limit constants + featured-expiry helper.
// No DB needed — run: node scripts/test-limits.js
import assert from 'node:assert/strict';
import {
  MAX_PERSONAL_ACTIVE_LISTINGS,
  MAX_BUSINESS_ACTIVE_LISTINGS,
  MAX_FEATURED_PER_BUSINESS,
  FEATURED_DURATION_DAYS,
  ACTIVE_LISTING_STATUSES,
} from '../src/lib/constants.js';
import { isFeaturedNow, featuredUntilFromNow } from '../src/lib/featured.js';

let passed = 0;
const ok = (l) => { passed++; console.log('  ✓', l); };

assert.equal(MAX_PERSONAL_ACTIVE_LISTINGS, 2);
assert.equal(MAX_BUSINESS_ACTIVE_LISTINGS, 6);
assert.equal(MAX_FEATURED_PER_BUSINESS, 3);
assert.equal(FEATURED_DURATION_DAYS, 14);
ok('constants: 2 / 6 / 3 / 14');

assert.deepEqual(ACTIVE_LISTING_STATUSES, ['pending', 'approved']);
ok('active statuses count pending + approved only');

const now = new Date('2026-06-30T00:00:00Z');
const future = new Date('2026-07-10T00:00:00Z');
const past = new Date('2026-06-20T00:00:00Z');

assert.equal(isFeaturedNow({ featuredActive: true, featuredUntil: future }, now), true);
ok('featured + unexpired → featured now');
assert.equal(isFeaturedNow({ featuredActive: true, featuredUntil: past }, now), false);
ok('featured + expired → NOT featured (slot frees automatically)');
assert.equal(isFeaturedNow({ featuredActive: false, featuredUntil: future }, now), false);
ok('flag off → not featured');
assert.equal(isFeaturedNow({ featuredActive: true, featuredUntil: null }, now), false);
ok('no featuredUntil → not featured');

const until = featuredUntilFromNow(now);
assert.equal(Math.round((until - now) / (24 * 3600 * 1000)), 14);
ok('featuredUntilFromNow → +14 days');

console.log(`\nAll ${passed} limit checks passed.`);
