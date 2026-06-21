# Marketplace Category Restructure + Business Seller Monetization — Design Spec

**Date:** 2026-06-20
**Status:** Approved (design) — pending spec review
**Author:** Daniyal Ali + Claude

## Problem

Two related problems:

1. **Taxonomy doesn't scale.** The marketplace uses 9 narrow categories (Cars, Electronics, Property, Furniture, Shoes, Gym, Services, Jobs, Food). New product types (home decor, plants, crafts, stationery, gifts…) appear constantly; we can't mint a category each time. We need broad top-level categories + subcategories.
2. **Businesses are treated like residents.** Commercial sellers post for free alongside residents. We need a **Business Seller** gate: residents post personal items free; commercial/business listings require an **approved (and payment-settled) Business Seller**, with admin approval/waiver controls and payment-readiness fields so a real gateway can be wired later.

Both ship together with a business-type taxonomy, updated search/filters, featured-listing caps, and a **safe migration with zero data loss** — without redesigning the UI.

## Goals / Success Criteria

- Broad, scalable top-level categories + subcategories, stored in the DB and searchable.
- `businessType` captured at business signup and displayed on profiles + business listings.
- **Per-listing personal vs business posting**: residents post personal listings free; commercial/business listings require an **approved Business Seller** account.
- **Business Seller workflow** with approval states + **payment-readiness** status fields (admin approve/reject/waive/mark-paid for beta; gateway later).
- **Featured business listings**, capped at **2 concurrently per business** (admin-activated).
- Existing listings migrated safely (no data loss).
- Search & filters support category + subcategory + business type.
- Existing UI/styling/responsiveness preserved (new data into existing components).

## Non-Goals (YAGNI)

- No separate `categories` DB table / arbitrary nesting — the taxonomy is fixed config.
- No multi-level (3+) nesting. One level of subcategory only.
- **No payment gateway integration.** Payment-readiness status fields are added and admin-controllable (waive / mark paid), but nothing actually charges money yet.
- No redesign.

---

## 1. Taxonomy (single source of truth: `src/data/categoryConfig.js` + `server/src/lib/constants.js`)

10 top-level categories (slugs) with subcategory slugs. Subcategory slugs are unique **within** a category (so "accessories" may appear under both Vehicles and Fashion).

| Slug | Label | Subcategories (slug → label) |
|---|---|---|
| `vehicles` | Vehicles | cars→Cars, bikes→Bikes, auto-parts→Auto Parts, accessories→Accessories |
| `property` | Property | houses→Houses, apartments→Apartments, plots→Plots, rentals→Rentals |
| `electronics` | Electronics | phones→Phones, laptops→Laptops, gaming→Gaming, appliances→Appliances |
| `home-living` | Home & Living | furniture→Furniture, home-decor→Home Decor, kitchen→Kitchen, garden→Garden, household→Household Items |
| `fashion` | Fashion | shoes→Shoes, clothing→Clothing, accessories→Accessories |
| `services` | Services | tutors→Tutors, repair→Repair, freelance→Freelance, cleaning→Cleaning, professional→Professional Services |
| `food` | Food | home-food→Home Food, baking→Baking, catering→Catering, meal-prep→Meal Prep |
| `jobs` | Jobs | full-time→Full Time, part-time→Part Time, internship→Internship |
| `fitness` | Fitness | equipment→Equipment, memberships→Memberships, supplements→Supplements, activewear→Activewear |
| `other` | Other | _(none — catch-all)_ |

**Form fields per category:** the **top-level category** drives the dynamic form fields (broad/generic field sets in `categoryConfig`). Subcategory is a **tag select**; it does NOT change the field set. Existing field sets are remapped: `technology`→`electronics`, `furniture`→`home-living`, `shoes`→`fashion`, `gym`→`fitness`; `home-living`, `fashion`, `other` get pragmatic generic fields (e.g. Condition, Brand/Type). `other` has minimal fields (Condition optional) and image-optional.

