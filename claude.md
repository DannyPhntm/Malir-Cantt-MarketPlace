# CLAUDE.md

## Purpose

You are assisting with the development of People of Malir Cantt Bazaar (the community marketplace for Malir Cantt residents; tagline "Buy • Sell • Hire • Discover").

Before making major changes, consider the project's vision and design philosophy documented in PROJECT.md.

---

## Development Rules

* Preserve the existing design language.
* Maintain mobile responsiveness.
* Prefer reusable React components.
* Avoid unnecessary complexity.
* Keep files organized and modular.
* Minimize breaking changes.
* Maintain consistent spacing and styling.

---

## UI Rules

* Prioritize simplicity over adding features.
* Maintain a premium and trustworthy appearance.
* Avoid clutter.
* Keep navigation intuitive.
* Preserve visual consistency across pages.

---

## Coding Style

* Use functional React components.
* Write readable code.
* Add comments only when genuinely helpful.
* Prefer maintainable solutions over clever ones.

---

## Workflow

For major architectural decisions:

1. Explain the proposed approach.
2. Describe affected files.
3. Implement changes incrementally.
4. Avoid redesigning existing sections unless requested.

When uncertain, preserve existing functionality and ask for clarification.

---

## Design System (STRICT)

### Layout
- Use an 8px spacing system (8, 16, 24, 32, 48, 64)
- Always prioritize whitespace over density
- Sections must feel separated and breathable

### Typography
- `--font-display: Manrope` — headings, brand wordmarks, card titles
- `--font-sans: Inter` — body, labels, UI elements
- Strong hierarchy: H1 bold/large/tight, H2 medium bold, body regular/readable
- Never use uniform text sizing

### Colors
- Page background: `--color-surface` (#f6f6f4 — soft off-white)
- Navbar + hero background: `#0d2a1a` (dark forest green)
- Primary accent: `#1a6b45` — CTAs, active states
- Light accent text: `#6ecf94` — text on dark surfaces, listing counts
- Gold values: `#c4a84c` — trust stat numbers
- Text: near-black primary (`--color-ink`), muted secondary (`--color-secondary`)
- No random colors — all values from the established palette

### UI Style
- Rounded corners: 12–16px standard (`--radius-md` / `--radius-lg`)
- Subtle shadows only — no heavy drop shadows
- Clean borders, minimal noise

---

## Stack

- React 19 + Vite 8 (JSX primary, TSX for shadcn components)
- **React Router v7** (BrowserRouter + Routes + Route + Link + NavLink + useParams + useNavigate + useLocation + useSearchParams)
- Framer Motion v12 — `AnimatePresence mode="wait"` for page transitions + nav dropdown; `whileTap` only on cards (`whileHover` banned — conflicts with CSS custom property hover states)
- Tailwind CSS v4 via `@tailwindcss/vite` (no tailwind.config.js)
- CSS custom properties as design token system (`src/index.css`)
- `cn()` via clsx + tailwind-merge in `src/lib/utils.ts`
- `@` path alias → `./src` (ESM: `fileURLToPath(new URL(...))`)

---

## Provider Tree (`src/main.jsx`)

```
<BrowserRouter>
  <AuthProvider>          ← src/context/AuthContext.jsx
    <ListingsProvider>    ← src/context/ListingsContext.jsx
      <FavoritesProvider> ← src/context/FavoritesContext.jsx
        <App />
      </FavoritesProvider>
    </ListingsProvider>
  </AuthProvider>
</BrowserRouter>
```

Order matters — AuthProvider must be outermost so ListingsProvider and AddListingPage can call `useAuth()`.

---

## Routing (`src/App.jsx`)

- Uses `useLocation` + `<AnimatePresence mode="wait" initial={false}>` wrapping `<Routes location={location} key={location.pathname}>` — enables page transition animations on route change
- **`<ScrollToTop />`** rendered before Routes — `useEffect` on `pathname` calls `window.scrollTo({ top:0, behavior:'instant' })`
- **`RequireAuth`** wrapper (defined in `App.jsx`) — gates protected routes; when `!isAuthenticated` it returns `<Navigate to="/login?redirect=<encoded pathname+search>" replace />`. Wraps `/add-listing`, `/dashboard`, `/my-listings`, `/saved-listings`, `/profile`. Both guards wait for `loading` (session rehydration) before deciding.
- **`RequireAdmin`** wrapper (Phase 5.2.4) — like `RequireAuth` but also requires `user.role === 'admin'`; non-admins redirect to `/`. Wraps `/admin`
- **Routes**:
  - `/` → `HomePage`
  - `/category/:slug` → `CategoryPage`
  - `/listing/:id` → `ListingDetailPage`
  - `/add-listing` → `AddListingPage` (**protected** via `RequireAuth` — redirects to `/login?redirect=/add-listing` when unauthenticated)
  - `/edit-listing/:id` → `EditListingPage` (**protected** via `RequireAuth`; the page also checks ownership — owner or admin — and shows an Unauthorized notice otherwise. Saves via `PATCH /listings/:id`; category locked; reuses Add Listing cards + `CategoryFields`)
  - `/login` → `LoginPage` (supports `?register=business` deep link)
  - `/listings` + `/browse` → `AllListingsPage`
  - `/dashboard` → `DashboardPage` (**protected**)
  - `/my-listings` → `MyListingsPage` (**protected**)
  - `/saved-listings` → `SavedListingsPage` (**protected**)
  - `/profile` → `ProfilePage` (**protected**)
  - `/seller/:sellerName` → `SellerProfilePage`
  - `/about` → `AboutPage` (public; marketplace info + real stats strip)
  - `/contact` → `ContactPage` (public; inquiry types + form → `POST /contact`)
  - `/admin` → `AdminPage` (**admin-only** via `RequireAdmin` — needs auth + `user.role === 'admin'`; non-admins redirected to `/`)
  - `*` → `NotFoundPage`

---

## Current UI Architecture

### Navbar (`Navbar.jsx` + `Navbar.css`)
- **Dark green background**: `#0d2a1a`, 72px height
- **Left**: checkpost boom-gate SVG icon + wordmark ("People of Malir Cantt" bold Manrope / "BAZAAR" green Inter)
- **Center**: Browse, Categories (dropdown), Listings, About, Contact — opacity 0.85
- **Right** (left → right order): heart/favourites icon button → "Join / Login" ghost button → "+ Add Listing" green CTA
- **Favourites icon**: `navbar__fav-btn` — 36×36px ghost button, heart SVG fills red when favourites exist; red count badge (`navbar__fav-badge`) top-right corner; clicking opens FavoritesDrawer
- **"Join / Login"** (`navbar__join-btn`): bordered ghost button — `border: 1px solid rgba(255,255,255,0.32)`, `background: rgba(255,255,255,0.06)`, height 36px, hover brightens border to 0.6 + scale(1.02); NOT a plain text link
- **Inner container**: `max-width: 1440px`, `padding: 0 24px`
- Mobile burger collapses all nav + actions into slide-down menu; includes "Saved Listings" row with heart icon + count, then "Join / Login" full-width ghost button, then "+ Add Listing"
- **Categories dropdown** (`navbar__dropdown-wrap`): "Categories" is a `<button>` (`navbar__dropdown-trigger`) with a chevron SVG that rotates 180° when open. `AnimatePresence` shows `navbar__dropdown` — white panel, 272px, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-lg)`, arrow caret via `::before`. Inside: `navbar__dropdown-list` (2-col CSS grid of 8 `<Link>` items) + `navbar__dropdown-footer` ("Browse all listings →"). Animation: `opacity/y: -8/scale: 0.97 → 1` at 180ms `[0.22,1,0.36,1]` ease. Closes on outside `mousedown`, Escape key, or any item click. `dropdownOpen` state + `dropdownRef` for outside-click detection.
- **Mobile categories sub-list**: "Categories" in mobile menu is a `navbar__mobile-cat-toggle` button; clicking toggles `mobileCatsOpen` and reveals `navbar__mobile-cats` — indented list of 8 category links; animated with height `0 → auto` + opacity over 200ms.

### Hero (`src/components/ui/pulse-fit-hero.tsx`)
- Real photo background: `public/malir-cantt-gate.png` — Malir Cantonment Gate No. 1
- Overlay: `linear-gradient(160deg, rgba(7,30,17,0.92) ... rgba(26,107,69,0.52))`
- `backgroundImage` prop controls photo — when omitted falls back to CSS gradient only
- `showHeader={false}` suppresses the built-in nav (external Navbar is used instead)
- Title: `"Find Everything"` / titleAccent: `"Inside Malir Cantt."` (gradient shimmer text)
- Search bar: pill shape, white glass fill, green Search button
- **Recent searches**: shown below search bar when user has searched before; persisted in `localStorage` under key `malir-recent-searches`; max 5 entries; green-tinted chips with clock icon + × to remove
- **Popular tags**: use `.hero-tag` CSS class (not inline styles) — higher contrast `rgba(255,255,255,0.92)`, hover lifts + brightens border
- **Trust stats**: gold `#fbbf24` values — `value` rendered in gold bold, `label` in muted white after it; current stats: `482+ Active Listings`, `6 Categories`, `Updated Daily`, `Verified Residents`; each has a small green SVG icon; `icon?: React.ReactNode` field on TrustStat interface; icons passed from App.jsx
- **Category carousel**: infinite CSS scroll (`carousel-track` class) — pauses on hover; `CategoryCard` interface has `count?: string` field — rendered as `.carousel-card__count` below the title (muted white, 11px); counts passed from App.jsx (e.g. "1,250 active listings")
- Carousel cards: rendered as `<a href>` tags, 380×260px landscape; CSS handles hover lift; `whileTap` for press feedback
- Carousel fade edges: dark rgba(7,30,17,0.95) → transparent
- Framer `whileHover` is NOT used on cards (conflicts with CSS custom property hover states)
- **Current carousel categories (8 total)** — image source in parentheses:
  1. Vehicles — `/categories/vehicles.png` (local)
  2. Technology — `/categories/technology.png` (local)
  3. Property — `/categories/property.png` (local)
  4. Furniture — `/categories/furniture.png` (local)
  5. Jobs — `/categories/jobs.png` (local)
  6. Services — Unsplash `photo-1581578731548`
  7. Gym & Fitness — Unsplash `photo-1534438327276`
  8. Shoes & Footwear — Unsplash `photo-1542291026`
