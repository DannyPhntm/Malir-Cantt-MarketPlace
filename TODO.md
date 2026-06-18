# TODO

---

## Next 3 Priorities (recommended)

The backend is live end-to-end (DB, JWT auth + roles, listings CRUD + edit, admin
moderation, saved listings, search/details, Food, public stats, contact —
Phases 5.1 → 5.7). The next priorities target production-readiness and scale:

1. **Image upload + hosting** — biggest production blocker
   Listing images are stored as base64 data-URLs inside the DB (`listing_images.image_url`),
   which bloats payloads/storage and won't scale. Add a real store (S3 / Supabase
   Storage / Cloudinary) + an upload endpoint in front of `createListing`; the column
   already holds a URL, so the read path doesn't change. (Add + Edit pages send base64.)

2. **Server-side search + pagination + views tracking**
   The approved feed currently loads ALL listings and filters/searches client-side
   (`ListingsContext` + `AllListingsPage`) — and `/stats/public` `categoryCounts` /
   homepage sections also lean on the full feed. Move search/filter/sort/pagination to
   the API via query params (the typed filters already map cleanly) and add a real
   listing `views` counter (currently always 0). Required before the catalogue grows.

3. **Production email delivery + contact inbox**
   Two loops are stored-but-not-sent: verification/reset codes only print to the server
   console without SMTP, and contact-form messages are persisted (`ContactMessage`) but
   go nowhere. Wire real SMTP creds (`server/.env` `SMTP_*`), and surface contact
   messages (an admin inbox tab reading `ContactMessage`, or a forwarding step). Closes
   the email + contact systems end-to-end.

   Runners-up: 401 auto-logout + refresh-token rotation; responsive pass
   (375–1440px); WhatsApp on SellerProfilePage; remove the stray `server/ruflo/`
   vendored clone (now gitignored).

---

## Current Sprint (Phase 4)

□ WhatsApp contact on SellerProfilePage
  WhatsApp Seller is live on ListingDetailPage (Phase 4.1). Bring the same
  `toWhatsAppNumber()` + wa.me deep link to the SellerProfilePage contact card
  for parity. Quick win — reuse the ListingDetailPage helper.

□ Responsive testing pass
  Full audit at 375px, 390px, 768px, 1024px, and 1440px.
  Priority areas: ListingDetailPage two-column layout at tablet, SellerProfilePage
  profile card wrapping on mobile, filter panel grid on narrow screens,
  Add Listing "Listing Visibility" two-up cards on narrow screens.

---

## Up Next

□ Real authentication (backend required)
  Login / Register UI exists at `/login`. Forms submit but have no real auth.
  Prerequisite for: listing ownership, saved listings sync, messaging.
  Stack options: Supabase (fast), Firebase Auth, or custom Node API.

□ Real listing data + backend
  All 32 listings are mock data in `src/data/listings.js`.
  Need a database, API, and image hosting for real listing creation and retrieval.

□ Loading skeleton states
  Listing grids need shimmer/skeleton placeholders for async data.
  Implement as `<SkeletonCard />` that matches the `ListingCard` grid dimensions.

□ Seller verification flow
  Cantt Pass number field exists in RegisterPage. Need a process to:
  verify the pass number, mark the account as `isVerified: true`, and assign
  `badgeType: 'resident'` or `'business'`. Until backend exists, keep mock state.

□ Category images — Gym & Services
  `/categories/gym.png` and `/categories/services.png` still use Unsplash URLs.
  User-supplied local images would complete the set.

---

## Completed

✓ Phase 5.7 — Trust & Information System (2026-06-18)
  ✓ Public stats endpoint GET /stats/public (activeListings/users/verifiedBusinesses/
    categories/categoryCounts); statsApi + usePublicStats hook
  ✓ Homepage stats now dynamic (hero trust stats + real per-category carousel counts);
    removed hardcoded numbers / fake social proof
  ✓ About page (/about) — info blocks + real stats strip
  ✓ Contact page (/contact) — inquiry types + form → POST /contact (ContactMessage
    model + migration; persisted + dev-logged; no email integration)
  ✓ Recently Added homepage section (latest approved, reuses Featured layout)
  ✓ Footer (App-wide) with About/Contact links + real trust signals + safety note
  ✓ Verified (contact 201/422, public stats live) + npm build passes