**Commercial (business-only) categories:** `food` and `services` are inherently commercial — listings there are **forced to `postingType: 'business'`** and therefore require an approved Business Seller (`BUSINESS_ONLY_CATEGORIES = ['food', 'services']`). Every other category allows **personal** (free, any resident) or **business** posting — see §2.5. (Replaces the old "food only" rule.)

**Image-optional categories:** `jobs`, `services` (unchanged); `other` added (image optional, min 0).

---

## 2. Business types (`BUSINESS_TYPES` constant, shared FE/BE)

13 options (slug → label): `food-beverage`→Food & Beverage, `home-decor`→Home Decor, `furniture`→Furniture, `electronics`→Electronics, `automotive`→Automotive, `fashion`→Fashion, `fitness`→Fitness, `services`→Services, `education`→Education, `beauty`→Beauty, `health`→Health, `real-estate`→Real Estate, `other`→Other.

---

## 2.5 Business Seller status, posting type & monetization

The core rule: **residents sell personal items free; commercial selling requires an approved Business Seller.** This is enforced **per listing**, not by category alone.

### Account capabilities

| | Resident (personal) | Business account |
|---|---|---|
| Browse / save listings | ✅ | ✅ |
| Post **personal** listings (free) | ✅ | ✅ |
| Post **business** listings | ❌ | ✅ **only when Business Seller = approved** |
| Apply for Business Seller | — (must register a business account) | ✅ |
| Featured listings | ❌ | ✅ approved sellers, **max 2 concurrent** |

### Posting type (per listing)

- `listings.postingType` ∈ `{ personal, business }`, default `personal`.
- **Business** posting requires the owner to be a business account with **`sellerStatus === 'approved'`**.
- `food` and `services` categories **force** `postingType: 'business'` (inherently commercial).
- All other categories: the seller chooses personal or business in the Add Listing flow.

### Business Seller status (`business_accounts.sellerStatus`)

States: `not_applied` → `pending` → `approved` | `rejected`.
- A business account starts `not_applied`. **"Apply for Business Seller"** moves it to `pending`.
- Admin sets `approved` / `rejected`. `user.businessVerified = (sellerStatus === 'approved')`.

### Payment readiness (`business_accounts.paymentStatus`) — fields only, no gateway

States: `payment_required` → `payment_pending` → `paid` | `waived`.
- New approved sellers default to `payment_required`.
- **Beta:** admin can **waive** (`waived`) or **mark paid** (`paid`) manually. No gateway, no charge.
- A seller is "active for business posting" when `sellerStatus === 'approved'` **and** `paymentStatus ∈ { paid, waived }`. (This keeps the future paywall a one-line switch; for beta, approval auto-waives unless admin chooses otherwise — see migration.)

### Featured cap

- Only `approved` sellers' listings may be featured. **Max 2 `featuredActive` per business** — enforced server-side when an admin activates featured (activation beyond 2 returns a clear error; admin unfeatures one first). Existing admin featured flow + cap.

### Apply / gate UX

- Add Listing asks: **"Are you posting this as a personal or business listing?"** → Personal | Business.
- Choosing **Business** without an active seller account shows: *"Business selling requires an approved Business Seller account. Apply for Business Seller status to post commercial listings."* + an **"Apply for Business Seller"** button (→ apply endpoint / business register for personal users).

---

## 3. Data model changes

**`listings`**
- `subcategory` — new **nullable** `String`. Slug from the chosen category's subcategory list, or null.
- `postingType` — new `String`, default `'personal'` (`@map("posting_type")`). `personal | business`.