- Local category images live in `public/categories/` — served at `/categories/<name>.png`
- When adding new categories: user-supplied images go to `public/categories/`, fallback to Unsplash with `?w=400&h=300&fit=crop`

---

## Data Layer

### `src/data/listings.js`
- **32 listings** total across 8 categories (4–5 per category)
- `export const ALL_LISTINGS` — primary export used everywhere
- `export const FEATURED_LISTINGS = ALL_LISTINGS` — backward compat alias; `FeaturedListings.jsx` filters by `l.featured === true`
- `featured: true` on ids 1–4 (one per category: Vehicles, Technology, Property, Furniture)
- `featured: false` on all others
- Category slugs (9): `vehicles`, `technology`, `property`, `furniture`, `jobs`, `services`, `gym`, `shoes`, `food` (Phase 5.3)
- **Listing shape**:
  ```js
  {
    id, title, price, priceRaw, category, categorySlug,
    location, timeAgo, image, images?: string[],
    featured, featuredRequest?, condition?, description,
    meta?: [{ label, value }],   // category-specific fields stored at submit time
    seller: { name, phone, memberSince, isVerified?, badgeType?, area? },
    views
  }
  // featured: boolean activation flag (badge). featuredRequest: premium request
  // object (createPremiumRequest) for user-submitted featured listings, else null
  ```
- `meta` field stores category-specific answers (e.g. mileage, bedrooms, salary range) as `[{label, value}]` — populated at listing submission from `categoryConfig.js` fields
- **Verified featured sellers** (mock data):
  - id:1 Ahmed Khan → `isVerified: true, badgeType: 'resident'`
  - id:2 Sara Malik → `isVerified: true, badgeType: 'resident'`
  - id:3 Usman Property → `isVerified: true, badgeType: 'business'`
  - id:4 Fatima Interiors → `isVerified: true, badgeType: 'business'`

