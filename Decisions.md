# Decisions

---

## June 2026 — Foundation

- **React + Vite** selected for fast development and modern tooling.
- **Mobile-first design** — all components designed for 375px and scaled up.
- **Community-only marketplace** — Malir Cantt residents only, not a general classifieds site.
- **Deep green primary colour** (`#1a6b45`) — conveys trust, community, and nature without militarism.
- **Modular component architecture** — one CSS file per component, co-located with JSX.

---

## June 2026 — Design System

### CSS custom properties as the design system foundation
All colours, typography scale, spacing, motion, shadows, radius, and z-index values live as CSS custom properties in `src/index.css`. Component files reference only tokens — never raw values. This ensures visual consistency without a CSS-in-JS library or a framework like Tailwind, and keeps the token system visible and auditable in one place.

### 8px spacing grid with 4px sub-grid
All spacing tokens follow an 8px base grid (`--space-2` = 8px, `--space-4` = 16px, etc.) with 4px half-steps for fine-grained adjustments (`--space-1` = 4px, `--space-3` = 12px, `--space-5` = 20px). This keeps spacing visually consistent without being rigid — the sub-grid handles tight internal padding (e.g. badge pill padding) without breaking the overall rhythm.

### Single accent colour rule
Only one accent colour family — the primary green. A blue accent was introduced briefly for search focus states but removed. Multiple accent colours create visual noise in a product that should feel calm and trustworthy. Semantic focus tokens (`--color-focus-ring`, `--color-focus-border`) point back to the primary green rather than introducing a new hue.

### Motion tokens over raw transition values
All CSS `transition` properties reference `--duration-fast` (150ms), `--duration-base` (200ms), or `--duration-slow` (300ms) rather than raw values. This ensures the entire product responds consistently — tightening one token tightens every transition that uses it. Framer Motion JS values remain hardcoded numbers since CSS variables are not accessible in JavaScript without `getComputedStyle`.

---

## June 2026 — Architecture

### Animation strategy: Framer Motion for entrance, CSS for hover
Framer Motion handles scroll-triggered entrance animations (`whileInView` with stagger) and the mobile menu open/close. All hover and transition effects use pure CSS. This separation prevents a critical conflict: Framer's `whileHover` sets inline styles that override CSS custom property-based hover states. When `ListingCard` had both simultaneously, the inline shadow bypassed `var(--shadow-md)`. Removing `whileHover` from cards entirely fixed this.

### Single search entry point
Two search bars existed — a compact one in the navbar and the full hero search. The hero search was chosen as the sole entry point: it has a larger touch target, a visible submit button, popular tag shortcuts, and is always above the fold. The navbar search was removed. A single confident entry point is less confusing than two competing ones.

### No React Router — plain href routing
The project uses plain `href` links rather than React Router. At single-page MVP stage with no actual routes implemented, adding React Router would be premature. This will need to change once listing detail pages and auth flows are built.

---

## June 2026 — Visual Identity

### Checkpost barrier as brand mark
The navbar logo is a minimal boom gate SVG: vertical post, horizontal boom arm, short counterweight, filled pivot circle. This is the recognised symbol of a cantonment checkpoint — it communicates "secure, organised community" without text, military insignia, or clip-art clichés. Displayed in brand primary green (not neutral gray) to carry brand identity weight. Clicking navigates to `/`.

### Layered radial gradient hero instead of flat green
The hero background uses four stacked CSS layers (three radial gradients + a linear base) plus two decorative concentric rings via `::before`/`::after`. Layers: a top-center spotlight, an asymmetric upper-right accent, a darkened lower-left corner for depth, and a rich base gradient. Flat gradients read as template UI. Layered gradients with intentional light directionality — and the deliberate asymmetry of the off-center rings — communicate a designed product.

### Category icon box treatment
Category icons use a 52×52px rounded-square container with pale-green background rather than bare SVG strokes. On hover, the box inverts to solid primary green with the icon in white. This follows the app-icon pattern from iOS and Material Design, immediately communicating interactivity and adding visual hierarchy. The Framer Motion `y: -4` lift composites on top of the CSS shadow change — both fire on hover without conflict because Framer controls `transform` and CSS controls `box-shadow` independently.