**`business_accounts`**
- `businessType` — new **nullable** `String` (`@map("business_type")`). One of `BUSINESS_TYPES`, or null.
- `sellerStatus` — new `String`, default `'not_applied'` (`@map("seller_status")`). `not_applied | pending | approved | rejected`. **Replaces the boolean `approved`** as the source of truth (see migration; `approved` is dropped and all references switch to `sellerStatus`).
- `paymentStatus` — existing column; **allowed values extended** to `payment_required | payment_pending | paid | waived` (was `not_required | unpaid | paid`).

**Constants** (`server/src/lib/constants.js` + mirrored in `src/data/premiumConfig.js`): `POSTING_TYPES`, `SELLER_STATUSES`, `PAYMENT_STATUSES` (new values), `MAX_FEATURED_PER_BUSINESS = 2`.

Prisma migration: `add_subcategory_postingtype_seller_status` (plus the `add_business_type` from the earlier draft — can be one migration). `category` stays a free string validated against the new `CATEGORIES` enum.

---

## 4. Migration (no data loss)

Two parts, run in order:

1. **Schema migration** (adds the two nullable columns — safe, no data touched).
2. **Data backfill script** `server/scripts/migrate-categories.js` — idempotent; remaps every existing `listings.category` from old→new and sets `subcategory` where unambiguous. Idempotent because new slugs are not in the old set (re-runs are no-ops). Logs a per-row summary; never deletes.

| Old `category` | New `category` | New `subcategory` |
|---|---|---|
| `vehicles` | `vehicles` | _(null)_ |
| `technology` | `electronics` | _(null)_ |
| `property` | `property` | _(null)_ |
| `furniture` | `home-living` | `furniture` |
| `shoes` | `fashion` | `shoes` |
| `gym` | `fitness` | _(null)_ |
| `services` | `services` | _(null)_ |
| `food` | `food` | _(null)_ |
| `jobs` | `jobs` | _(null)_ |

`details` JSON is left intact. Unmapped/legacy slugs (none expected) would fall back to `other` rather than being dropped. Mapping table also lives in the script for auditability/reversibility.

**Listings — `postingType` backfill:** existing listings in `food`/`services` → `business`; all others → `personal` (the safe free default; no resident listing gets gated retroactively). No data loss (new column defaulted).

**Business accounts — status backfill** (from the dropped `approved` boolean):
| Old `approved` | New `sellerStatus` | New `paymentStatus` |
|---|---|---|
| `true` | `approved` | `waived` (beta — keep existing approved sellers active) |
| `false` | `pending` | `payment_required` (lands in the admin queue) |

Seed (`prisma/seed.js`) updated to use new slugs + set `sellerStatus`/`paymentStatus`/`postingType` so fresh installs match. Back up `dev.db` before running the backfill.

---

## 5. Backend changes

- `server/src/lib/constants.js`: replace `CATEGORIES` with the 10 new slugs; add `SUBCATEGORIES` map; add `BUSINESS_TYPES`, `POSTING_TYPES`, `SELLER_STATUSES`, new `PAYMENT_STATUSES`, `MAX_FEATURED_PER_BUSINESS = 2`; `IMAGE_OPTIONAL_CATEGORIES` += `other`; `BUSINESS_ONLY_CATEGORIES = ['food','services']`.
- `validators/schemas.js`:
  - `listingCreateSchema`/update: add `subcategory` optional (validated against the category) + `postingType` optional enum (default `personal`).
  - `registerSchema` (business branch): add `businessType` optional enum.
- `controllers/listings.controller.js`:
  - **Posting gate**: on create, if `postingType==='business'` **or** category ∈ `BUSINESS_ONLY_CATEGORIES`, require the owner to be a business account with `sellerStatus==='approved'` and `paymentStatus ∈ {paid,waived}`; else **403** with the apply-prompt message. Force `postingType='business'` for commercial categories. Persist `subcategory`/`postingType`.
  - `GET /listings` accepts `subcategory` (exact) + `postingType` filters.
