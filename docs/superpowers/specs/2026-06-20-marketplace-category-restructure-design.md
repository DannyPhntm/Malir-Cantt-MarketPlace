# Marketplace Category Restructure — Design Spec

**Date:** 2026-06-20
**Status:** Approved (design) — pending spec review
**Author:** Daniyal Ali + Claude

## Problem

The marketplace uses 9 narrow categories (Cars, Electronics, Property, Furniture, Shoes, Gym, Services, Jobs, Food). New product types (home decor, plants, crafts, stationery, gifts…) appear constantly; we can't mint a category each time. We need a broad, scalable top-level structure with subcategories, a business-type taxonomy, updated search/filters, and a **safe migration with zero data loss**, all without redesigning the UI.

## Goals / Success Criteria

- Broad, scalable top-level categories + subcategories, stored in the DB and searchable.
- `businessType` captured at business signup and displayed on profiles + business listings.
- Existing listings migrated safely (no data loss).
- Search & filters support category + subcategory + business type.
- Existing UI/styling/responsiveness preserved (new data into existing components).

## Non-Goals (YAGNI)

- No separate `categories` DB table / arbitrary nesting — the taxonomy is fixed config.
- No multi-level (3+) nesting. One level of subcategory only.
- No payment/marketplace-fee changes. No redesign.

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

**Business-only categories:** preserve current backend rule — `food` only (`BUSINESS_ONLY_CATEGORIES = ['food']`). Unchanged.

**Image-optional categories:** `jobs`, `services` (unchanged); `other` added (image optional, min 0).

---

## 2. Business types (`BUSINESS_TYPES` constant, shared FE/BE)

13 options (slug → label): `food-beverage`→Food & Beverage, `home-decor`→Home Decor, `furniture`→Furniture, `electronics`→Electronics, `automotive`→Automotive, `fashion`→Fashion, `fitness`→Fitness, `services`→Services, `education`→Education, `beauty`→Beauty, `health`→Health, `real-estate`→Real Estate, `other`→Other.

---

## 3. Data model changes

- `listings.subcategory` — new **nullable** `String` column (`@map("subcategory")`). Slug from the selected category's subcategory list, or null.
- `business_accounts.businessType` — new **nullable** `String` column (`@map("business_type")`). One of `BUSINESS_TYPES`, or null.
- Prisma migration: `add_subcategory_and_business_type`.

No other schema changes. `category` stays a free string (validated against the new `CATEGORIES` enum).

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

Seed (`prisma/seed.js`) updated to use new slugs so fresh installs match.

---

## 5. Backend changes

- `server/src/lib/constants.js`: replace `CATEGORIES` with the 10 new slugs; add `SUBCATEGORIES` map (category→[subSlug]); add `BUSINESS_TYPES`; add `subcategory` validity helper; `IMAGE_OPTIONAL_CATEGORIES` += `other`. `BUSINESS_ONLY_CATEGORIES` unchanged (`food`).
- `validators/schemas.js`:
  - `listingCreateSchema` / update: add `subcategory` optional string; `.superRefine` validates it belongs to the chosen `category` (or is null).
  - `registerSchema` (business branch): add `businessType` optional enum (set on the business account at signup).
- `controllers/listings.controller.js`: accept/persist `subcategory`; `GET /listings` accepts `subcategory` filter (exact) + keeps existing filters.
- `register` controller: when `accountType==='business'`, persist `businessType` on the created `businessAccount`.
- Seller/business includes expose `businessType`.
- **Editing businessType is out of scope** for this iteration — it is captured at signup and displayed read-only, consistent with today's behavior where Profile business fields (businessName etc.) are not persisted back to the API.

---

## 6. Frontend changes (UI preserved — data only)

- `src/data/categoryConfig.js`: re-keyed to the 10 categories; each entry gains `subcategories: [{slug,label}]`; field sets remapped as in §1.
- **AddListingPage / EditListingPage**: after category select, render a **Subcategory** select (from the category's list; hidden for `other`). Persist `subcategory` via `addListing`/`update`. Category remains immutable on edit; subcategory editable.
- **AllListingsPage**: add Subcategory filter (dependent on selected category) + Business Type filter using the existing `CAT_FILTER_CONFIG`/chip pattern. Free-text search extended to include subcategory label.
- **Navbar** categories dropdown + **HomePage** `CATEGORY_CARDS`/carousel + **CategoryPage** `CATEGORY_META`: updated to the 10 categories.
- `listingAdapter.js`: expose `subcategory` (+ label).
- **AuthContext**: surface `businessType` from the business account in the derived profile.
- **LoginPage** BusinessForm: add "What type of business are you?" select (13 options) → sent with register, stored at signup.
- **ProfilePage / SellerProfilePage / ListingDetailPage seller card**: display Business Name · Business Type · Verified Badge · Business Status for business accounts (read-only).

---

## 7. Carousel images

10 AI-generated tiles via Higgsfield, **photoreal** prompts (real-world subject, natural lighting, no text/logos/illustration) to stay recognisable and avoid the AI look. Output to `public/categories/<slug>.png` (landscape, ~1200×800). Config in `CATEGORY_CARDS` points at them; trivially swappable for real photography later.

Per-category subjects: vehicles=car, property=house exterior, electronics=laptop/phone flatlay, home-living=living room/sofa, fashion=sneakers+clothing, services=toolbox/worker, food=home-cooked meal, jobs=office/handshake, fitness=dumbbells/gym, other=assorted goods/parcel.

---

## 8. Delivery — 5 verified phases

1. **Foundation**: constants + `categoryConfig` re-key + schema migration + data backfill script + seed update + adapter. Verify: migration runs, no listing lost, app boots on new slugs.
2. **Forms**: AddListing/EditListing category→subcategory + businessType at signup. Verify: create/edit round-trips subcategory; business signup stores type.
3. **Search & filters**: subcategory + businessType filters + search. Verify: filtering returns correct sets.
4. **Business profile display**: businessType + badge + status on profile/seller/listing. Verify: renders for business, hidden for personal.
5. **Imagery**: generate + wire 10 carousel images. Verify: carousel renders all 10, no broken images.

Each phase: lint + build green, backend smoke-tested, no data loss.

---

## Risks / Mitigations

- **Data loss during migration** → idempotent script, nullable columns, fallback to `other`, dry-run log before commit; back up `dev.db` first.
- **FE/BE slug drift** → slugs centralised; backend `CATEGORIES` and FE `categoryConfig` keys must match (checked in Phase 1).
- **AI images reading as synthetic** → photoreal prompts; config swappable; accept user may replace later.
- **Broad fields losing useful attributes** → keep existing rich field sets on migrated categories; only new categories get generic fields.

## Affected Files (high level)

Backend: `prisma/schema.prisma`, new migration, `prisma/seed.js`, `scripts/migrate-categories.js` (new), `src/lib/constants.js`, `src/validators/schemas.js`, `src/controllers/listings.controller.js`, business/user controllers.
Frontend: `src/data/categoryConfig.js`, `src/pages/AddListingPage.jsx`, `EditListingPage.jsx`, `AllListingsPage.jsx`, `CategoryPage.jsx`, `ProfilePage.jsx`, `SellerProfilePage.jsx`, `ListingDetailPage.jsx`, `LoginPage.jsx`, `src/components/Navbar.jsx`, `HomePage.jsx`, `src/services/listingAdapter.js`, `src/services/listingsApi.js`, `src/context/AuthContext.jsx`, `public/categories/*`.