### Listing cards require a border on the off-white surface
The page background is `--color-surface` (`#f6f6f4`). White listing cards (`#ffffff`) on this background have insufficient contrast to define card edges by shadow alone at low brightness or on low-contrast displays. A `1px solid --color-border-soft` border was added to ensure card boundaries are always legible. This is the same technique used by Airbnb, Booking.com, and Stripe for cards on neutral surfaces.

### Inter variable font for optical sizing
The Google Fonts URL was updated from fixed-weight loading to the full variable axis. This enables the `opsz` (optical size) axis that Inter specifically optimises for — strokes are subtly different at display sizes vs body sizes, improving rendering quality. All font-weight values reference `--fw-*` tokens, not raw numbers.

---

## 2026-06-12 — Features & Interaction

### Favourites backed by React Context, not prop-drilling
Three separate components need access to favourites state simultaneously: `Navbar` (count badge + open drawer), `ListingCard` (heart toggle), and `FavoritesDrawer` (render list). Prop-drilling this through `App.jsx` would require passing state through every intermediate component and create tight coupling. React Context was chosen — `FavoritesProvider` wraps the app, and `useFavorites()` gives any descendant direct access. No external state library (Zustand, Redux) was added; the use case is simple enough that Context with `useState` is sufficient.

### Favourites and recently-viewed persisted in localStorage, not server state
There is no backend yet. localStorage gives instant persistence across page refreshes with zero infrastructure. The shape stored is the full listing object (not just an id) so the UI can render without a data fetch. When a real API exists, the migration path is: keep localStorage as an optimistic cache, sync to the server on auth, and read from server on login. No structural change to the context will be needed.

### Heart pop animation via CSS keyframes, not Framer Motion
The animation on the save button could have been done with Framer Motion's `animate` prop (e.g. `useAnimation` controls). CSS `@keyframes heartPop` was chosen instead. Reason: it fires via a className toggle (`.heart-pop`) and clears itself — no JavaScript animation controller lifecycle to manage. It also avoids the known issue where Framer inline styles on SVG children can conflict with CSS `fill` transitions. CSS is the correct tool when the animation is a one-shot trigger with no interactive interruption needed.

### Navbar nav links centred with absolute positioning
`margin: 0 auto` was the initial approach to centre the nav links. This only centres within the remaining flex space — when brand (left) and actions (right) have different widths, the nav is visually off-centre. `position: absolute; left: 50%; transform: translateX(-50%)` on `.navbar__nav` anchors it to the true horizontal midpoint of the bar. The inner container is `position: relative` to establish the stacking context. Actions use `margin-left: auto` to push flush right. This is the standard pattern for 3-zone navbars where exact centring matters.

### Local images served from `public/categories/` not imported as modules
Category images supplied by the user (vehicles, technology, property, furniture, jobs) are placed in `public/categories/` and referenced as `/categories/<name>.png`. This avoids Vite's module bundling pipeline (no hash fingerprinting, no import statements, no tree-shaking concern). For images that change often or are user-supplied, the `public/` folder is the right location — they can be swapped by filename without touching source code. Unsplash URLs are used as fallback for categories without a local image.

### FeaturedListings filters to `featured: true`, not a separate data array
Rather than maintaining a separate `FEATURED_ONLY` export, `FeaturedListings.jsx` filters `FEATURED_LISTINGS` at module level (`const FEATURED = FEATURED_LISTINGS.filter(l => l.featured)`). This keeps the data source of truth in one place — toggling `featured` on any listing object is all that's needed to include or exclude it. The filter runs once at module load, not on every render.

### RecentlyViewed section hidden when empty, not shown with placeholder
Showing a "You haven't viewed anything yet" empty state below Featured Listings on every first visit adds visual noise and makes the homepage feel incomplete. The component returns `null` when localStorage is empty. Once the user has interacted with listings, the section appears naturally. This matches the behaviour of Airbnb, OLX, and similar marketplaces.