✓ Phase 5.6 — Edit Listing + Owner Controls (2026-06-17)
  ✓ Dedicated /edit-listing/:id (RequireAuth): preloads general + category-specific
    fields from details; category locked; reuses Add Listing cards + CategoryFields
  ✓ Images: reuse existing + add/remove/reorder (cover = first); 1–10 (Jobs/Services 0–10)
  ✓ Saves via PATCH (never creates); success message; redirect to My Listings;
    editing a rejected listing resubmits it (→ pending)
  ✓ PATCH /listings/:id extended: details + images (replace set, min-count enforced) + status pending
  ✓ Owner controls on listing detail (owner only): Edit / Mark Sold / Archive / Delete + status chip
  ✓ Public/non-owner: only Contact / WhatsApp / Save (new Save button); admin moderation stays in dashboard
  ✓ My Listings Edit → /edit-listing/:id; adapter exposes userId for ownership checks
  ✓ Security: backend 401/403/200 on PATCH/DELETE; client Unauthorized notice; owner can't self-approve pending
  ✓ Verified (13/13 edit-endpoint checks) + npm build passes

✓ Phase 5.5 — Admin System Completion (2026-06-17)
  ✓ Dashboard shows all 10 live metrics (added hidden + featuredPending to /stats)
  ✓ Listing moderation in UI: status sub-filter (Pending/Approved/Hidden) +
    Approve/Feature/Reject/Hide/Restore/Delete (confirm-gated); adminApi.deleteListing
  ✓ Featured tab: list requests + Activate / Reject (no payment, admin-controlled)
  ✓ User management: GET /users?search= + _count.listings; search box + count in UI
  ✓ create-admin.js + npm run create-admin (idempotent, env/strong-password, no wipe)
  ✓ setListingStatus accepts {status?, featuredActive?, featuredRequested?} (one endpoint)
  ✓ Fixed query-boolean bug (z.coerce.boolean made 'false' → true); featured=false now correct
  ✓ Security verified: admin routes 401/403, no self-promotion via register or PATCH
  ✓ Verified end-to-end (23/23 API checks) + npm build passes
  → No banning / user deletion (intentionally out of scope)

✓ Phase 5.4 — Real Email Verification System (2026-06-17)
  ✓ Nodemailer SMTP transport (env-configured, any provider) + graceful server-side
    console fallback when no creds (dev/CI work; codes never reach the client)
  ✓ Registration / resend / password-reset send the code by email; codes no longer
    returned in any API response
  ✓ Code TTL 15 → 10 minutes; reuse prevention already in place (verified/used flags)
  ✓ Email change flow — request/confirm endpoints (auth) verify the NEW address before
    swapping; inline ProfilePage panel (new email → code → confirm)
  ✓ Removed all dev code-display behaviour (verify-dev-hint UI+CSS, devCode plumbing,
    mock emailService.js)
  ✓ Verified end-to-end (19/19 API checks) + vite build passes
  → To send real mail: set SMTP_* in server/.env (empty = console fallback)

✓ Phase 5.3 — Marketplace Search & Category Experience (2026-06-16)
  ✓ listings.details JSON column; adapter rebuilds labelled meta → category-specific detail chips restored
  ✓ Food & Home Kitchen category (business-only, server-enforced) + upgrade prompt for personal users
  ✓ Search bar fix (padding/overlap, vertical centering, autofocus); Enter submits
  ✓ Search: case-insensitive, multi-token, across title/description/category/details/seller/area
  ✓ Per-category typed filters (select/text/range) reading from details; vehicle Year From/To range
  ✓ Shoes Gender field; range type prepares price/mileage ranges
  ✓ Verified via headless browser + API, 0 console errors
  → Future: server-side search/pagination; numeric price/mileage range inputs; listing edit page

✓ Phase 5.2.6 — Complete User Account System (2026-06-16)
  ✓ Protected /dashboard /profile /saved-listings /my-listings (redirect preserves destination)
  ✓ Profile: API-backed save (name/phone/location), email+verification read-only, success/error, persists
  ✓ Dashboard Overview: real listing/featured/account counts via /listings/mine + computeListingStats
  ✓ Saved listings backend (saved_listings table + /api/saved CRUD); FavoritesContext optimistic + rollback,
    guest→account merge on login, persists across sessions
  ✓ Hidden/pending/rejected listings 404 to public; owner/admin can view (optionalAuth)
  ✓ Loading/error/empty states across account pages; savedApi + listingStats reusable modules
  ✓ Verified via headless browser + API, 0 console errors