### `src/data/categoryConfig.js`
Single source of truth for all **9** category form configurations (Phase 5.3 added `food`). Entries may carry `businessOnly: true` (Services, Food) — AddListingPage gates these to approved business accounts via the BusinessRequiredModal. Submitted field values are sent as a `details` object → persisted as the listing's `details` JSON (backend) → re-expanded into labelled `meta` chips by `listingAdapter`. Each entry:
```js
{
  label,            // display name, e.g. "Vehicles"
  titlePlaceholder, // input placeholder for title field
  priceLabel,       // e.g. "Asking Price", "Monthly Salary", "Service Rate"
  pricePlaceholder,
  images: { required: bool, min: 0|1, max: 1|10, label: string|null },
  fields: [
    { name, label, type, required, placeholder, options?, col }
    // col:1 = half-width, col:2 = full-width in 2-col grid
  ]
}
```
- Jobs: `images: { required: false, min: 0, max: 10 }` — company logo/hiring images optional (Phase 5.2.3: raised from max 1)
- Services: `images: { required: false, min: 0, max: 10 }` — portfolio shots optional
- All other categories: `images: { required: true, min: 1, max: 10 }`

### `src/data/premiumConfig.js` (Phase 4.4)
Single source of truth for monetisation / verification / admin-approval constants. No payment gateway — mock only.
- **Status enums**: `APPLICATION_STATUS` (`none`/`pending`/`approved`/`rejected`), `FEATURED_STATUS` (alias), `PAYMENT_STATUS` (`not_required`/`unpaid`/`paid`), `STATUS_LABELS`
- **Enums**: `ACCOUNT_TYPE`, `LISTING_TIER` (`standard`/`featured`), `BADGE_TYPE` (`email`/`resident`/`business`/`featured`), `PREMIUM_TYPE` (`featured_listing`/`business_account`)
- **Copy**: `BUSINESS_BENEFITS`, `FEATURED_BENEFITS`
- **Payment hooks** (placeholders, `enabled: false`, `amount: 0`): `PRICING` + `getFee(key)`
- **`createPremiumRequest({ type, fee })`** — shared request shape `{ type, approvalStatus, paymentStatus, feeId, requestedAt, reviewedAt }` used for BOTH featured requests and business applications
- **Sponsored placeholders**: `SPONSORED_SHAPE`, `SPONSORED_PLACEMENTS` (empty; no UI yet)

---

## Services (`src/services/`)

- **`apiClient.js`** (Phase 5.2.1) — `fetch` wrapper around the backend; base URL from `VITE_API_URL` (default `http://localhost:4000/api`). Throws `ApiError` (`{ message, status, fields }`) on non-2xx; friendly message on network failure. Owns the JWT: `setAuthToken`/`clearAuthToken`/`getAuthToken` (localStorage `malir-token`); attaches `Authorization: Bearer` automatically (Phase 5.2.4)
- **`authApi.js`** (Phase 5.2.1) — auth/user endpoints: `register`, `verifyEmail`, `resendVerification`, `login`, `requestPasswordReset`, `resetPassword`, `getUser`, `updateUser`. Consumed by `AuthContext`
- **`listingsApi.js`** (Phase 5.2.2, +5.2.5, +5.6) — `list(filters)` / `get(id)` / `create(payload)` / `mine()` / `update(id, changes)` / `remove(id)`. `update` (PATCH) now also carries `details`, the full `images` set (add/remove/reorder), and `status` (incl. resubmit). Consumed by `ListingsContext`, `MyListingsPage`, `EditListingPage`, and `ListingDetailPage` owner controls
- **`savedApi.js`** (Phase 5.2.5) — `list()` / `add(listingId)` / `remove(listingId)` (all auth). Consumed by `FavoritesContext`
- **`adminApi.js`** (Phase 5.2.4, +5.5) — moderation + dashboard: `getStats()`, `listUsers(search?)`, `listListings(status)`, `listFeaturedRequests()`, `setListingStatus(id, body)`, `deleteListing(id)`, `listBusinessAccounts(approved?)`, `decideBusiness(id, body)`. Consumed by `AdminPage`. Enforced server-side via JWT + `requireRole('admin')`.
- **`statsApi.js`** (Phase 5.7) — `getPublicStats()` → `GET /stats/public` (no auth). Consumed via `hooks/usePublicStats.js` by HomePage, AboutPage, and Footer.
- **`contactApi.js`** (Phase 5.7) — `send(payload)` → `POST /contact` (public; persisted to `ContactMessage`). Consumed by `ContactPage`.
- **`listingAdapter.js`** (Phase 5.2.2) — `adaptListing` / `adaptListings`: backend listing → legacy UI shape (see ListingsContext)
- **`emailService.js`** — legacy mock email sender (no longer used by LoginPage after Phase 5.2.1; superseded by the backend)
- **`recentlyViewedService.js`** (Phase 4.3) — `getRecentlyViewed()` / `addRecentlyViewed(listing)` / `clearRecentlyViewed()`; localStorage `malir-recently-viewed`; dedupe + move-to-front; cap 20
- **`premiumService.js`** (Phase 4.4) — pure, admin-ready state transitions on premium requests: `approveRequest`, `rejectRequest`, `markPaid`, `isPremiumActive` (approved **and** payment-settled), `applyFeaturedDecision(listing, decision)`, `applyBusinessDecision(request, decision)`. No storage/network — the single place transition rules live for a future admin panel / backend

---

## Contexts