### Category rename: "Cars & Vehicles" → "Vehicles", "Electronics" → "Technology"
"Cars & Vehicles" was redundant — cars are vehicles. "Vehicles" is shorter, cleaner in the carousel card title, and leaves room to include motorcycles, rickshaws, and other transport without category name confusion. "Electronics" was renamed to "Technology" to better reflect the category scope (phones, laptops, gadgets, wearables) and match the supplied category image aesthetic. Both hrefs were updated accordingly.

---

## 2026-06-13 — Phase 2: React Router + Page Architecture

### React Router v7 at BrowserRouter level (main.jsx), not App level
`BrowserRouter` and `FavoritesProvider` both wrap `App` in `main.jsx`. This ensures the router context and favourites context are available to every component in the tree, including the Navbar and FavoritesDrawer which are rendered outside the `<Routes>` switch in `App.jsx`. Placing Router inside App would force a re-render of Router on every App state change; at the top level it is stable.

### AnimatePresence with `mode="wait"` for page transitions
`AnimatePresence mode="wait"` ensures the exiting page fully completes its exit animation before the entering page begins. `initial={false}` prevents the enter animation from firing on the first render (the homepage should not animate in on initial load). Each page wraps its content in `<PageTransition>` which provides a 260ms ease-out enter and 160ms ease-in exit — exit is shorter than enter per animation best practice (MD motion guideline).

### ScrollToTop utility — `behavior: 'instant'` not `'smooth'`
Smooth scrolling to the top on route change creates an unpleasant visual when combined with the page transition animation (the content fades while also scrolling). `behavior: 'instant'` jumps immediately to top before the enter animation plays, giving the impression of a clean new page without competing motion. `smooth` is reserved for in-page anchor navigation only.

### `motion(Link)` for ListingCard — not wrapping Link in motion.div
Using `motion(Link)` (`const MotionLink = motion(Link)`) keeps the interactive element as a single DOM node — the `<a>` tag itself is the motion element. Wrapping `<Link>` in an outer `<motion.div>` would create a div-then-a nesting that breaks CSS selector specificity for `.listing-card` styles and adds an extra layout node. React Router's `Link` forwards refs, so `motion(Link)` works correctly in Framer Motion v12.

### FavoritesDrawer closes on ListingCard click
When a listing card inside `FavoritesDrawer` is clicked, the drawer closes (`setIsOpen(false)`) before React Router navigates. This prevents the drawer from staying open over the ListingDetailPage. The `setIsOpen` call was added to `ListingCard`'s `onClick` handler (which already calls `saveRecentlyViewed`). It is a no-op when the drawer is not open — zero cost on normal card clicks from the homepage.

### AllListingsPage reuses CategoryPage.css
`AllListingsPage` imports `./CategoryPage.css` and uses the same `.cat-*` class names. Extracting shared CSS into a third file would add indirection for no benefit at this scale. The visual identity of both pages is identical — same dark header, same white content grid, same toolbar pattern. When the pages diverge enough to warrant different styles, a shared `PageLayout.css` can be extracted then.

### Phone reveal on ListingDetailPage — button replaces itself, not a modal
PROJECT.md specifies: "Contact Seller should pop up the sellers contact number and should allow the buyer to call it." Implemented as an inline reveal: clicking "Contact Seller" replaces the button with the phone number + a `tel:` "Call Now" link using Framer Motion `AnimatePresence mode="wait"`. A modal was considered but rejected — modals interrupt the user's reading flow and require a close action. The inline reveal is faster, more contextual, and requires no additional dismiss interaction.

---

## 2026-06-15 — Smart Filters, Sorting & Seller Profiles

### Category-specific filter data on listing objects, not in a meta array
The `categoryConfig.js` `fields` array defines which inputs appear when creating a listing — but at filter time, `AllListingsPage` needs to query those values without importing `categoryConfig.js`. Two approaches were considered: (1) store submitted values in a `meta: [{label, value}]` array (already used by `AddListingPage` at submit time for the detail page chips), or (2) add the fields as direct properties on the listing object. Direct properties were chosen for filter data. Filtering with `l[key]` is a single property access vs iterating a `meta` array and matching labels. The `meta` array remains the right pattern for display (detail page chips) since order and labelling matter there; direct properties are the right pattern for filtering since they enable `O(1)` lookup and simpler filter logic.