✓ Phase 5.2.5 — My Listings Integration (2026-06-16)
  ✓ GET /listings/mine (auth) — owner's listings, all statuses
  ✓ Owner status lifecycle: Mark Sold / Hide / Re-activate via PATCH /listings/:id (owner-or-admin)
  ✓ Added 'hidden' status + owner-settable transition rules (moderation stays admin-only)
  ✓ MyListingsPage API-backed: optimistic updates, loading/error, status mapping; route protected
  ✓ Delete via DELETE /listings/:id; listingsApi.mine/update/remove
  ✓ Verified via headless browser (mark sold persists across reload), 0 console errors
  → Edit page (PATCH title/desc/price) still TODO; Edit currently links to /add-listing

✓ Phase 5.2.4 — JWT Auth + Role Enforcement (2026-06-16)
  ✓ JWT issued on login/verify-email; requireAuth + requireRole('admin') middleware
  ✓ Admin endpoints (stats/users/business list+decision/listing status) now 401/403/200 enforced
  ✓ Listing create/edit/delete require auth + ownership; owner derived from token
  ✓ Frontend apiClient attaches Bearer token; session rehydrates via GET /auth/me; logout clears it
  ✓ Verified API (401/403/200) + browser (reload-persist, public browse, admin approve), 0 errors
  → Future: refresh-token rotation; 401 auto-logout interceptor

✓ Phase 5.2.4 (cont.) — Admin Dashboard Integration (2026-06-16)
  ✓ Statistics endpoint (GET /stats) + stat cards (users / listings by status / featured / business pending)
  ✓ Users tab (GET /users) with role + verification tags
  ✓ Stat counts refresh automatically after approve/reject; approved items leave queue + go public
  ✓ adminApi.getStats() + listUsers(); loading/error states across tabs
  ✓ Verified via headless browser (stats live-update on approve), 0 console errors

✓ Phase 5.2.4 — Admin Moderation UI (2026-06-16)
  ✓ /admin panel (admin-only via RequireAdmin + user.role): Listings + Business tabs
  ✓ Approve / Feature / Reject listings (PATCH status); Approve / Reject business apps
  ✓ adminApi.js; backend User.role column + admin seed (admin@malircantt.pk / admin123)
  ✓ GET /business-accounts?approved= list endpoint; Navbar Admin link for admins
  ✓ Verified via headless browser (non-admin blocked, approvals clear queue), 0 console errors
  → Backend role enforcement still pending JWT (endpoints are UI-gated for now)

✓ Phase 5.2.3 — Create Listing Integration (2026-06-16)
  ✓ Submit → POST /listings (pending approval); category-specific + image validation
  ✓ Image rules: Jobs/Services 0–10 (raised Jobs cap 1→10), others 1–10
  ✓ Featured chooser → featuredRequested; Services gated to business (upgrade modal for personal)
  ✓ Draft persistence (malir-listing-draft) — restored on reload, cleared on success
  ✓ Success confirmation screen ("pending approval") with View Listing / Post Another
  ✓ Verified via headless browser (login → post → success), 0 console errors

✓ Phase 5.2.2 — Listings Integration (2026-06-16)
  ✓ listingsApi.js + listingAdapter.js (backend listing → legacy UI shape)
  ✓ ListingsContext API-backed: allListings (approved) + loading/error/refresh/getListing; addListing POSTs
  ✓ Homepage featured-first then standard; CategoryPage / AllListings / SellerProfile / Detail wired to backend
  ✓ ListingDetailPage fetches single listing by id (works for own pending listing)
  ✓ Reusable LoadingState component; loading + empty + error states across listing pages
  ✓ Backend: richer seller select on listings endpoints
  ✓ Verified via headless browser smoke test (6 flows, 0 console errors)
  → Next: server-side search + pagination; views tracking; image upload/storage;
    wire My Listings / status management to the API; JWT sessions