- **Business Seller endpoints** (`business-accounts` controller/routes):
  - `POST /api/business-accounts/apply` (auth, business account) → sets `sellerStatus='pending'` (from `not_applied`/`rejected`). Powers "Apply for Business Seller".
  - Extend admin `PATCH /business-accounts/:id/decision` to accept `{ sellerStatus, paymentStatus }` — approve/reject **and** `waive`/`mark paid`. Approving sets `user.businessVerified=true`; approval defaults `paymentStatus` to `waived` unless specified (beta).
  - Admin list: include `sellerStatus`, `paymentStatus`, `businessType` and a "pending sellers" filter.
- **Featured cap**: admin `PATCH /listings/:id/status` activating `featuredActive=true` first checks the owner has `< MAX_FEATURED_PER_BUSINESS` active-featured listings; over the cap → **409** with a clear message.
- `register` controller: persist `businessType` + initialise `sellerStatus='not_applied'`, `paymentStatus='payment_required'` on the created `businessAccount`.
- Seller/business includes expose `businessType`, `sellerStatus`, `paymentStatus`.
- **Editing businessType is out of scope** — captured at signup, displayed read-only (consistent with today's un-persisted Profile business fields).

---

## 6. Frontend changes (UI preserved — data only)

- `src/data/categoryConfig.js`: re-keyed to the 10 categories; each entry gains `subcategories: [{slug,label}]`; field sets remapped as in §1.
- **AddListingPage / EditListingPage**:
  - After category select, render a **Subcategory** select (hidden for `other`). Persist `subcategory`.
  - **Posting-type step**: "Are you posting this as a personal or business listing?" (Personal | Business). For `food`/`services` it's locked to Business. Choosing Business without an **active Business Seller** shows the gate message + **"Apply for Business Seller"** button (calls the apply endpoint for business accounts, or routes personal users to `/login?register=business`). Persist `postingType`. Replaces today's `BusinessRequiredModal` category gate with the per-listing model.
  - Category immutable on edit; subcategory + (non-commercial) postingType editable.
- **AllListingsPage**: add Subcategory + Business Type filters (existing `CAT_FILTER_CONFIG`/chip pattern). Search extended to include subcategory label.
- **Navbar** dropdown + **HomePage** `CATEGORY_CARDS`/carousel + **CategoryPage** `CATEGORY_META`: 10 categories.
- `listingAdapter.js`: expose `subcategory` (+ label) and `postingType`.
- **AuthContext**: surface `businessType`, `sellerStatus`, `paymentStatus`; derive `isApprovedSeller = sellerStatus==='approved' && paymentStatus∈{paid,waived}`; add `applyForBusinessSeller()` (real endpoint, replaces the mock `applyForBusiness`).
- **LoginPage** BusinessForm: add "What type of business are you?" select (13 options) at signup.
- **ProfilePage / SellerProfilePage / ListingDetailPage seller card**: display Business Name · Business Type · Verified Badge · Business **Seller Status** (+ payment state on own profile) for business accounts (read-only). ProfilePage business section gets the **"Apply for Business Seller"** CTA when `not_applied`/`rejected`, and shows Pending/Approved state otherwise.
- **AdminPage** Business tab: list **Business Seller applications** with `sellerStatus`/`paymentStatus`/`businessType`; actions **Approve · Reject · Waive payment · Mark paid**; pending-sellers filter. Reuses existing admin row/flash pattern.
- `src/data/premiumConfig.js`: align `APPLICATION_STATUS`/`PAYMENT_STATUS` enums + labels with the new seller/payment states (single FE source for status copy).

---

## 7. Carousel images

10 AI-generated tiles via Higgsfield, **photoreal** prompts (real-world subject, natural lighting, no text/logos/illustration) to stay recognisable and avoid the AI look. Output to `public/categories/<slug>.png` (landscape, ~1200×800). Config in `CATEGORY_CARDS` points at them; trivially swappable for real photography later.

Per-category subjects: vehicles=car, property=house exterior, electronics=laptop/phone flatlay, home-living=living room/sofa, fashion=sneakers+clothing, services=toolbox/worker, food=home-cooked meal, jobs=office/handshake, fitness=dumbbells/gym, other=assorted goods/parcel.

---

## 8. Delivery — 6 verified phases

1. **Foundation**: constants + `categoryConfig` re-key + schema (subcategory, postingType, sellerStatus, businessType; extend paymentStatus; drop `approved`) + data backfill (categories, postingType, seller/payment status) + seed + adapter. Verify: migration runs, **no listing/business lost**, app boots on new slugs.
2. **Business-seller backend & monetization**: seller-status model, `POST /business-accounts/apply`, posting gate on listing create (business/commercial → approved+settled seller, else 403), featured cap (max 2/business, 409), admin decision API (`approve|reject|waive|mark paid`). Verify: gate blocks unapproved business posts, allows personal; cap enforced; admin transitions work.
3. **Add/Edit Listing forms**: category→subcategory select + **personal/business posting toggle** with gate message + "Apply for Business Seller" CTA; businessType at business signup. Verify: personal post free; business post blocked until approved; commercial categories locked to business; apply flow moves to pending.
4. **Admin UI + search/filters**: AdminPage Business Seller queue (approve/reject/waive/paid + filter); AllListingsPage subcategory + businessType filters; search includes subcategory. Verify: admin actions reflect in DB + UI; filters return correct sets.
5. **Business profile display**: businessType + seller status + badges on Profile/Seller/Listing; Apply CTA on own profile. Verify: renders for business, hidden for personal.
6. **Imagery**: generate + wire 10 carousel images. Verify: carousel renders all 10, no broken images.

Each phase: lint + build green, backend smoke-tested, **no data loss** (back up `dev.db` before Phase 1 backfill).

---

## Risks / Mitigations

- **Data loss during migration** → idempotent script, nullable columns, fallback to `other`, dry-run log before commit; back up `dev.db` first.
- **FE/BE slug drift** → slugs centralised; backend `CATEGORIES` and FE `categoryConfig` keys must match (checked in Phase 1).
- **AI images reading as synthetic** → photoreal prompts; config swappable; accept user may replace later.
- **Broad fields losing useful attributes** → keep existing rich field sets on migrated categories; only new categories get generic fields.
- **Dropping `approved` boolean breaks references** → grep all uses (admin controller, businessVerified logic, seed, FE) and switch to `sellerStatus` in Phase 1/2 together.
- **Retroactively gating resident listings** → postingType backfill defaults to `personal` (only food/services → business); no existing resident listing becomes un-postable/hidden.
- **Future paywall** → "active seller" already gates on `paymentStatus ∈ {paid,waived}`; flipping beta default from `waived` to `payment_required` is the only switch needed when a gateway lands.

## Affected Files (high level)

Backend: `prisma/schema.prisma`, new migration, `prisma/seed.js`, `scripts/migrate-categories.js` (new), `src/lib/constants.js`, `src/validators/schemas.js`, `src/controllers/listings.controller.js`, `src/controllers/business-accounts.controller.js` (+ routes), `src/controllers/admin`/stats, user controller.
Frontend: `src/data/categoryConfig.js`, `src/data/premiumConfig.js`, `src/pages/AddListingPage.jsx`, `EditListingPage.jsx`, `AllListingsPage.jsx`, `CategoryPage.jsx`, `ProfilePage.jsx`, `SellerProfilePage.jsx`, `ListingDetailPage.jsx`, `LoginPage.jsx`, `AdminPage.jsx`, `src/components/Navbar.jsx`, `BusinessRequiredModal.jsx` (repurposed for the posting-type gate), `HomePage.jsx`, `src/services/listingAdapter.js`, `src/services/listingsApi.js`, `src/services/adminApi.js`, `src/context/AuthContext.jsx`, `public/categories/*`.