### Collapsible filter panel over sidebar layout
Two layouts were considered for the filter UI: (1) a persistent left sidebar (Airbnb / OLX style) and (2) a collapsible panel that expands below the toolbar (GOG.com / Depop style). The collapsible panel was chosen because: the listing grid is only 4 columns — a sidebar would reduce it to 3 columns and break the existing grid layout without a significant layout refactor. The collapsible panel sits above the grid and takes zero horizontal space when closed. It also fits the mobile-first constraint naturally — on mobile it collapses completely with no reflow needed.

### Active filter chips as the primary filter feedback mechanism
When multiple filters are set, users need a glanceable summary of what is active without reopening the filter panel. Filter chips (one per active filter, removable with ×) serve this role — they are visible even when the panel is closed, and clicking a chip removes that single filter without opening the panel. The count badge on the Filters button provides a secondary indicator of how many filters are set. "Clear all" appears in both the panel footer and as a chip when 2+ filters are active — two access points prevent users from hunting for how to reset.

### "Recently Added" and "Newest" are distinct sort semantics
`sort === 'newest'` orders by listing `id` descending (higher id = more recently created in the data model; user-submitted listings with `Date.now()` ids naturally surface first). `sort === 'recently_added'` orders by `timeAgo` string ascending — parsed to minutes via `parseTimeAgo()`. On the mock data, these produce meaningfully different orderings: a listing with id 21 and `timeAgo: '1 hour ago'` ranks first in "Recently Added" but far lower in "Newest" (since id 21 is mid-range). Both options are useful: "Newest" is the right default for finding new submissions; "Recently Added" is useful for finding the freshest activity regardless of which batch of data they came from.

### Seller profile derived from listing data, no separate seller entity
`SellerProfilePage` constructs the entire profile from `allListings.filter(l => l.seller?.name === name)`. No separate seller object, seller ID, or seller API exists. This is intentional at the mock-data stage — adding a seller entity (separate from listings) would require either a join at render time or a new data layer. When a real backend is introduced, a `/api/sellers/:id` endpoint can be introduced and `SellerProfilePage` can switch to fetching from it. The current approach requires zero data-layer changes and works correctly for mock data.

### Seller profile route uses encoded name, not a numeric ID
The route is `/seller/:sellerName` (URL-encoded). No seller IDs exist on the static listing objects — only `seller.name`. A slug-based route (`ahmed-khan`) was considered but rejected: generating a slug at link time and reconstructing the original name at page load requires a round-trip through a lookup table. `encodeURIComponent` / `decodeURIComponent` is lossless — the name reconstructed at page load exactly matches `seller.name` in the listings array, so the filter works without any lookup. When numeric IDs are introduced, the route can switch to `/seller/:id` without changing the page's filtering logic.

### "View Profile" link only from ListingDetailPage, not from ListingCard
`ListingCard` is a `MotionLink` (renders as `<a>`). Placing a navigable seller name inside it would create a nested anchor — invalid HTML. The save button already breaks this rule (button inside anchor) using `stopPropagation` as a workaround. Adding a second interactive element (seller name link) via the same workaround would increase the surface area of this structural compromise and make the card's click behaviour harder to reason about. The "View Profile" link in `ListingDetailPage`'s seller card is the natural, unambiguous entry point — a user who wants to explore a seller's profile is already reading a listing from that seller.

### Popular tags and carousel cards now use `Link` (not `<a href>`)
Plain `<a href>` tags inside a `BrowserRouter` cause full page reloads — the browser navigates away and React remounts from scratch, losing all in-memory state (FavoritesContext, RecentlyViewed). Converting to `<Link to>` ensures client-side navigation. The hero component is a shared component (`pulse-fit-hero.tsx`) that is always rendered inside a Router context, so importing `Link` from react-router-dom is safe.

---

## 2026-06-15 — Phase 4: Seller Contact, Smart Discovery & Premium Infrastructure

### WhatsApp uses its brand green; everything else stays on the single-accent palette
The design system enforces one accent colour (primary green). The WhatsApp button is the sole, scoped exception: it uses WhatsApp's brand green (`#25d366`). Recognition *is* the trust signal here — buyers instantly know what the button does, and Pakistan's primary buyer-seller channel deserves to be unmistakable. The exception is confined to `.detail__contact-btn--whatsapp`; the Call button stays primary green, so the rule holds everywhere else.

