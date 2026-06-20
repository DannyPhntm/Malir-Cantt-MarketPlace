# Category Restructure + Business Seller Monetization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 9 narrow categories with 10 broad categories + subcategories, add a per-listing personal/business posting gate backed by a Business Seller approval + payment-readiness workflow (admin-controlled, no gateway), cap featured business listings at 2, and migrate all existing data with zero loss — UI preserved.

**Architecture:** Taxonomy + enums centralised in `server/src/lib/constants.js` (backend source of truth) mirrored by `src/data/categoryConfig.js` + `src/data/premiumConfig.js` (frontend). Two new nullable/ defaulted columns on `listings` (`subcategory`, `posting_type`) and three status fields on `business_accounts` (`business_type`, `seller_status`, extended `payment_status`); the `approved` boolean is dropped in favour of `seller_status`. A one-time idempotent backfill script migrates existing rows. The listing-create controller enforces the posting gate; the admin business endpoint drives seller approval/payment; a featured cap is enforced on featured activation.

**Tech Stack:** Node/Express + Prisma + SQLite (server), React 19 + Vite (client). No unit-test framework — verification is `node --check`, `curl` + `sqlite3` smoke tests, `npx eslint`, and `npm run build`.

## Global Constraints

- **No data loss.** Back up `server/prisma/dev.db` before the Phase 1 backfill. New columns are nullable or defaulted; backfill never deletes.
- **No payment gateway.** Payment-readiness is status fields only; admin waives/marks paid.
- **No redesign.** New data flows into existing components/CSS. Preserve mobile responsiveness.
- **Category slugs (10):** `vehicles, property, electronics, home-living, fashion, services, food, jobs, fitness, other`.
- **Posting types:** `personal | business` (default `personal`).
- **Seller statuses:** `not_applied | pending | approved | rejected`.
- **Payment statuses:** `payment_required | payment_pending | paid | waived`.
- **Commercial (forced-business) categories:** `food`, `services`.
- **Image-optional categories:** `jobs`, `services`, `other`.
- **Active seller rule:** `seller_status === 'approved' && payment_status ∈ {paid, waived}`.
- **Featured cap:** `MAX_FEATURED_PER_BUSINESS = 2` concurrent `featured_active` per business.
- **Commit message footer:** end every commit body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Spec:** `docs/superpowers/specs/2026-06-20-marketplace-category-restructure-design.md`.

---

## File Structure

**Backend**
- `server/src/lib/constants.js` — taxonomy + all enums + cap (source of truth). *Modify.*
- `server/prisma/schema.prisma` — new columns; drop `approved`. *Modify.*
- `server/prisma/migrations/<ts>_category_and_seller/` — generated. *Create.*
- `server/scripts/migrate-data.js` — idempotent backfill. *Create.*
- `server/prisma/seed.js` — new slugs + statuses. *Modify.*
- `server/src/validators/schemas.js` — subcategory/postingType/businessType/seller decision. *Modify.*
- `server/src/controllers/listings.controller.js` — posting gate, subcategory/postingType persistence + filters, featured cap. *Modify.*
- `server/src/controllers/businessAccounts.controller.js` — apply→pending, decision (status + payment), includes. *Modify.*
- `server/src/routes/businessAccounts.routes.js` — `/apply` route. *Modify.*
- `server/src/controllers/auth.controller.js` — register sets businessType + seller/payment defaults. *Modify.*
- `server/src/controllers/stats.controller.js` — swap `approved` → `seller_status`. *Modify.*

**Frontend**
- `src/data/categoryConfig.js` — 10 categories, subcategories, remapped fields. *Modify.*
- `src/data/premiumConfig.js` — seller/payment enums + labels. *Modify.*
- `src/services/listingAdapter.js` — expose `subcategory`, `postingType`. *Modify.*
- `src/services/listingsApi.js`, `src/services/adminApi.js`, `src/services/authApi.js` — new params/methods. *Modify.*
- `src/context/AuthContext.jsx` — sellerStatus/paymentStatus/businessType + `applyForBusinessSeller`. *Modify.*
- `src/pages/AddListingPage.jsx` + `EditListingPage.jsx` — subcategory + posting-type gate. *Modify.*
- `src/components/BusinessRequiredModal.jsx` — repurpose copy/props. *Modify.*
- `src/pages/AllListingsPage.jsx`, `CategoryPage.jsx`, `HomePage.jsx`, `src/components/Navbar.jsx` — 10 categories + filters. *Modify.*
- `src/pages/AdminPage.jsx` — seller queue (approve/reject/waive/paid). *Modify.*
- `src/pages/ProfilePage.jsx`, `SellerProfilePage.jsx`, `ListingDetailPage.jsx` — business display + apply CTA. *Modify.*
- `src/pages/LoginPage.jsx` — businessType select. *Modify.*
- `public/categories/*.png` — 10 carousel images. *Create.*

---

# PHASE 1 — Foundation: constants, schema, migration, backfill

### Task 1.1: Backend taxonomy + enum constants

**Files:**
- Modify: `server/src/lib/constants.js`

**Interfaces:**
- Produces: `CATEGORIES: string[]`, `SUBCATEGORIES: Record<string,string[]>`, `BUSINESS_TYPES: string[]`, `POSTING_TYPES: string[]`, `SELLER_STATUSES: string[]`, `PAYMENT_STATUSES: string[]`, `BUSINESS_ONLY_CATEGORIES: string[]`, `IMAGE_OPTIONAL_CATEGORIES: string[]`, `MAX_FEATURED_PER_BUSINESS: number`, `isValidSubcategory(category, sub): boolean`.

