// One-time, idempotent data backfill for the category restructure.
//   - Remaps listings.category old -> new (+ subcategory where unambiguous).
//   - Sets listings.posting_type (food/services -> business, else personal).
//   - Initialises business_accounts.seller_status/payment_status.
// Re-runnable: new slugs are not in the old set, so a second run is a no-op.
import prisma from '../src/lib/prisma.js';

const CAT_MAP = {
  vehicles:   { category: 'vehicles',     subcategory: null },
  technology: { category: 'electronics',  subcategory: null },
  property:   { category: 'property',     subcategory: null },
  furniture:  { category: 'home-living',  subcategory: 'furniture' },
  shoes:      { category: 'fashion',      subcategory: 'shoes' },
  gym:        { category: 'fitness',      subcategory: null },
  services:   { category: 'services',     subcategory: null },
  food:       { category: 'food',         subcategory: null },
  jobs:       { category: 'jobs',         subcategory: null },
};
const NEW_SLUGS = ['vehicles','property','electronics','home-living','fashion','services','food','jobs','fitness','other'];
const COMMERCIAL = ['food', 'services'];

async function main() {
  const listings = await prisma.listing.findMany({ select: { id: true, category: true } });
  let migrated = 0, skipped = 0;
  for (const l of listings) {
    const map = CAT_MAP[l.category];
    if (!map) {
      if (!NEW_SLUGS.includes(l.category)) {
        await prisma.listing.update({ where: { id: l.id }, data: { category: 'other', postingType: 'personal' } });
        console.log(`listing ${l.id}: unknown '${l.category}' -> other`);
      }
      skipped++; continue;
    }
    const postingType = COMMERCIAL.includes(map.category) ? 'business' : 'personal';
    await prisma.listing.update({
      where: { id: l.id },
      data: { category: map.category, subcategory: map.subcategory, postingType },
    });
    migrated++;
  }
  console.log(`Listings: migrated ${migrated}, skipped ${skipped}`);

  // Business accounts: only touch rows still at the default 'not_applied'
  // (idempotent — a re-run won't clobber admin-set statuses).
  const accounts = await prisma.businessAccount.findMany({ select: { id: true, sellerStatus: true } });
  let reviewed = 0;
  for (const a of accounts) {
    if (a.sellerStatus !== 'not_applied') continue;
    await prisma.businessAccount.update({
      where: { id: a.id },
      data: { sellerStatus: 'pending', paymentStatus: 'payment_required' },
    });
    reviewed++;
  }
  console.log(`Business accounts: ${reviewed} set to pending/payment_required`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