✓ Phase 5.2.1 — Authentication Integration (2026-06-16)
  ✓ apiClient.js + authApi.js services (VITE_API_URL, ApiError with field map)
  ✓ AuthContext rewritten API-backed; session = user id (malir-session), rehydrate via GET /users/:id
  ✓ LoginPage wired: register, email verify, sign-in, forgot-password — all via API, UI unchanged
  ✓ Navbar Logout button (reuses existing styling) when authenticated
  ✓ Backend: added POST /auth/resend-verification
  ✓ Removed mock auth (malir-auth/malir-profile, emailService usage); friendly error handling
  → Next (Phase 5.2.2): wire listings (ListingsContext/AddListing) to the API;
    then JWT/sessions, real email provider, image upload
  ✓ /server — Node + Express + Prisma (SQLite) backend; frontend untouched
  ✓ 6 models with relationships: User, Listing, ListingImage, BusinessAccount,
    EmailVerificationCode, PasswordResetCode
  ✓ zod validation incl. image-count rule (min 1 except jobs/services, max 10)
  ✓ REST API: auth (register/verify/login/reset), users, listings, business-accounts
  ✓ bcrypt hashing, central error handler, seed data, README with API + integration notes
  ✓ Verified: migrate + seed, validation, register→verify→login, business approval
  → Next (Phase 5.2): wire frontend Contexts to the API; add JWT/sessions;
    real email provider; image upload/storage

✓ Phase 4.4.5 — Final UI Polish Before Phase 5 (2026-06-16)
  ✓ SellerProfilePage card spacing — avatar + Contact Seller no longer touch edges (desktop 32/40, mobile 24)
  ✓ Add Listing protected — RequireAuth gate; unauthenticated → /login?redirect, returns after sign-in
  ✓ AuthContext: real persisted isAuthenticated + login()/logout() (localStorage malir-auth)
  ✓ Branded placeholder cards for imageless Jobs/Services (gradient panel + icon + type pill)
  ✓ Listing grid stays consistent — placeholder fills same 4:3 slot (identical heights/hover/badge)