- [ ] **Step 1: Replace the category/enames block** in `server/src/lib/constants.js`:

```js
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
export const PAYMENT_STATUSES = ['payment_required', 'payment_pending', 'paid', 'waived'];

// Categories that are inherently commercial → listings forced to business.
export const BUSINESS_ONLY_CATEGORIES = ['food', 'services'];
export const IMAGE_OPTIONAL_CATEGORIES = ['jobs', 'services', 'other'];
export const MAX_FEATURED_PER_BUSINESS = 2;
```

Keep the existing `ACCOUNT_TYPES`, `MIN_IMAGES`, `MAX_IMAGES`, `LISTING_STATUSES`, `OWNER_SETTABLE_STATUSES`, `CODE_TTL_MINUTES`. **Remove** the old `PAYMENT_STATUSES = ['not_required','unpaid','paid']` if present (replaced above).

- [ ] **Step 2: Syntax check.** Run: `node --check server/src/lib/constants.js` — Expected: no output (pass).

- [ ] **Step 3: Verify exports load.** Run:
`cd server && node -e "import('./src/lib/constants.js').then(m=>console.log(m.CATEGORIES.length, m.isValidSubcategory('fashion','shoes'), m.isValidSubcategory('fashion','cars'), m.MAX_FEATURED_PER_BUSINESS))"`
Expected: `10 true false 2`.

- [ ] **Step 4: Commit.**
```bash
git add server/src/lib/constants.js
git commit -m "feat(taxonomy): new categories + seller/posting enums

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1.2: Prisma schema — new columns, drop `approved`

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: migration via CLI

**Interfaces:**
- Produces: `listings.subcategory String?`, `listings.postingType String @default("personal")`, `businessAccounts.businessType String?`, `businessAccounts.sellerStatus String @default("not_applied")`; `businessAccounts.approved` removed; `paymentStatus` default → `"payment_required"`.

- [ ] **Step 1: Back up the DB.** Run: `cp server/prisma/dev.db server/prisma/dev.db.bak` — Expected: file copied.

- [ ] **Step 2: Edit `model Listing`** — add after the `category`/`price` fields:
```prisma
  subcategory       String?  @map("subcategory")
  postingType       String   @default("personal") @map("posting_type")
```

- [ ] **Step 3: Edit `model BusinessAccount`** — replace the `approved` line and `paymentStatus` default:
```prisma
  businessName  String  @map("business_name")
  businessType  String? @map("business_type")
  sellerStatus  String  @default("not_applied") @map("seller_status")
  paymentStatus String  @default("payment_required") @map("payment_status")
```
(Delete the `approved Boolean @default(false)` line.)

- [ ] **Step 4: Create + apply migration.** Run:
`cd server && npx prisma migrate dev --name category_and_seller`
Expected: "migration ... applied" + "Generated Prisma Client". (Existing `approved` data is dropped — backfill in Task 1.4 sets `seller_status` from the pre-migration backup.)

- [ ] **Step 5: Capture pre-migration approved state for the backfill.** BEFORE relying on the dropped column, export it from the backup:
`cd server && sqlite3 prisma/dev.db.bak "SELECT id, approved, payment_status FROM business_accounts;" > /tmp/biz_approved.txt && cat /tmp/biz_approved.txt`
Expected: one line per business account (id|approved|payment_status). Keep this file for Task 1.4.

- [ ] **Step 6: Commit.**
```bash
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "feat(db): add subcategory/postingType + seller status, drop approved

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1.3: Frontend categoryConfig re-key (10 categories + subcategories)

**Files:**
- Modify: `src/data/categoryConfig.js`

**Interfaces:**
- Produces: `CATEGORY_CONFIG` keyed by the 10 new slugs; each entry adds `subcategories: {slug,label}[]`. Field sets remapped: `technology`→`electronics`, `furniture`→`home-living`, `shoes`→`fashion`, `gym`→`fitness`; new `fashion`/`home-living`/`other` get generic fields.

- [ ] **Step 1: Re-key the existing entries.** Rename keys and merge:
  - `vehicles` → keep key `vehicles`, keep fields. Add `subcategories`.
  - `technology` → rename key to `electronics`, keep fields, update `label: 'Electronics'`.
  - `property` → keep.
  - `furniture` → rename key to `home-living`, `label: 'Home & Living'`, keep furniture fields but make `furnitureType` optional and rename label to `Item Type`.
  - `shoes` → rename key to `fashion`, `label: 'Fashion'`.
  - `gym` → rename key to `fitness`, `label: 'Fitness'`.
  - `services`, `food`, `jobs` → keep keys/fields.