### AuthContext (`src/context/AuthContext.jsx`)
- `AuthProvider` sits at the top of the provider tree
- **API-backed auth** (Phase 5.2.1): talks to the `/server` backend via `src/services/authApi.js`. No more mock profile / `malir-auth` flag.
- Exports `useAuth()` → `{ isAuthenticated, loading, user, login, register, verifyEmail, resendVerification, requestPasswordReset, resetPassword, logout, updateProfile, applyForBusiness, profile, userType, businessRequest, businessStatus, isApprovedBusiness }`
- **Auth actions** (async, throw `ApiError` for the UI to display): `login(email, password)`, `register(payload)` → `{ user, verificationCode }`, `verifyEmail(email, code)` (auto-signs-in), `resendVerification(email)`, `requestPasswordReset(email)`, `resetPassword(email, code, password)`, `logout()`
- **Session persistence** (Phase 5.2.4 — JWT): login/verify-email return a **JWT** which `apiClient` stores in `localStorage` (`malir-token`) and attaches as `Authorization: Bearer` on every request. On mount the session rehydrates via `GET /auth/me` (`loading` true until done); a 4xx clears the token, a network error keeps it for retry. `logout()` clears the token. `isAuthenticated` = `!!user`.
- **`profile`** is derived from the API `user` (`toProfile()`) into the legacy shape (`{ name, email, phone, area, canttPass, joinDate, isVerified, emailVerified, badgeType, businessName, businessRequest }`) so ProfilePage / DashboardPage / AddListingPage need no changes. When logged out, `profile` is a blank object (no crash). `userType` = `user.accountType || 'personal'`.
- **`updateProfile(changes)`** maps profile-shaped edits → API user fields and `PATCH`es `/users/:id`. `isApprovedBusiness` = `user.businessVerified`; `businessStatus`/`businessRequest` derive from `user.businessAccount`.
- Used by `RequireAuth` to gate `/add-listing`; `LoginPage` forms call these actions and redirect to `?redirect=…` on success. Navbar shows a **Logout** button (reusing `navbar__join-btn` styling) when authenticated.
- `profile`: `{ name, email, phone, area, joinDate, isVerified, emailVerified, badgeType, businessName, businessRequest }` — persisted to `localStorage` (`malir-profile`) via `updateProfile`
- **Business application** (Phase 4.4): `applyForBusiness({ businessName })` stores a structured `businessRequest` (via `createPremiumRequest`, starts `pending`); `businessStatus` = its `approvalStatus`; `isApprovedBusiness` = `isPremiumActive(businessRequest)` (approved **and** payment-settled). Never auto-approved
- Current mock: resident account, no business application. To preview an approved business, set `businessRequest: { approvalStatus: 'approved', paymentStatus: 'not_required' }` + `businessName` in `DEFAULT_PROFILE`