✓ UI Polish & Fixes (2026-06-15)
  ✓ Hero "POPULAR:" label legibility (bold uppercase + text-shadow over the photo)
  ✓ SellerProfilePage stats → evenly-distributed centered 3-column (Total/Active/Sold)
  ✓ SellerProfilePage avatar + contact vertically centred (desktop); top-aligned on mobile
  ✓ Contact-reveal phone is now a contained panel, not edge-anchored text
  ✓ Removed the "Featured Seller" badge/concept (sellers can't be featured, only listings)
  ✓ Removed the redundant navbar desktop search (single search entry point reaffirmed)

✓ Phase 4.4 (Update) — Premium Workflow Refinements
  ✓ Payment separated from approval: PAYMENT_STATUS + two-gate premium requests
  ✓ createPremiumRequest() shared shape for featured listings + business applications
  ✓ premiumService.js — pure admin-ready transitions (approve/reject/markPaid/isPremiumActive)
  ✓ Standard listings remain free + instant; featured/business require approval (never auto-activated)

✓ Phase 4.4 — Premium Marketplace Infrastructure
  ✓ premiumConfig.js — statuses, account types, listing tiers, badge types, benefits, PRICING, sponsored placeholders
  ✓ VerifiedBadge: 3 kinds (Email Verified, Verified Resident, Verified Business)
  ✓ BusinessBenefitsCard + FeaturedListingOption reusable components
  ✓ Business application flow (apply → Pending Approval → Verified Business badge on approval)
  ✓ Services category gated to approved business accounts
  ✓ AddListing featured option (listings can be featured; sellers cannot)

✓ Phase 4.3 — Smart Discovery
  ✓ recentlyViewedService.js (dedupe, move-to-front, cap 20) — removed duplicated logic
  ✓ RelatedListings "You May Also Like" component (same-category only) on ListingDetailPage

✓ Phase 4.1 — Seller Contact System
  ✓ WhatsApp Seller + Call Seller on ListingDetailPage
  ✓ Enhanced seller card: account type, area, member since, verification badge

✓ Phase 3.4 — Seller Profiles
  ✓ SellerProfilePage at /seller/:sellerName
  ✓ Avatar with initials, VerifiedBadge, meta pills (account type, area, join date, business category)
  ✓ Stats row: Total / Active / Sold
  ✓ Contact Seller button with phone reveal (Call + Copy)
  ✓ Listings grid filtered by seller.name from ListingsContext
  ✓ "View Profile →" link in ListingDetailPage seller card
  ✓ Graceful not-found state

✓ Phase 3.3 — Sorting
  ✓ 6 sort options on both AllListingsPage and CategoryPage: Newest, Oldest, Price Low-High,
    Price High-Low, Most Popular, Recently Added
  ✓ parseTimeAgo() helper — makes "Recently Added" (timeAgo asc) distinct from "Newest" (id desc)
  ✓ Sorting works alongside all filters

✓ Phase 3.2 — Smart Filters
  ✓ Collapsible filter panel in AllListingsPage (AnimatePresence height animation)
  ✓ Price range (min/max via priceRaw)
  ✓ Location text filter
  ✓ Category-specific filters: Vehicles (Year/Fuel/Transmission), Property (Type/Bedrooms),
    Shoes (Size/Condition), Gym (Equipment Type/Condition), Jobs (Job Type/Experience),
    Services (Service Type)
  ✓ Active filter chips row with individual removal and "Clear all"
  ✓ Category-specific data added to all 32 listings in listings.js

✓ Phase 3.1 — Advanced Search
  ✓ Navbar desktop search panel (animated, pre-fills from URL)
  ✓ Navbar mobile search input
  ✓ Inline search form in AllListingsPage hero
  ✓ Real-time localQuery filtering + URL persistence via setSearchParams
  ✓ Seller name + location included in search scope
  ✓ showSeller prop on ListingCard

✓ Phase 2.4 — Profile Management
  ✓ ProfilePage at /profile (view/edit mode toggle, CSS cascade mode switching)
  ✓ AuthContext extended: updateProfile + localStorage persistence (malir-profile)
  ✓ Personal Info, Business Profile (conditional), Account Info sections
  ✓ Email verified chip, success banner

✓ Phase 2.3 — Saved Listings
  ✓ SavedListingsPage at /saved-listings (live data from FavoritesContext)
  ✓ 3-col SavedCard grid with AnimatePresence popLayout removal animation
  ✓ View Listing + Remove actions; empty state with Browse CTA

✓ Phase 2.2 — My Listings
  ✓ MyListingsPage at /my-listings with status management (Active/Sold/Hidden)
  ✓ Per-listing actions: Edit, Mark as Sold, Hide, Delete (two-step confirm)
  ✓ Stats strip + filter tabs

✓ Phase 2.1 — User Dashboard
  ✓ DashboardPage at /dashboard; card grid linking to My Listings, Saved Listings, Profile

✓ Phase 4E — Login / Register UI
  ✓ Two-tab LoginPage (Sign In + Create Account)
  ✓ AccountTypePicker → PersonalForm / BusinessForm (2-step)
  ✓ PasswordField with show/hide; MockSuccess confirmation

✓ Phase 2 — Navigation & Page Architecture
  ✓ React Router v7 (BrowserRouter + Routes + AnimatePresence page transitions)
  ✓ ScrollToTop on route change
  ✓ PageTransition component (fade + slide enter/exit)
  ✓ HomePage.jsx (extracted from App.jsx, hero + featured + recently viewed)
  ✓ CategoryPage (/category/:slug) — all 8 categories, sort (6 options), empty state
  ✓ ListingDetailPage (/listing/:id) — image gallery, lightbox, chips, description, seller card,
    phone reveal, related listings, "View Profile" link
  ✓ AddListingPage (/add-listing) — category-first dynamic form, image compression,
    CategoryFields, BusinessRequiredModal, profile autofill, validation
  ✓ LoginPage (/login) — Sign In / Create Account tabs, password toggle, mock notice
  ✓ AllListingsPage (/listings + /browse) — search, category filter, 6 sort options,
    smart filter panel, active chips
  ✓ NotFoundPage (404 catch-all)
  ✓ Navbar: search panel, Link/NavLink with active state, mobile menu, categories dropdown

✓ Phase 1 — Homepage UI
  ✓ Favourites system (FavoritesContext, localStorage, heart pop animation)
  ✓ FavoritesDrawer (slide-in panel, card grid, empty state)
  ✓ Favourites icon in Navbar with count badge
  ✓ "Join / Login" bordered ghost CTA
  ✓ Recently Viewed section (localStorage, auto-hides when empty, Clear button)
  ✓ Carousel listing counts
  ✓ Nav links truly centred (absolute positioning fix)
  ✓ Category renames + Gym & Fitness + Shoes & Footwear added
  ✓ Trust stat wording, FeaturedListings filter, local category images
  ✓ Refine hero section (layered radial background, new headline, search enhancements)
  ✓ Upgrade typography (Inter variable font, full token hierarchy)
  ✓ CSS custom property design system (colour, spacing, motion, radius, z-index tokens)
  ✓ Better category cards (icon box treatment, hover inversion, shadow lift)
  ✓ Listing card refinement (border, uniform padding, all transitions tokenised)
  ✓ Scroll entrance animations (Framer Motion whileInView with stagger)
  ✓ Navbar checkpost brand icon (boom gate SVG)
  ✓ Motion tokens and reduced-motion accessibility block