### Local Pakistani numbers normalised to wa.me format at render time
Seller phones are stored as locally-formatted strings (`0300-1234567`). `wa.me` requires international digits with no `+`/dashes. `toWhatsAppNumber()` strips non-digits and maps a leading `0` → `92`. Done at render time rather than in the data so the stored phone stays human-readable for the Call/Copy actions, and there is one conversion point to change if number handling evolves.

### Recently-viewed logic centralised into a service, not duplicated across components
The read (RecentlyViewed) and the write (ListingCard) previously each owned a copy of the storage key, cap, and dedupe/move-to-front logic. They drifted in trivial ways (different caps) and were a latent inconsistency. `recentlyViewedService.js` is the single owner; components call `get`/`add`/`clear`. The service stores the full listing object (not just an id) so cards render with no fetch while there is no backend, and documents the exact swap to a per-user views endpoint later.

### RelatedListings extracted as a reusable component with its own CSS
The "More in {category}" block was inline in `ListingDetailPage`. It became `RelatedListings` (renders "You May Also Like"), taking `{ listing, listings, title }` and doing the same-category filter internally. The `.detail__related*` rules were moved 1:1 into `RelatedListings.css` (renamed `.related*`) so the visuals are identical and the component is self-contained — usable on any page that has a listing in context.

### Premium: payment and approval are independent gates
Rather than a single status, every premium request (`createPremiumRequest`) carries `approvalStatus` **and** `paymentStatus`. The activation rule (`isPremiumActive`) requires *approved AND settled*. This encodes the marketplace philosophy directly: standard listings are free/instant; premium features always require admin approval; and when billing is later enabled, payment unlocks *processing* but cannot bypass approval. Flipping `PRICING[*].enabled` is the only change needed to switch new requests from `not_required` to `unpaid` — no flow rewrites.

### One request shape for featured listings and business applications
Both premium workflows use the identical `createPremiumRequest` object and the same transition helpers in `premiumService.js`. A future admin panel and backend can treat the two queues uniformly (same approve/reject/markPaid logic), and there is no parallel set of status fields to keep in sync. `premiumService` functions are pure (return new objects, no storage/network) so the rules live in one testable place independent of where they are eventually invoked.

### Featured never auto-activates; `featured` boolean is the activation flag
The card/detail "Featured" badge reads the existing `featured` boolean. New listings keep `featured: false` and only record a pending `featuredRequest`; an admin decision (`applyFeaturedDecision`) is the sole thing that flips `featured` to `true` (and only when `isPremiumActive` passes). This preserves all existing badge-rendering code unchanged while preventing self-promotion.

### Services gated on `isApprovedBusiness`, not merely account type
The earlier gate checked `userType === 'business'`. Phase 4.4 tightened it to `isApprovedBusiness` (approved request, payment-settled). A business that has only *applied* (pending) still cannot post Services — matching the rule that premium access follows approval, not intent.

### Sellers cannot be "featured" — only listings can
A "Featured Seller" badge was briefly added but removed. Featuring is a paid/approved *listing* upgrade; a person/business being "featured" has no defined meaning or workflow in this marketplace and would conflate two concepts. `BADGE_TYPE.FEATURED`, the gold badge variant, and the SellerProfilePage usage were all dropped. Sellers earn trust through verification badges (resident/business/email), not promotion. Featuring stays strictly at the listing level (`featured` flag + `featuredRequest`).

### Navbar search removed — single search entry point reaffirmed
The navbar's desktop search (toggle next to favourites + slide-down panel, reintroduced in Phase 3.1) was removed again. Two competing search bars (navbar + hero/page) add clutter without value: the hero search is always above the fold on the homepage and `AllListingsPage`/`CategoryPage` carry their own search/filter UI. This restores the original "single confident search entry point" principle (see *Single search entry point* above). The mobile-menu search was kept — mobile has no always-visible page search, so it remains the one mobile entry point.