### ListingsContext (`src/context/ListingsContext.jsx`)
- **API-backed** (Phase 5.2.2): reads listings from the `/server` backend via `src/services/listingsApi.js`; no more mock `ALL_LISTINGS` / `malir-user-listings`.
- `ListingsProvider` wraps app inside AuthProvider (uses `useAuth()` for the poster's `user.id`)
- Exports `useListings()` → `{ allListings, loading, error, refresh, getListing, addListing }`
- **`allListings`**: **approved** listings only (`GET /listings?status=approved`), fetched on mount and adapted via `listingAdapter.adaptListing` into the legacy shape every component already expects. `loading`/`error` drive the page loading/error states; `refresh()` re-fetches.
- **`getListing(id)`**: `GET /listings/:id` (any status) → adapted listing. Used by `ListingDetailPage` so an owner can view their own just-posted (pending) listing.
- **`addListing(data)`**: `POST /listings` with `{ userId, title, description, category: categorySlug, price: priceRaw, featuredRequested, images:[{imageUrl,displayOrder}] }`; **async** — returns the adapted created listing (`status: 'pending'`, never auto-featured). Base64 data-URL images are accepted by the backend. `AddListingPage` now `await`s it.
- **Adapter** (`src/services/listingAdapter.js`): maps backend → UI shape — slug→display `category`, int→`Rs …` price string (+`priceRaw`), `createdAt`→`timeAgo`, `featuredActive`→`featured`, `images[]`→`image`/`images`, and a `seller` object from the listing's `user`. Phase 5.3: parses the `details` JSON into a `details` object **and** builds the labelled `meta` array from it (via `CATEGORY_CONFIG` labels/order) so detail-page chips show category-specific info. Phase 5.6: exposes `userId` (listing owner) for ownership checks. `views` is `0` (not tracked yet).

### FavoritesContext (`src/context/FavoritesContext.jsx`)
- Exports `useFavorites()` → `{ favorites, toggle, isFavorited, isOpen, setIsOpen, loading }`
- **Backend-backed when authenticated** (Phase 5.2.5): on login it fetches `GET /saved` (via `savedApi`); `toggle(listing)` is **optimistic** (`POST`/`DELETE /saved`, rolls back on failure). Guests fall back to `localStorage` (`malir-favorites`); on login any guest favourites are merged into the account, then the server list becomes the source of truth.
- `favorites` holds full (adapted) listing objects so cards render without extra fetches
- Provider sits inside `AuthProvider` (uses `useAuth`); any component calling `useFavorites` must be inside `FavoritesProvider`

---

## Components

### ListingCard (`ListingCard.jsx` + `ListingCard.css`)
- Heart save button: top-right of image, 32×32px circular white button
- **Favourited state** (`listing-card__save--liked`): button background `#fff1f1`, heart fills red (`var(--color-danger)`)
- **Heart pop animation**: `.heart-pop` CSS class for 600ms — `@keyframes heartPop` scales 1 → 1.5 → 0.85 → 1.12 → 1
- Clicking the card calls `addRecentlyViewed(listing)` from `services/recentlyViewedService.js` (dedupe + move-to-front, cap 20)
- **Image-optional fallback** (Phase 4.4.5): when `!listing.image` and `categorySlug` is `jobs` or `services` (`OPTIONAL_IMAGE_CATEGORIES`), renders `ListingPlaceholder` (a branded gradient panel — tagline + icon tile + type pill from `condition`/`serviceType`) instead of `<img>`. Panel is `position:absolute; inset:0` inside the same 4:3 `.listing-card__image-wrap`, so heights/grid/hover/badge stay identical. Required-image categories keep the `<img>` behaviour
- **Footer row** (`.listing-card__footer`): flex row, `justify-content: space-between` — left: `listing-card__time`, right: `<VerifiedBadge size="sm">` when `listing.seller?.isVerified` is true

### VerifiedBadge (`VerifiedBadge.jsx` + `VerifiedBadge.css`)
- Reusable badge component, **3 kinds** (driven by `BADGE_TYPE` in `premiumConfig.js`):
  - `type="email"` → mail icon + "Email Verified"
  - `type="resident"` → checkmark icon + "Verified Resident" — personal accounts with Cantt pass
  - `type="business"` → shield icon + "Verified Business" — approved business accounts
- Optional `label` prop overrides the default text
- Note: there is no "Featured Seller" badge — only listings can be featured, not sellers
- Two sizes: `size="sm"` (10px, for cards), `size="md"` (12px, for detail/profile)
- Default styling: green tinted (`rgba(26,107,69,0.09)` bg, `color: #1a6b45`), pill shape (`--radius-full`); featured variant uses gold (`#8a6d1f` text / `rgba(196,168,76,…)`)
- Used in: `ListingCard.jsx` (sm), `ListingDetailPage.jsx` (md), `SellerProfilePage.jsx` (md)

### RelatedListings (`RelatedListings.jsx` + `RelatedListings.css`)
- Reusable "You May Also Like" section — Phase 4.3
- Props: `{ listing, listings, title = 'You May Also Like' }`
- Filters `listings` to the **same category** (`categorySlug` match, excludes self), shows up to 4 via `ListingCard` with stagger-in animation; renders nothing when there are no matches
- Used in `ListingDetailPage.jsx` (replaced the old inline "More in {category}" block)

### BusinessBenefitsCard (`BusinessBenefitsCard.jsx` + `BusinessBenefitsCard.css`)
- Reusable premium info card — Phase 4.4; lists business-account benefits (defaults to `BUSINESS_BENEFITS` from `premiumConfig.js`)
- Props: `{ title, benefits, note }`; green-tinted card, check-icon bullets
- Used in `LoginPage.jsx` BusinessForm (above the form)

### FeaturedListingOption (`FeaturedListingOption.jsx` + `FeaturedListingOption.css`)
- Reusable Standard vs Featured chooser — Phase 4.4
- Props: `{ value, onChange, benefits }`; `value` is a `LISTING_TIER` (`'standard'` | `'featured'`)
- Two radio cards; selecting Featured reveals a gold-accented benefits list + a "Pending Approval" notice (`AnimatePresence` height reveal)
- Used in `AddListingPage.jsx` (Listing Visibility card)

### CategoryFields (`CategoryFields.jsx` + `CategoryFields.css`)
- Reusable component that renders category-specific form fields from `CATEGORY_CONFIG`
- Props: `{ config, values, errors, onChange }`
- Renders a `motion.div` card with `AnimatePresence`-friendly enter/exit — key changes on category switch for smooth swap
- Field grid: 2-col CSS grid; `col:2` fields span full width via `.catfields__full`
- Supports `type: 'select'` (with custom chevron) and text/number inputs
- Error display per field: `form-error` paragraph with `role="alert"`

### BusinessRequiredModal (`BusinessRequiredModal.jsx` + `BusinessRequiredModal.css`)
- Portal via `createPortal(content, document.body)` — renders outside normal DOM tree
- Appears when a personal-account user selects "Services" category in AddListingPage
- Body scroll lock + Escape key handling via `useEffect`
- Centering: `style={{ x: '-50%', y: '-50%' }}` on `motion.div` (Framer manages all transforms — avoids CSS `transform` conflict)
- z-index: 800 (backdrop), 801 (modal)
- Dark green `#0d2a1a` top band with building icon
- Copy (Phase 4.4): "This category is reserved for verified business accounts. Apply for Business verification to access this category."
- Buttons: "Apply for Business Account" → `navigate('/login?register=business')`; "Choose Another Category" → `onDismiss` (resets category to `''`)
- Animations: backdrop opacity 0→1; modal `scale: 0.95→1 + opacity`

### FavoritesDrawer (`FavoritesDrawer.jsx` + `FavoritesDrawer.css`)
- Slide-in panel from the right (Framer Motion `x: '100%' → 0`), blurred dark overlay behind it
- Width 420px desktop, 100vw mobile
- Header: red heart icon + "Saved Listings" title + green count pill + close (×) button
- Body: 2-column `ListingCard` grid; empty state shows centred heart icon with hint text
- Opened by clicking the navbar heart icon or mobile "Saved Listings" row

### FeaturedListings (`FeaturedListings.jsx`)
- **Backend-driven** (Phase 5.2.2): reads `allListings` (approved) from `useListings()`; orders **featured ads first, then standard** (newest within each group), capped at 8. Shows `<LoadingState>` while fetching and an empty state with a "+ Post a Listing" CTA when there are none.

### RecentlyAdded (`RecentlyAdded.jsx`) — Phase 5.7
- Latest approved listings (newest first by `createdAt`, max 8) from `useListings()`. **Reuses `FeaturedListings.css`** classes + `ListingCard` so it matches the homepage exactly. Returns `null` when there are no approved listings.

### Footer (`Footer.jsx` + `.css`) — Phase 5.7
- Site-wide footer rendered in `App.jsx` (after `<Routes>`, outside `AnimatePresence`). Dark green (`#0d2a1a`); brand blurb + link columns (Marketplace / Company [**About**, **Contact**] / Account), a **real** trust-signal strip (`usePublicStats`: active listings · verified businesses · categories · "Local community marketplace"), and a safety disclaimer. No fabricated numbers.

### LoadingState (`LoadingState.jsx` + `.css`)
- Reusable centered spinner + label (Phase 5.2.2). Used by FeaturedListings, CategoryPage, AllListingsPage, ListingDetailPage, SellerProfilePage while backend data is in flight. Respects `prefers-reduced-motion`.

### RecentlyViewed (`RecentlyViewed.jsx` + `RecentlyViewed.css`)
- Reads via `getRecentlyViewed()` from `services/recentlyViewedService.js` on mount; renders nothing if empty
- Shows up to 8 items in a 4-column grid (service stores up to 20)
- "Clear" button calls `clearRecentlyViewed()` and sets state to `[]`
- Section appears below FeaturedListings; only visible after user has clicked on listings

### Animation System (`src/animations.js`)
- Central export: `ease`, `dur`, `viewport`, `fadeUp`, `staggerContainer`, `staggerItem`, `navMenu`, `tap`
- `ScrollReveal.jsx` — reusable scroll-triggered fade-up wrapper
- CSS carousel uses `animation-play-state: paused` on hover — NOT Framer (avoids jump-to-zero bug)
- Only `whileTap` is safe on cards; `whileHover` banned
- `.hero-tag` / `.hero-tag--recent` CSS classes in `index.css` — do NOT use inline styles

---

## Pages

### HomePage (`HomePage.jsx`)
- Wraps in `<PageTransition>`, uses `useNavigate` for hero search → `/listings?q=…`
- Contains `<PulseFitHero>` + `<FeaturedListings>` + `<RecentlyAdded>` + `<RecentlyViewed>`
- **Dynamic stats** (Phase 5.7): `usePublicStats()` (→ `GET /stats/public`) feeds the hero trust stats (Active Listings / Registered Users / Verified Businesses / Categories) and the category carousel counts (real per-category approved counts). No hardcoded numbers; values show `—` until loaded. `CATEGORY_CARDS` is the static image/title/href config (9 categories incl. food)

### AboutPage (`AboutPage.jsx` + `.css`) — Phase 5.7
- Public. Dark-green hero (`#0d2a1a`) + real-stats strip (`usePublicStats`) + intro + feature grid (safe trade / resident-focused / business opportunities / verified business / home businesses / featured) + future-vision block with CTAs

### ContactPage (`ContactPage.jsx` + `.css`) — Phase 5.7
- Public. Inquiry types (general/business/featured/bug/scam/suggestion), email + WhatsApp placeholders, response expectations, and a form (Name/Email/Subject/Message + reason). Submits via `contactApi.send` → `POST /contact` (validated + persisted to `ContactMessage`; field errors mapped back to inputs); success state with "send another"

### CategoryPage (`CategoryPage.jsx` + `CategoryPage.css`)
- Dark green hero band with category name + listing count pill
- `CATEGORY_META` object maps slug → `{name, description}`
- Sort state: newest / price_asc / price_desc / popular
- Stagger grid animation; empty state with "Post a Listing" CTA; breadcrumb

### ListingDetailPage (`ListingDetailPage.jsx` + `ListingDetailPage.css`)
- Uses `useListings()` (not `ALL_LISTINGS` directly) — picks up user-submitted listings too
- Two-column layout (`1fr 340px`); image `aspect-ratio: 16/9`
- Price prominent (`clamp(1.9rem,4vw,2.5rem)` weight 900 green)
- Dedicated `.detail__location-row` with map pin icon above chips
- **Jobs/Services layout** (`isServiceListing = categorySlug === 'jobs' || 'services'`):
  - No image gallery rendered
  - Single-column centered layout (`.detail__inner--service` → `max-width: 780px`)
  - Horizontal seller card (`.detail__sidebar--service`) — grid layout: avatar | name+since | contact button
  - No Condition chip; "Posted X ago" shown as inline `.detail__service-meta` row
  - Mobile: horizontal seller card collapses back to vertical
- **Chips**: if listing has `meta` array → renders meta key/value chips + Posted chip; else renders Condition + Posted chips (no Condition chip for service listings)
- **Seller contact card** (`.detail__seller-card`) — Phase 4.1:
  - Header: avatar (first-letter initials), seller name, account-type pill (`.detail__seller-type`, gold-ish `--business` variant for business), `<VerifiedBadge size="md">` when verified
  - Meta rows (`.detail__seller-meta`): area (pin icon, `seller.area` → falls back to `listing.location`), member since (calendar icon); "View Profile →" link
  - **Two primary contact actions** (`.detail__contact-actions`):
    - **WhatsApp Seller** (`.detail__contact-btn--whatsapp`, brand green `#25d366`) → opens `wa.me` in new tab with pre-filled "Is this still available?" message; `toWhatsAppNumber()` maps `03XX-XXXXXXX` → `92XXXXXXXXXX`
    - **Call Seller** (primary green) → reveals number + Call (`tel:`) + Copy (clipboard, "Copied!" for 2s) — existing privacy-gate preserved
  - **Owner vs public actions** (Phase 5.6): `isOwner = user.id === listing.userId`. **Owner only** sees a manage panel (`.detail__owner-actions`) — Edit Listing (→ `/edit-listing/:id`), Mark as Sold, Archive (→ hidden) / status-aware Restore/Mark Available, Delete (confirm), + a status chip — via `listingsApi.update`/`remove`. **Public/non-owner** sees WhatsApp + Call + a **Save Listing** button (`useFavorites`). Admin moderation stays in the Admin Dashboard (no admin buttons here; an admin viewing another's listing sees the public view).
- Description card has green left border + 17px/1.75 line-height
- Safety tip at bottom of seller card
- Lightbox (portal) for full-size image viewing; thumbnail strip when multiple images
- **`<RelatedListings>`** at bottom — reusable "You May Also Like" component (same-category only); see Components

### AddListingPage (`AddListingPage.jsx` + `AddListingPage.css`)
- **Category-first dynamic form** — category selected first, form body animates in below
- **Form structure**:
  1. Card: Category select (always visible)
  2. `AnimatePresence` → form body (key="form-body") when category selected:
     - Card: Photos (config-driven: max, required, label — hidden for Jobs category if `images.max === 0` or configured optional)
     - `AnimatePresence mode="wait"` → `<CategoryFields>` (key={form.category}) — swaps with animation on category change
     - Card: Listing Details (title, price [label from config], description)
     - Card: Contact (name, phone, location — all pre-filled from `profile`, all editable)
     - Submit button
- **Images**: up to 10; drag-remove; compressed to base64 via canvas; `URL.createObjectURL` for preview; photo grid `.form-photo-grid`
- **Image validation**: required for all categories except Jobs (optional max 1) and Services (optional max 10)
- **Services restriction** (Phase 4.4): selecting "Services" without `isApprovedBusiness` shows `<BusinessRequiredModal>` and resets category on dismiss
- **Listing Visibility card** (Phase 4.4): `<FeaturedListingOption>` (Standard/Featured) before Submit; `listingTier` state → submit passes `featuredRequested: listingTier === 'featured'`. Featured never auto-activates
- **Profile autofill**: Contact fields pre-filled from `profile?.name/phone/area`; green info pill (`.form-profile-hint`) shown when profile exists
- **Validation**: merges `errors` (main form) + `catErrors` (category fields) before submit; focuses first invalid field. Image rule (client + backend): **1–10** images for all categories except **Jobs/Services** which are **0–10** (`categoryConfig.images`)
- **Draft persistence** (Phase 5.2.3): form text + `categoryFields` + `listingTier` are saved to `localStorage` (`malir-listing-draft`) on every change and restored on mount; the category-reset effect skips its first run so a restored draft survives. Images are **not** drafted (file objects can't be serialised). Draft is cleared on successful submit.
- **Category change cleanup**: `useEffect` on `form.category` clears `categoryFields`, `catErrors`, `imageFiles`, `imagePreviews` (skips first render via `skipCategoryReset` ref)
- **On submit** (Phase 5.2.3): `await addListing()` → `POST /listings` (status `pending`). On success it clears the draft and shows an in-page **success confirmation** (`.add-listing__success*`) — "pending approval" message with **View Listing** + **Post Another** — instead of navigating away. `handlePostAnother` resets the form for a fresh entry. Submit failures show an inline `errors.submit` message.

### LoginPage (`LoginPage.jsx` + `LoginPage.css`)
- **Deep link** (Phase 4.4): `?register=business` opens the Create Account tab with the Business form pre-selected (`RegisterPanel initialType`); used by `BusinessRequiredModal`
- **Business signup** (Phase 4.4): `BusinessForm` shows `<BusinessBenefitsCard>` above the form; on email-verify success calls `applyForBusiness({ businessName })` and renders `BusinessPendingSuccess` ("Pending Approval" pill)
- **Two tabs**: Sign In | Create Account — `AnimatePresence mode="wait"` transitions between
- **Sign In**: email + password fields, mock submission
- **Create Account** — two-step flow via `RegisterPanel`:
  - **Step 1**: `AccountTypePicker` — visual grid of two cards: "Personal Account" and "Business Account"
  - **Step 2**: `PersonalForm` or `BusinessForm` based on picked type, with `← Change account type` back link
  - `STEP_VARIANTS`: `{ initial: {opacity:0, y:8}, enter: {opacity:1, y:0, duration:0.2}, exit: {opacity:0, y:-4, duration:0.12} }`
- **PersonalForm fields**: Full Name, Phone, Password (show/hide toggle), Area of Residence, Cantt Pass Number (optional — green hint box explains it unlocks "Verified Resident" badge)
- **BusinessForm fields**: Business Name, Owner Name + Phone (2-col), Password, Category select + Area (2-col), Business Verification (optional)
- Shared `PasswordField` component with show/hide toggle
- `MockSuccess` component shown after either form submits successfully
- Account type cards: `.acct-type-card` — border hover → green, lift transform; `.reg-type-badge` green pill with icon; `.reg-back-btn` back link

### AllListingsPage (`AllListingsPage.jsx`)
- Imports `CategoryPage.css` (reuses `.cat-*` classes); search box **autofocuses** on mount; Enter submits (form)
- `useSearchParams` for `?q=`; **search (Phase 5.3)** is case-insensitive + multi-token (every token must appear) across title / description / category / `details` values / seller / area
- Category filter + sort + collapsible advanced filters. **`CAT_FILTER_CONFIG`** entries are typed: `select` (exact), `text` (contains), `range` (numeric From/To — Vehicles **Year From/To**; the pattern for future price/mileage). Filters match against the listing's `details` (with legacy direct-prop fallback). Active-filter chips handle ranges
- Reads approved listings from `useListings()` (backend)

### Account & profile pages (Phase 2.x / 3.4)
- **DashboardPage** (`/dashboard`) — **protected**; card grid + real-data **Overview** (Phase 5.2.5): fetches `GET /listings/mine`, shows account-status chips (account type / email verified / business status) and a 7-tile stat grid (Active/Pending/Sold/Hidden/Rejected/Featured/Featured-Pending) via `lib/listingStats.computeListingStats`; loading + error/retry states
- **MyListingsPage** (`/my-listings`) — **protected** (RequireAuth); API-backed (Phase 5.2.5). Loads the owner's listings via `GET /listings/mine` (`listingsApi.mine()` → `adaptListing`). Per-listing lifecycle: **Mark Sold** / **Hide** → `PATCH /listings/:id { status }`; **Re-activate / Make Active** → `status: 'approved'`; **Delete** → `DELETE /listings/:id`; **Edit** links to `/edit-listing/:id`. Optimistic updates (revert on failure), loading/error states. Status badges map backend → UI: `approved`→Active, plus Pending/Rejected/Sold/Hidden. Filters All/Active/Sold/Hidden (Active = approved); pending/rejected appear under All only
- **SavedListingsPage** (`/saved-listings`) — **protected**; live `FavoritesContext` data (backend-backed, Phase 5.2.5); `LoadingState` while fetching; `AnimatePresence popLayout` removal
- **ProfilePage** (`/profile`) — **protected**; loads all fields from the API `profile`. Editable: **name / phone / resident location** (+ cantt pass) → `updateProfile` → `PATCH /users/:id`, with async save (success banner + inline error). **Email and verification fields are read-only** (email chip reflects `emailVerified`). Account type / business / email verification can't be changed here
- **SellerProfilePage** (`/seller/:sellerName`) — public seller profile derived from `allListings` filtered by `seller.name`; avatar initials, account-type/area/member-since pills, `VerifiedBadge` (md); evenly-distributed stats (Total/Active/Sold); contact card with phone reveal; seller's listings grid
- **AdminPage** (`/admin`) — admin-only dashboard (Phases 5.2.4–5.2.5, completed 5.5). **Statistics** cards — all 10 live metrics from `GET /stats` (users; listings total/pending/approved/rejected/sold/hidden/featured/featuredPending; business pending) + four tabs:
  - **Listings**: status sub-filter (Pending / Approved / Hidden) with contextual actions — Approve / Feature / Reject (pending), Hide / Delete (approved), Restore / Delete (hidden). Delete is `window.confirm`-gated. All via `PATCH /listings/:id/status` (now accepts any subset of `{status, featuredActive, featuredRequested}`) + `DELETE /listings/:id`.
  - **Featured**: featured requests (`featuredRequested && !featuredActive`, via `GET /listings?featuredRequested=true&featured=false`) → Activate (`featuredActive:true`) / Reject (`featuredRequested:false`). No payment — admin-controlled.
  - **Business**: pending applications → Approve / Reject (`PATCH /business-accounts/:id/decision`; approval auto-flips the owner's `businessVerified`).
  - **Users**: list with search (`GET /users?search=` name/email) showing role / account-type / verification tags and **listing count** (`_count.listings`). No banning / deleting (out of scope).
  Optimistic row removal + flash; **stat cards re-fetch after each action**; the listing list re-fetches on status-filter change; loading/empty/error states. Admin nav link appears only when `user.role === 'admin'`.
  - **Admin accounts**: created ONLY via the seed or `server/scripts/create-admin.js` (`npm run create-admin` — idempotent upsert by email, no data wipe; `ADMIN_EMAIL`/`ADMIN_PASSWORD` env or generated strong password, printed). No public registration path can set `role` (register has no role field; `updateUserSchema` omits role/accountType/businessVerified; `validate` strips unknown body keys). Dev seed login: `admin@malircantt.pk` / `admin123` (override via `ADMIN_PASSWORD`).

### NotFoundPage (`NotFoundPage.jsx`)
- Minimal inline styles, large "404", back to home Link

### PageTransition (`PageTransition.jsx`)
- `motion.div` wrapper — `initial: {opacity:0, y:10}` → `enter: {opacity:1, y:0, duration:0.26}` → `exit: {opacity:0, y:-6, duration:0.16}`

---

## localStorage Keys

| Key | Contents | Max entries |
|-----|----------|-------------|
| `malir-favorites` | **Guest** saved listings only (merged into the account on login; authed users persist server-side) | Unbounded |
| `malir-listing-draft` | Add-listing draft (text + category fields + tier; no images) | 1 object |
| `malir-recently-viewed` | Listings clicked by user | 20 |
| `malir-recent-searches` | Search strings from hero search bar | 5 |
| `malir-token` | JWT for the authenticated session (re-fetched via `/auth/me` on load) | 1 value |

> Phase 5.2.1 removed the mock `malir-auth` flag and `malir-profile` object; Phase 5.2.4 replaced the `malir-session` user-id with a real `malir-token` JWT.

---

## Key Architecture Decisions

- **`whileHover` is banned on cards** — it sets inline styles that override CSS custom property hover states. Use `whileTap` only.
- **Framer modal centering**: use `style={{ x: '-50%', y: '-50%' }}` on `motion.div` rather than CSS `top:50%/left:50%` — avoids `transform` conflicts with Framer scale animations.
- **`meta` fields on listings**: category-specific answers are serialized as `[{label, value}]` at submission time so the detail page can render them without importing `categoryConfig.js`.
- **`Date.now()` for user listing IDs**: avoids collision with static ids 1–32.
- **CSS carousel, not Framer**: `animation-play-state: paused` on hover prevents the jump-to-zero bug that occurs with Framer `animate` on looping CSS animations.
- **Services category permission**: category is set to `'services'` in state BEFORE showing the modal (so the select shows "Services" highlighted while modal appears). On dismiss, category resets to `''`.
- **Portal pattern**: `BusinessRequiredModal` and `Lightbox` both use `createPortal(content, document.body)` to escape stacking context issues.
- **`useEffect` cleanup on category change**: clears images, category fields, and errors when the user switches category in AddListingPage — prevents stale validation state.
- **Premium: payment ≠ approval** (Phase 4.4): every premium request (`createPremiumRequest`) carries independent `approvalStatus` + `paymentStatus`. `isPremiumActive` requires *approved AND settled*. Standard listings are free/instant; premium always requires admin approval; flipping `PRICING[*].enabled` later switches new requests to `unpaid` without flow changes.
- **One request shape for featured + business** (Phase 4.4): both use `createPremiumRequest` and the same `premiumService` transitions, so a future admin panel/backend handles both queues identically. `premiumService` functions are pure (return new objects) — single place for transition rules.
- **Featured never auto-activates** (Phase 4.4): the `featured` boolean (badge) stays false; only an admin decision (`applyFeaturedDecision`) flips it true when `isPremiumActive` passes.
- **WhatsApp brand-green exception** (Phase 4.1): `.detail__contact-btn--whatsapp` uses `#25d366` (the one scoped exception to the single-accent rule — recognition is the trust signal); `toWhatsAppNumber()` normalises local numbers to wa.me format at render time.
- **Recently-viewed + related extracted** (Phase 4.3): logic centralised in `recentlyViewedService.js`; "You May Also Like" is the reusable `RelatedListings` component — removed duplicated logic / inline markup.
- **Route-level auth gate** (Phase 4.4.5): `/add-listing` is protected at the route via `RequireAuth` rather than per-link checks — one guard covers every entry point and keeps the redirect/return logic in one place. `isAuthenticated` is genuine persisted state (mock login), so the swap to a real session token touches only `AuthContext`.
- **Private listings are 404 to the public** (Phase 5.2.5): `GET /listings/:id` uses `optionalAuth`; `pending`/`hidden`/`rejected` listings return **404** (not 403, to avoid revealing existence) unless the requester is the owner or an admin. `approved`/`sold` stay public. The public feed (`?status=approved`) already excludes them.
- **Saved listings are server-side for authed users** (Phase 5.2.5): `saved_listings` join table + `/api/saved` CRUD; `FavoritesContext` is optimistic with rollback and merges guest `localStorage` favourites into the account on login. Same `useFavorites` interface, so Navbar/cards/drawer/page are unchanged.
- **Imageless cards never show empty boxes** (Phase 4.4.5): Jobs/Services (image-optional) without a photo render a branded `ListingPlaceholder` in the same 4:3 slot. Same DOM structure as a photo card → identical heights, grid alignment, hover, and badge overlay; the type pill reuses data the card already carries (`condition`/`serviceType`) rather than duplicating the body's title/price.