- [ ] **Step 2: Add `subcategories` to each entry** using these label maps (slug→label):
```js
// vehicles
subcategories: [{slug:'cars',label:'Cars'},{slug:'bikes',label:'Bikes'},{slug:'auto-parts',label:'Auto Parts'},{slug:'accessories',label:'Accessories'}],
// property
[{slug:'houses',label:'Houses'},{slug:'apartments',label:'Apartments'},{slug:'plots',label:'Plots'},{slug:'rentals',label:'Rentals'}],
// electronics
[{slug:'phones',label:'Phones'},{slug:'laptops',label:'Laptops'},{slug:'gaming',label:'Gaming'},{slug:'appliances',label:'Appliances'}],
// home-living
[{slug:'furniture',label:'Furniture'},{slug:'home-decor',label:'Home Decor'},{slug:'kitchen',label:'Kitchen'},{slug:'garden',label:'Garden'},{slug:'household',label:'Household Items'}],
// fashion
[{slug:'shoes',label:'Shoes'},{slug:'clothing',label:'Clothing'},{slug:'accessories',label:'Accessories'}],
// services
[{slug:'tutors',label:'Tutors'},{slug:'repair',label:'Repair'},{slug:'freelance',label:'Freelance'},{slug:'cleaning',label:'Cleaning'},{slug:'professional',label:'Professional Services'}],
// food
[{slug:'home-food',label:'Home Food'},{slug:'baking',label:'Baking'},{slug:'catering',label:'Catering'},{slug:'meal-prep',label:'Meal Prep'}],
// jobs
[{slug:'full-time',label:'Full Time'},{slug:'part-time',label:'Part Time'},{slug:'internship',label:'Internship'}],
// fitness
[{slug:'equipment',label:'Equipment'},{slug:'memberships',label:'Memberships'},{slug:'supplements',label:'Supplements'},{slug:'activewear',label:'Activewear'}],
// other
subcategories: [],
```

- [ ] **Step 3: Add the `other` category entry** (generic, image-optional):
```js
other: {
  label: 'Other',
  titlePlaceholder: 'What are you listing?',
  priceLabel: 'Price', pricePlaceholder: 'e.g. 2,000',
  images: { required: false, min: 0, max: 10, label: 'Add photos (optional).' },
  subcategories: [],
  fields: [
    { name: 'condition', label: 'Condition', type: 'select', options: ['New','Like New','Used','For Parts'], col: 1 },
  ],
},
```

- [ ] **Step 4: Lint.** Run: `npx eslint src/data/categoryConfig.js` — Expected: no output.

- [ ] **Step 5: Verify keys.** Run:
`node -e "const c=require('./src/data/categoryConfig.js'); " 2>/dev/null || node --input-type=module -e "import('./src/data/categoryConfig.js').then(m=>{const k=Object.keys(m.CATEGORY_CONFIG||m.default); console.log(k.sort().join(','))})"`
Expected includes: `electronics,fashion,fitness,food,home-living,jobs,other,property,services,vehicles`.

- [ ] **Step 6: Commit.**
```bash
git add src/data/categoryConfig.js
git commit -m "feat(taxonomy): re-key categoryConfig to 10 categories + subcategories

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1.4: Data backfill script (zero data loss)

**Files:**
- Create: `server/scripts/migrate-data.js`

**Interfaces:**
- Consumes: `/tmp/biz_approved.txt` (Task 1.2 Step 5), `prisma` client.
- Produces: updated `listings.category/subcategory/posting_type` and `business_accounts.seller_status/payment_status`.

- [ ] **Step 1: Write the script** `server/scripts/migrate-data.js`:
```js
import prisma from '../src/lib/prisma.js';

// old category slug -> { category, subcategory|null }
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
const COMMERCIAL = ['food', 'services'];