### Seller-profile contact reveal is a contained panel, not edge-anchored text
On `SellerProfilePage`, revealing the phone previously dropped raw text + buttons into the card's top-right corner, reading as accidental overflow. It is now a self-contained surface panel (background + border + radius) and the header row (avatar / info / contact) is vertically centred on desktop. This makes the revealed contact read as a deliberate element rather than something pinned to the border. Mobile keeps top-alignment because the info block is tall there and centring the avatar would float it awkwardly mid-card.

---

## 2026-06-16 — Phase 5: Backend Integration (database, auth, accounts, search)

### Self-contained Node + Express + Prisma (SQLite) backend, not a BaaS
A standalone backend in `/server` was chosen over Supabase/Firebase. It runs locally with no external account, keeps full control of the schema and API surface, and isn't a vendor lock-in. Prisma maps 1:1 to the documented tables and switches to Postgres by changing one `provider` line. The frontend talks to it through a thin `apiClient` (`VITE_API_URL`), so the data source is swappable without touching components.

### No database enums — string fields validated in the app layer
SQLite has no native enums, so `account_type`, listing `status`, and `payment_status` are `String` columns with the allowed values centralised in `server/src/lib/constants.js` and enforced by zod validators. This keeps SQLite working today and the values auditable in one place; on Postgres they can be promoted to real enums later without a frontend change.

### Adapter layer bridges backend → existing UI shape (UI never redesigned)
The whole Phase 5 cutover (listings, auth, account pages, search) preserved the premium UI by introducing `listingAdapter` + context mappers (`toProfile`) that translate the lean backend records into the rich shape components already expected (`Rs …` price strings, `timeAgo`, `seller` object, labelled `meta`). Components stayed almost untouched; only data sources moved. This adapter boundary is the single reason the redesign-free constraint held across seven sub-phases.

### Auth is a real JWT; role + ownership enforced at the backend
Login / email-verification issue a JWT (`requireAuth` / `requireRole` / `optionalAuth` middleware). The session evolved deliberately: mock `malir-auth` flag → interim `malir-session` user-id → `malir-token` JWT rehydrated via `GET /auth/me`. Authorisation lives on the server, not just the UI: admin moderation/stats are `requireRole('admin')`, listing create/edit/delete require auth with owner-or-admin ownership checks, and the owner is always derived from the token (never the request body). UI gating remains for UX, but is no longer the security boundary.

### Private listings return 404, not 403
`GET /listings/:id` uses `optionalAuth`; `pending` / `hidden` / `rejected` listings return **404** to anyone who isn't the owner or an admin — deliberately not 403, so the existence of a private listing isn't revealed. `approved` / `sold` stay public, and the public feed already filters to `approved`.

### Category-specific attributes live in one JSON `details` column
Rather than per-category tables or a wide sparse column set across 9 categories, each listing carries a single `details` JSON string (e.g. `{make, model, year}` or `{foodType, deliveryAvailable}`). The adapter parses it and rebuilds labelled `meta` chips from `categoryConfig`, so detail pages render category-specific info with no per-category UI code. Trade-off accepted: `details` isn't SQL-queryable, so attribute filtering/search runs client-side over the approved feed for now. This is the right shape while the catalogue is small and the field sets evolve; a move to indexed columns/JSONB can come with server-side search.

### Business-only categories enforced server-side
Services and Food are `businessOnly`. The UI shows an upgrade modal for personal accounts, but the rule is enforced in `createListing` (`BUSINESS_ONLY_CATEGORIES` → 403 unless the owner is a verified business) so the gate can't be bypassed via the API.

### Saved listings are server-side with optimistic UI and guest-merge
Favourites moved from localStorage to a `saved_listings` join table with `/api/saved` CRUD. `FavoritesContext` keeps the same `useFavorites` interface (so Navbar/cards/drawer/page are unchanged) but is now optimistic with rollback for logged-in users; guests still use localStorage and their favourites are merged into the account on login. This persists across sessions/devices without a UI change.

### Client-side, token-based search over the approved feed; typed adaptive filters
Search stays client-side over the fetched approved listings (no server-side text search yet), but was made genuinely useful: case-insensitive, multi-token (every token must match), and spanning title/description/category/`details`/seller/area. Category filters are typed (`select` / `text` / `range`) and read from `details`; the `range` type (Vehicles Year From/To) is the deliberate pattern for future price/mileage ranges. When the dataset outgrows client filtering, this maps cleanly onto query params.