async function main() {
  const listings = await prisma.listing.findMany({ select: { id: true, category: true } });
  let migrated = 0, skipped = 0;
  for (const l of listings) {
    const map = CAT_MAP[l.category];
    if (!map) {
      // Already a new slug (idempotent re-run) or unknown -> leave/category fallback.
      const known = ['vehicles','property','electronics','home-living','fashion','services','food','jobs','fitness','other'];
      if (!known.includes(l.category)) {
        await prisma.listing.update({ where: { id: l.id }, data: { category: 'other' } });
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

  // Business accounts: seller_status/payment_status from the pre-migration approved flag.
  // Default rule (no backup file): approved listings owners stay active.
  const accounts = await prisma.businessAccount.findMany({ select: { id: true } });
  for (const a of accounts) {
    // If the row was already given a real status by a re-run, don't clobber it.
    const cur = await prisma.businessAccount.findUnique({ where: { id: a.id } });
    if (cur.sellerStatus !== 'not_applied') continue;
    // Backfill default: treat existing business accounts as pending (admin reviews).
    await prisma.businessAccount.update({
      where: { id: a.id },
      data: { sellerStatus: 'pending', paymentStatus: 'payment_required' },
    });
  }
  console.log(`Business accounts: ${accounts.length} reviewed`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the backfill script.** Run: `cd server && node scripts/migrate-data.js`
Expected: `Listings: migrated N, skipped M` + `Business accounts: K reviewed`, exit 0. (This sets every business account to `pending/payment_required`.)

- [ ] **Step 3: Apply the pre-migration approved override.** For accounts that were `approved=1` in `/tmp/biz_approved.txt` (Task 1.2 Step 5), restore them to active so existing approved sellers aren't demoted:
```bash
cd server
awk -F'|' '$2==1{print $1}' /tmp/biz_approved.txt | while read ID; do
  sqlite3 prisma/dev.db "UPDATE business_accounts SET seller_status='approved', payment_status='waived' WHERE id=$ID;"
done
```
Expected: previously-approved businesses become `approved/waived`. (Also flip `users.business_verified=1` for their owners: `sqlite3 prisma/dev.db "UPDATE users SET business_verified=1 WHERE id IN (SELECT user_id FROM business_accounts WHERE seller_status='approved');"`.)

- [ ] **Step 4: Verify no data loss + correct mapping.** Run:
`cd server && sqlite3 prisma/dev.db "SELECT category, count(*) FROM listings GROUP BY category; SELECT 'rows', count(*) FROM listings;"`
Expected: only new slugs present; total row count equals the pre-migration count (compare to `sqlite3 prisma/dev.db.bak "SELECT count(*) FROM listings;"`).
`sqlite3 prisma/dev.db "SELECT seller_status, payment_status, count(*) FROM business_accounts GROUP BY 1,2;"`
Expected: previously-approved → `approved/waived`; others → `pending/payment_required`.

- [ ] **Step 5: Commit.**
```bash
git add server/scripts/migrate-data.js
git commit -m "feat(migration): backfill categories + posting/seller status, no data loss

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1.5: Seed + adapter + stats alignment

**Files:**
- Modify: `server/prisma/seed.js`, `src/services/listingAdapter.js`, `server/src/controllers/stats.controller.js`

**Interfaces:**
- Produces: seed uses new slugs + sets `sellerStatus`/`paymentStatus`/`postingType`; `adaptListing` exposes `subcategory`, `postingType`; stats count `sellerStatus` not `approved`.

- [ ] **Step 1: Update `stats.controller.js`** — replace the two `approved` references:
  - `prisma.user.count({ where: { businessVerified: true } })` stays.
  - `prisma.businessAccount.count({ where: { approved: false } })` → `{ where: { sellerStatus: 'pending' } }` (the "business pending" metric).

- [ ] **Step 2: Update `seed.js`** — change category slugs to new ones (e.g. `technology`→`electronics`, `furniture`→`home-living`, `shoes`→`fashion`, `gym`→`fitness`); add `postingType` to listing creates (`business` for food/services, else `personal`); on businessAccount creates set `sellerStatus: 'approved', paymentStatus: 'waived'` for the verified demo businesses, and `businessType` where shown. Remove any `approved:` keys.

- [ ] **Step 3: Update `adaptListing`** in `src/services/listingAdapter.js` — add to the returned object:
```js
subcategory: l.subcategory || null,
postingType: l.postingType || 'personal',
```

- [ ] **Step 4: Syntax + lint.** Run: `node --check server/prisma/seed.js && node --check server/src/controllers/stats.controller.js && npx eslint src/services/listingAdapter.js` — Expected: clean.

- [ ] **Step 5: Boot smoke test.** Run server (`cd server && node src/server.js &`), then `curl -s localhost:4000/api/listings?status=approved | head -c 300`. Expected: JSON with listings carrying new category slugs. Kill server.

- [ ] **Step 6: Commit.**
```bash
git add server/prisma/seed.js src/services/listingAdapter.js server/src/controllers/stats.controller.js
git commit -m "feat: seed/adapter/stats aligned to new taxonomy + seller status

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# PHASE 2 — Business-seller backend & monetization

### Task 2.1: Validators — subcategory, postingType, businessType, seller decision

**Files:**
- Modify: `server/src/validators/schemas.js`

**Interfaces:**
- Consumes: constants from Task 1.1.
- Produces: `listingCreateSchema`/`listingUpdateSchema` accept `subcategory`, `postingType`; `registerSchema` accepts `businessType`; new `businessApplySchema` (empty/no body) and updated `businessDecisionSchema` (`sellerStatus?`, `paymentStatus?`).

- [ ] **Step 1: Import new constants** at the top of `schemas.js`:
```js
import { CATEGORIES, SUBCATEGORIES, BUSINESS_TYPES, POSTING_TYPES, SELLER_STATUSES, PAYMENT_STATUSES, isValidSubcategory, IMAGE_OPTIONAL_CATEGORIES, MIN_IMAGES, MAX_IMAGES } from '../lib/constants.js';
```

- [ ] **Step 2: Extend `listingCreateSchema`** — add fields + cross-field validation:
```js
subcategory: z.string().trim().optional().nullable(),
postingType: z.enum(POSTING_TYPES).optional().default('personal'),
```
In its `.superRefine`, add:
```js
if (!isValidSubcategory(data.category, data.subcategory)) {
  ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subcategory'],
    message: 'Subcategory does not belong to the selected category.' });
}
```

- [ ] **Step 3: Extend the listing update/patch schema** the same way (`subcategory`, `postingType` optional; category stays immutable per existing rules).

- [ ] **Step 4: Add `businessType` to the business branch of `registerSchema`:**
```js
businessType: z.enum(BUSINESS_TYPES).optional(),
```

- [ ] **Step 5: Replace `businessDecisionSchema`:**
```js
export const businessDecisionSchema = z.object({
  sellerStatus: z.enum(SELLER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
}).refine((d) => d.sellerStatus || d.paymentStatus, { message: 'Provide sellerStatus and/or paymentStatus.' });
```
Add `export const businessApplySchema = z.object({});` (apply takes no body; account inferred from token).

- [ ] **Step 6: Syntax check.** Run: `node --check server/src/validators/schemas.js` — Expected: clean.

- [ ] **Step 7: Commit.**
```bash
git add server/src/validators/schemas.js
git commit -m "feat(validation): subcategory/postingType/businessType + seller decision

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2.2: Business-seller apply + decision controller

**Files:**
- Modify: `server/src/controllers/businessAccounts.controller.js`, `server/src/routes/businessAccounts.routes.js`

**Interfaces:**
- Produces:
  - `applyForSeller` → `POST /api/business-accounts/apply` (auth): sets `sellerStatus='pending'`.
  - `decideBusinessAccount` accepts `{ sellerStatus?, paymentStatus? }`; approval requires settled payment to flip `businessVerified`.
  - `listBusinessAccounts` includes `sellerStatus/paymentStatus/businessType`, supports `?status=pending`.

- [ ] **Step 1: Add `applyForSeller`** to the controller:
```js
/* POST /api/business-accounts/apply — business account applies for seller status. */
export const applyForSeller = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const account = await prisma.businessAccount.findUnique({ where: { userId } });
  if (!account) throw new ApiError(400, 'Create a business account before applying for Business Seller.');
  if (account.sellerStatus === 'approved') throw new ApiError(400, 'You are already an approved Business Seller.');
  const updated = await prisma.businessAccount.update({
    where: { userId }, data: { sellerStatus: 'pending' },
  });
  res.json({ businessAccount: updated });
});
```

- [ ] **Step 2: Rewrite `decideBusinessAccount`** to use the new fields:
```js
export const decideBusinessAccount = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { sellerStatus, paymentStatus } = req.body;
  const existing = await prisma.businessAccount.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Business account not found.');

  const nextSeller = sellerStatus ?? existing.sellerStatus;
  const nextPayment = paymentStatus ?? existing.paymentStatus;
  const settled = nextPayment === 'paid' || nextPayment === 'waived';
  const verified = nextSeller === 'approved' && settled;

  const [account] = await prisma.$transaction([
    prisma.businessAccount.update({ where: { id }, data: { sellerStatus: nextSeller, paymentStatus: nextPayment } }),
    prisma.user.update({ where: { id: existing.userId }, data: { businessVerified: verified } }),
  ]);
  res.json({ businessAccount: account, businessVerified: verified });
});
```

- [ ] **Step 3: Update `listBusinessAccounts`** — support `?status=` and include the new fields (select already returns all account columns; add a `status` filter):
```js
const where = {};
if (SELLER_STATUSES.includes(req.query.status)) where.sellerStatus = req.query.status;
```
(import `SELLER_STATUSES`). Remove the old `approved` query handling.

- [ ] **Step 4: Add the route** in `businessAccounts.routes.js`:
```js
router.post('/apply', requireAuth, validate(businessApplySchema), biz.applyForSeller);
```
(import `businessApplySchema`; ensure `decision` route now imports the updated `businessDecisionSchema`).

- [ ] **Step 5: Syntax check.** Run: `node --check server/src/controllers/businessAccounts.controller.js && node --check server/src/routes/businessAccounts.routes.js` — Expected: clean.

- [ ] **Step 6: Smoke test** (server running; seed a business user via sqlite + signed token as in prior sessions):
  - `POST /api/business-accounts/apply` → `sellerStatus:'pending'`.
  - `PATCH /api/business-accounts/:id/decision {"sellerStatus":"approved","paymentStatus":"waived"}` → `businessVerified:true`.
  - `PATCH ... {"sellerStatus":"approved","paymentStatus":"payment_required"}` → `businessVerified:false` (not settled).
  Expected: all behave as above.

- [ ] **Step 7: Commit.**
```bash
git add server/src/controllers/businessAccounts.controller.js server/src/routes/businessAccounts.routes.js
git commit -m "feat(seller): apply + decision (status + payment) endpoints

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2.3: Listing-create posting gate + persistence + filters

**Files:**
- Modify: `server/src/controllers/listings.controller.js`

**Interfaces:**
- Consumes: `BUSINESS_ONLY_CATEGORIES`, active-seller rule.
- Produces: create persists `subcategory`/`postingType`; gate returns 403 for unauthorized business posts; `GET /listings` accepts `subcategory` + `postingType`.

- [ ] **Step 1: In the create controller**, after resolving the owner, compute the effective posting type + gate:
```js
import { BUSINESS_ONLY_CATEGORIES } from '../lib/constants.js';
// ...
const forcedBusiness = BUSINESS_ONLY_CATEGORIES.includes(category);
const postingType = forcedBusiness ? 'business' : (req.body.postingType || 'personal');

if (postingType === 'business') {
  const account = await prisma.businessAccount.findUnique({ where: { userId: owner.id } });
  const settled = account && (account.paymentStatus === 'paid' || account.paymentStatus === 'waived');
  const active = account && account.sellerStatus === 'approved' && settled;
  if (!active) {
    throw new ApiError(403, 'Business selling requires an approved Business Seller account. Apply for Business Seller status to post commercial listings.');
  }
}
```
Persist `subcategory: req.body.subcategory || null, postingType` in the `prisma.listing.create` data.

- [ ] **Step 2: Add filters** in `listListings`:
```js
if (req.query.subcategory) where.subcategory = req.query.subcategory;
if (req.query.postingType) where.postingType = req.query.postingType;
```

- [ ] **Step 3: Syntax check.** Run: `node --check server/src/controllers/listings.controller.js` — Expected: clean.

- [ ] **Step 4: Smoke test:**
  - Personal listing in `home-living` by a non-business user → **201**.
  - Business listing (`postingType:'business'`) by unapproved user → **403** with the apply message.
  - Listing in `food` by approved seller → **201**, stored `posting_type='business'`.
  - `GET /api/listings?status=approved&subcategory=shoes` → only shoes.

- [ ] **Step 5: Commit.**
```bash
git add server/src/controllers/listings.controller.js
git commit -m "feat(listings): posting gate + subcategory/postingType persistence & filters

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2.4: Featured cap (2 per business)

**Files:**
- Modify: `server/src/controllers/listings.controller.js`

**Interfaces:**
- Consumes: `MAX_FEATURED_PER_BUSINESS`.
- Produces: activating `featuredActive=true` beyond the cap returns 409.

- [ ] **Step 1: In the admin status/feature update handler**, before persisting `featuredActive: true`:
```js
import { MAX_FEATURED_PER_BUSINESS } from '../lib/constants.js';
// ...
if (body.featuredActive === true) {
  const target = await prisma.listing.findUnique({ where: { id }, select: { userId: true, featuredActive: true } });
  if (target && !target.featuredActive) {
    const count = await prisma.listing.count({ where: { userId: target.userId, featuredActive: true } });
    if (count >= MAX_FEATURED_PER_BUSINESS) {
      throw new ApiError(409, `This business already has ${MAX_FEATURED_PER_BUSINESS} featured listings. Unfeature one first.`);
    }
  }
}
```

- [ ] **Step 2: Syntax check.** Run: `node --check server/src/controllers/listings.controller.js` — Expected: clean.

- [ ] **Step 3: Smoke test:** feature 2 listings for one business (200, 200), feature a 3rd → **409**.

- [ ] **Step 4: Commit.**
```bash
git add server/src/controllers/listings.controller.js
git commit -m "feat(featured): cap featured-active at 2 per business

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2.5: Register sets businessType + seller defaults

**Files:**
- Modify: `server/src/controllers/auth.controller.js`

**Interfaces:**
- Produces: business register creates `businessAccount` with `businessType`, `sellerStatus:'not_applied'`, `paymentStatus:'payment_required'`.

- [ ] **Step 1: Update the businessAccount create** in `register`:
```js
businessAccount:
  accountType === 'business'
    ? { create: { businessName: businessName || name, businessType: businessType || null,
                  sellerStatus: 'not_applied', paymentStatus: 'payment_required' } }
    : undefined,
```
Destructure `businessType` from `req.body` at the top of `register`.

- [ ] **Step 2: Syntax check.** Run: `node --check server/src/controllers/auth.controller.js` — Expected: clean.

- [ ] **Step 3: Smoke test** (dev-fallback email so register succeeds): register a business account with `businessType:'home-decor'` → row has `business_type='home-decor'`, `seller_status='not_applied'`.

- [ ] **Step 4: Commit.**
```bash
git add server/src/controllers/auth.controller.js
git commit -m "feat(register): set businessType + seller/payment defaults

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# PHASE 3 — Add/Edit Listing forms (subcategory + posting gate)

### Task 3.1: Frontend services + AuthContext seller state

**Files:**
- Modify: `src/services/listingsApi.js`, `src/services/adminApi.js`, `src/services/authApi.js`, `src/context/AuthContext.jsx`, `src/data/premiumConfig.js`

**Interfaces:**
- Produces: `listingsApi.create/list` carry `subcategory`/`postingType`; `authApi.applyForSeller()`; `adminApi.listBusinessAccounts(status)` + `decideBusiness(id,{sellerStatus,paymentStatus})`; AuthContext exposes `sellerStatus`, `paymentStatus`, `businessType`, `isApprovedSeller`, `applyForBusinessSeller()`.

- [ ] **Step 1: `premiumConfig.js`** — set status enums + labels: `SELLER_STATUS = {NOT_APPLIED:'not_applied',PENDING:'pending',APPROVED:'approved',REJECTED:'rejected'}`, `PAYMENT_STATUS = {REQUIRED:'payment_required',PENDING:'payment_pending',PAID:'paid',WAIVED:'waived'}`, plus `SELLER_STATUS_LABELS` / `PAYMENT_STATUS_LABELS` for display.

- [ ] **Step 2: `authApi.js`** — add `applyForSeller: () => apiClient.post('/business-accounts/apply', {})`.

- [ ] **Step 3: `adminApi.js`** — change `listBusinessAccounts` to `(status) => apiClient.get(\`/business-accounts${status?\`?status=${status}\`:''}\`)`; `decideBusiness` already passes a body — callers will send `{sellerStatus}`/`{paymentStatus}`.

- [ ] **Step 4: `listingsApi.js`** — ensure `create(payload)` forwards `subcategory`/`postingType`; `list(filters)` serialises `subcategory`/`postingType` query params.

- [ ] **Step 5: `AuthContext.jsx`** — in `toProfile` add `businessType`, `sellerStatus`, `paymentStatus` from `user.businessAccount`; compute `isApprovedSeller = ba?.sellerStatus==='approved' && ['paid','waived'].includes(ba?.paymentStatus)`. Add `applyForBusinessSeller = useCallback(async()=>{ const r= await authApi.applyForSeller(); /* refresh */ const me = await authApi.me(); setUser(me.user); return r; },[])`. Expose `sellerStatus`, `paymentStatus`, `businessType`, `isApprovedSeller`, `applyForBusinessSeller` in the context value.

- [ ] **Step 6: Lint + build.** Run: `npx eslint src/services/*.js src/context/AuthContext.jsx src/data/premiumConfig.js && npm run build` — Expected: clean, build OK.

- [ ] **Step 7: Commit.**
```bash
git add src/services src/context/AuthContext.jsx src/data/premiumConfig.js
git commit -m "feat(client): seller state + apply action + new api params

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3.2: AddListingPage — subcategory select + posting-type gate

**Files:**
- Modify: `src/pages/AddListingPage.jsx`, `src/components/BusinessRequiredModal.jsx`

**Interfaces:**
- Consumes: `categoryConfig` subcategories, `useAuth().isApprovedSeller`, `applyForBusinessSeller`.
- Produces: form state `subcategory`, `postingType`; gate UI.

- [ ] **Step 1: Add a Subcategory select** after the category select — options from `CATEGORY_CONFIG[category].subcategories`; hidden when the list is empty (`other`). Store in form state; include in the submit payload.

- [ ] **Step 2: Add the posting-type step** — radio "Personal listing" / "Business listing". For `food`/`services`, lock to Business and show a note. Store `postingType`.

- [ ] **Step 3: Gate** — when `postingType==='business'` and `!isApprovedSeller`, disable submit and render the repurposed `BusinessRequiredModal` (or inline panel) with the spec copy + an "Apply for Business Seller" button → calls `applyForBusinessSeller()` (business accounts) or navigates `/login?register=business` (personal users). Update `BusinessRequiredModal` copy/props accordingly.

- [ ] **Step 4: Submit** — include `subcategory` and `postingType` in `addListing(...)`. On 403 show the gate message inline.

- [ ] **Step 5: Lint + build.** Run: `npx eslint src/pages/AddListingPage.jsx src/components/BusinessRequiredModal.jsx && npm run build` — Expected: clean.

- [ ] **Step 6: Manual verify** (app running): personal listing in `home-living` posts; selecting Business without seller shows the gate + apply button; `food` locks to Business.

- [ ] **Step 7: Commit.**
```bash
git add src/pages/AddListingPage.jsx src/components/BusinessRequiredModal.jsx
git commit -m "feat(add-listing): subcategory select + personal/business posting gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3.3: EditListingPage + LoginPage businessType

**Files:**
- Modify: `src/pages/EditListingPage.jsx`, `src/pages/LoginPage.jsx`

**Interfaces:**
- Produces: edit keeps category locked, allows subcategory edit; business signup sends `businessType`.

- [ ] **Step 1: EditListingPage** — render the Subcategory select (category locked) using `CATEGORY_CONFIG[listing.category].subcategories`; include `subcategory` in the `update(...)` payload. Posting type shown read-only (editing posting type is out of scope; keep existing value).

- [ ] **Step 2: LoginPage BusinessForm** — add a "What type of business are you?" select (13 `BUSINESS_TYPES` labels); include `businessType` in the `register({...})` payload.

- [ ] **Step 3: Lint + build.** Run: `npx eslint src/pages/EditListingPage.jsx src/pages/LoginPage.jsx && npm run build` — Expected: clean.

- [ ] **Step 4: Commit.**
```bash
git add src/pages/EditListingPage.jsx src/pages/LoginPage.jsx
git commit -m "feat: subcategory on edit + businessType at business signup

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# PHASE 4 — Admin queue + search/filters

### Task 4.1: AdminPage Business Seller queue

**Files:**
- Modify: `src/pages/AdminPage.jsx`

**Interfaces:**
- Consumes: `adminApi.listBusinessAccounts(status)`, `adminApi.decideBusiness(id, body)`.
- Produces: seller applications list with Approve / Reject / Waive payment / Mark paid + a pending filter.

- [ ] **Step 1: Business tab** — fetch via `listBusinessAccounts('pending')` (and an "All" filter); render rows showing business name, `businessType`, `sellerStatus`, `paymentStatus`, owner.

- [ ] **Step 2: Row actions** (reuse existing optimistic-row pattern): **Approve** → `decideBusiness(id,{sellerStatus:'approved'})`; **Reject** → `{sellerStatus:'rejected'}`; **Waive payment** → `{paymentStatus:'waived'}`; **Mark paid** → `{paymentStatus:'paid'}`. Re-fetch stat cards after each (existing behaviour).

- [ ] **Step 3: Lint + build.** Run: `npx eslint src/pages/AdminPage.jsx && npm run build` — Expected: clean.

- [ ] **Step 4: Manual verify**: pending application appears; Approve flips status; Waive sets payment; the owner can then post business listings.

- [ ] **Step 5: Commit.**
```bash
git add src/pages/AdminPage.jsx
git commit -m "feat(admin): Business Seller application queue + decisions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4.2: AllListingsPage subcategory + businessType filters; nav/home/category data

**Files:**
- Modify: `src/pages/AllListingsPage.jsx`, `src/pages/CategoryPage.jsx`, `src/pages/HomePage.jsx`, `src/components/Navbar.jsx`

**Interfaces:**
- Produces: filters by subcategory + businessType; all category lists show the 10 categories.

- [ ] **Step 1: Navbar `DROPDOWN_CATEGORIES`, HomePage `CATEGORY_CARDS`, CategoryPage `CATEGORY_META`** — replace with the 10 new slugs/labels (keep existing markup/CSS).

- [ ] **Step 2: AllListingsPage** — add a Subcategory filter (options depend on the selected category from `CATEGORY_CONFIG`) and a Business Type filter; extend the existing `CAT_FILTER_CONFIG`/chip pattern; include `subcategory` label in the multi-token search match.

- [ ] **Step 3: Lint + build.** Run: `npx eslint src/pages/AllListingsPage.jsx src/pages/CategoryPage.jsx src/pages/HomePage.jsx src/components/Navbar.jsx && npm run build` — Expected: clean.

- [ ] **Step 4: Manual verify**: category pages load for all 10 slugs; subcategory + businessType filters narrow results.

- [ ] **Step 5: Commit.**
```bash
git add src/pages/AllListingsPage.jsx src/pages/CategoryPage.jsx src/pages/HomePage.jsx src/components/Navbar.jsx
git commit -m "feat(search): subcategory + businessType filters; 10-category nav

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# PHASE 5 — Business profile display

### Task 5.1: Profile / Seller / Listing business display + apply CTA

**Files:**
- Modify: `src/pages/ProfilePage.jsx`, `src/pages/SellerProfilePage.jsx`, `src/pages/ListingDetailPage.jsx`

**Interfaces:**
- Consumes: `useAuth().businessType/sellerStatus/paymentStatus/isApprovedSeller/applyForBusinessSeller`; adapted listing `seller`.

- [ ] **Step 1: ProfilePage business section** — show Business Name · Business Type (label) · Verified Badge · **Seller Status** + payment state (own profile). When `sellerStatus ∈ {not_applied, rejected}`, render an **"Apply for Business Seller"** button → `applyForBusinessSeller()`; show Pending/Approved otherwise.

- [ ] **Step 2: SellerProfilePage + ListingDetailPage seller card** — when the seller is a business, display Business Name · Business Type · Verified Badge · Seller Status (read-only). Use existing `VerifiedBadge`.

- [ ] **Step 3: Lint + build.** Run: `npx eslint src/pages/ProfilePage.jsx src/pages/SellerProfilePage.jsx src/pages/ListingDetailPage.jsx && npm run build` — Expected: clean.

- [ ] **Step 4: Manual verify**: business profile shows type + seller status + apply CTA when not applied; personal accounts unaffected.

- [ ] **Step 5: Commit.**
```bash
git add src/pages/ProfilePage.jsx src/pages/SellerProfilePage.jsx src/pages/ListingDetailPage.jsx
git commit -m "feat(profile): business type + seller status display + apply CTA

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# PHASE 6 — Carousel imagery

### Task 6.1: Generate + wire 10 category images

**Files:**
- Create: `public/categories/<slug>.png` for all 10 slugs
- Modify: `src/pages/HomePage.jsx` (`CATEGORY_CARDS` image paths)

**Interfaces:**
- Produces: each carousel card points at `/categories/<slug>.png`.

- [ ] **Step 1: Generate** 10 photoreal images via Higgsfield `generate_image` (one per slug) with prompts: real-world subject, natural lighting, no text/logos, no illustration. Subjects: vehicles=car, property=house exterior, electronics=laptop+phone flatlay, home-living=living room, fashion=sneakers+folded clothes, services=worker with toolbox, food=home-cooked meal, jobs=modern office, fitness=dumbbells/gym, other=assorted everyday goods. Landscape ~1200×800.

- [ ] **Step 2: Save** each to `public/categories/<slug>.png` (download the generated asset URL to the path).

- [ ] **Step 3: Point `CATEGORY_CARDS`** image fields at `/categories/<slug>.png` for all 10.

- [ ] **Step 4: Build + manual verify.** Run: `npm run build`; load the homepage — carousel shows all 10 tiles, no broken images (the `handleImgError` fallback should not trigger).

- [ ] **Step 5: Commit.**
```bash
git add public/categories src/pages/HomePage.jsx
git commit -m "feat(home): photoreal carousel images for the 10 categories

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification (after Phase 6)

- [ ] `npm run build` green; `npx eslint src` clean on changed files.
- [ ] Backend boots; `GET /api/listings?status=approved` returns new slugs.
- [ ] Row counts: `SELECT count(*) FROM listings` equals the pre-migration `dev.db.bak` count (no data loss).
- [ ] Personal post free in a broad category; business post blocked until admin approves + waives; commercial categories force business.
- [ ] Featured cap: 3rd featured for one business → 409.
- [ ] Admin queue approves/rejects/waives/marks-paid; profile/seller/listing show business type + seller status.
- [ ] Remove `server/prisma/dev.db.bak` once satisfied.

## Self-Review Notes (spec coverage)

- Taxonomy (10 + subcats) → 1.1, 1.3, 4.2. Migration/no-loss → 1.2, 1.4, final check. Posting gate/per-listing → 2.3, 3.2. Seller workflow + payment states → 1.2, 2.1, 2.2, 3.1. Admin (approve/reject/waive/paid) → 2.2, 4.1. Featured cap 2 → 2.4. businessType → 2.5, 3.3, 5.1. Search/filters → 2.3, 4.2. Business display → 5.1. Images → 6.1. UI preserved / no redesign → enforced per task (data into existing components).