---

## 2026-06-17 — Phase 5.4: Real Email Verification

### Nodemailer over SMTP — provider-agnostic, env-configured
Email sending uses Nodemailer with an SMTP transport built from environment variables rather than a vendor SDK (SendGrid/Resend). Any provider works by changing `.env` (Mailtrap for dev, Gmail/SES for prod) with no code change and no SDK lock-in. The same boundary that made the backend swappable (env config, thin seam) applies to mail.

### Codes are emailed, never returned to the client
Registration, resend, and password-reset previously returned the code in the API response for parity with the mock UI. That was the development behaviour the task removed: the code now leaves the server only as an email, and the response carries no `verificationCode` / `resetCode`. The frontend dev-hint that displayed the code was deleted. This closes the obvious leak — a code shown on screen (or in a network response) defeats the point of out-of-band verification.

### Graceful console fallback when SMTP is unconfigured
With no SMTP credentials, `sendEmail` logs the message **server-side** and resolves, instead of throwing. This keeps local dev and CI working without secrets while never exposing the code to the client (the log is on the server, not the response). Real credentials switch the same code path to real delivery. The alternative — hard-failing without credentials — would have broken every dev/CI run of the auth flows for no security gain, since the fallback never reaches the user.

### Email change verifies the NEW address before swapping
Changing the account email sends the code to the **new** address and only swaps `user.email` (and sets `emailVerified: true`) once that code is confirmed. This proves the user controls the destination before the account points at it — preventing a typo or a hostile address from capturing the account. The JWT carries only `id` + `role` (not email), so no token reissue is needed on change. The code reuses the existing `EmailVerificationCode` table keyed by the new email, and the `verified` flag makes it single-use.

---

## 2026-06-17 — Phase 5.5: Admin System Completion

### Admin completion was an audit-and-fill, not a rebuild
Most of the admin system already existed (Phase 5.2.4–5.2.5: seed admin, JWT `requireRole('admin')`, `AdminPage`, `adminApi`, `RequireAdmin`). Rather than rebuild against the new spec, the work was a gap analysis: the backend already supported hide/restore/delete and any-status moderation, so the missing pieces were almost entirely **UI exposure** (a status sub-filter, a Featured tab, a user search box) plus two stat counts and a clean query-boolean. This kept the design language, endpoints, and architecture intact and the change surface small.

### No self-promotion is structural, not a check
There is deliberately no "block admin" guard to maintain. Admin can't be reached from user-facing input because the shapes don't allow it: `register` has no `role` field, `updateUserSchema` omits `role`/`accountType`/`businessVerified`, and the `validate` middleware *replaces* the request body with the zod-parsed object — so any injected `role: 'admin'` is dropped before a controller sees it. Admin therefore exists only via the seed or `create-admin.js`. This is safer than a denylist because there is no code path to forget to guard.

### Manual admin creation upserts, never wipes
`create-admin.js` (and `npm run create-admin`) upserts the admin by email instead of going through the seed (which deletes all rows). This lets an admin be created or its password rotated on a live database without destroying data, reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` for production, and generates+prints a strong password when none is given. It satisfies "admin only via seed or manual DB creation" without coupling admin provisioning to a destructive reseed.

### One status endpoint controls moderation AND featured
`PATCH /listings/:id/status` was widened from "status required" to "any subset of `{ status, featuredActive, featuredRequested }`". Approve/reject/hide/restore and featured activate/reject all flow through the same admin-only endpoint, so there's no parallel featured-control surface to secure or keep in sync. Featured stays strictly admin-controlled with no payment gate (activation is an admin decision, mirroring `isPremiumActive`).

### Query booleans are parsed, not coerced
`z.coerce.boolean()` is wrong for URL query flags: `Boolean('false')` is `true`, so `?featured=false` silently meant `true`. Replaced with an explicit `'true' | 'false'` → boolean transform. The Featured tab depends on `featured=false` (requested-but-not-active), and the latent bug also affected the existing `featured` filter — so the fix corrects both.
