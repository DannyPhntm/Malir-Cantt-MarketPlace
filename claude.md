# CLAUDE.md

## Purpose

You are assisting with the development of the Malir Cantt Marketplace.

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

## Current UI Architecture

### Navbar (`Navbar.jsx` + `Navbar.css`)
- **Dark green background**: `#0d2a1a`, 72px height
- **Left**: checkpost boom-gate SVG icon + wordmark ("MALIR CANTT" bold Manrope / "MARKETPLACE" green Inter)
- **Center**: Browse, Categories, Listings, About, Contact — opacity 0.85
- **Right** (left → right order): heart/favourites icon button → "Join / Login" ghost button → "+ Add Listing" green CTA
- **Favourites icon**: `navbar__fav-btn` — 36×36px ghost button, heart SVG fills red when favourites exist; red count badge (`navbar__fav-badge`) top-right corner; clicking opens FavoritesDrawer
- **"Join / Login"** (`navbar__join-btn`): bordered ghost button — `border: 1px solid rgba(255,255,255,0.32)`, `background: rgba(255,255,255,0.06)`, height 36px, hover brightens border to 0.6 + scale(1.02); NOT a plain text link
- **Inner container**: `max-width: 1440px`, `padding: 0 24px`
- Mobile burger collapses all nav + actions into slide-down menu; includes "Saved Listings" row with heart icon + count, then "Join / Login" full-width ghost button, then "+ Add Listing"

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
  1. Vehicles — `/categories/vehicles.png` (local, user-supplied Karachi car market photo)
  2. Technology — `/categories/technology.png` (local, user-supplied desk/devices flat-lay)
  3. Property — `/categories/property.png` (local, user-supplied villa exterior)
  4. Furniture — `/categories/furniture.png` (local, user-supplied modern living room)
  5. Jobs — `/categories/jobs.png` (local, user-supplied business handshake overhead)
  6. Services — Unsplash `photo-1581578731548` (no local image provided)
  7. Gym & Fitness — Unsplash `photo-1534438327276` (gym interior)
  8. Shoes & Footwear — Unsplash `photo-1542291026` (Nike sneaker product shot)
- Local category images live in `public/categories/` — served at `/categories/<name>.png`
- When adding new categories: user-supplied images go to `public/categories/`, fallback to Unsplash with `?w=400&h=300&fit=crop`

### Homepage layout (`App.jsx`)
- Wrapped in `<FavoritesProvider>` (from `src/context/FavoritesContext.jsx`)
- Render order: `<Navbar />` → `<FavoritesDrawer />` → `<main>` containing `<PulseFitHero>` + `<FeaturedListings>` + `<RecentlyViewed>`
- Categories section is NOT rendered on the homepage — hero carousel serves that purpose
- `Categories.jsx` still exists for a future `/categories` route

### Favourites System (`src/context/FavoritesContext.jsx`)
- `FavoritesProvider` wraps the entire app in `App.jsx`
- State: `favorites` (array of full listing objects), `isOpen` (drawer open/close), persisted in `localStorage` under key `malir-favorites`
- Exports: `FavoritesProvider`, `useFavorites()` → `{ favorites, toggle, isFavorited, isOpen, setIsOpen }`
- `toggle(listing)` adds or removes a listing by id
- Any component that imports `useFavorites` must be a descendant of `FavoritesProvider`

### FavoritesDrawer (`FavoritesDrawer.jsx` + `FavoritesDrawer.css`)
- Slide-in panel from the right (Framer Motion `x: '100%' → 0`), blurred dark overlay behind it
- Width 420px desktop, 100vw mobile
- Header: red heart icon + "Saved Listings" title + green count pill + close (×) button
- Body: 2-column `ListingCard` grid; empty state shows centred heart icon with hint text
- Opened by clicking the navbar heart icon or mobile "Saved Listings" row

### ListingCard (`ListingCard.jsx` + `ListingCard.css`)
- Heart save button: top-right of image, 32×32px circular white button
- **Favourited state** (`listing-card__save--liked`): button background `#fff1f1`, heart fills red (`var(--color-danger)`)
- **Heart pop animation**: on favouriting, `.heart-pop` CSS class applied for 600ms — `@keyframes heartPop` scales 1 → 1.5 → 0.85 → 1.12 → 1 (`cubic-bezier(0.22, 1, 0.36, 1)`)
- Clicking the card (not the heart) calls `saveRecentlyViewed(listing)` — stores listing in `localStorage` under `malir-recently-viewed`, max 12 entries
- `onClick` on the `<motion.a>` fires before navigation; storage write is synchronous so it persists before page change

### FeaturedListings (`FeaturedListings.jsx`)
- Only renders listings where `featured: true` (filtered from `FEATURED_LISTINGS`)
- Currently 4 featured items (ids 1–4); non-featured listings (ids 5–8) exist in data but are not shown here

### RecentlyViewed (`RecentlyViewed.jsx` + `RecentlyViewed.css`)
- Reads `malir-recently-viewed` from localStorage on mount; renders nothing if array is empty
- Shows up to 8 items in the same 4-column grid as FeaturedListings
- "Clear" button removes the key from localStorage and sets state to `[]`
- Section appears below FeaturedListings; only visible after user has clicked on listings

### Data (`src/data/listings.js`)
- Single export `FEATURED_LISTINGS` — 8 listings total
- `featured: true` on ids 1, 2, 3, 4 (shown in FeaturedListings)
- `featured: false` on ids 5, 6, 7, 8 (available for other sections/pages)

### Categories (`Categories.jsx` + `Categories.css`)
- Photo-based cards, 3-column desktop → 2 mobile
- Not used on homepage — available for a `/categories` route

### Animation System (`src/animations.js`)
- Central export: `ease`, `dur`, `viewport`, `fadeUp`, `staggerContainer`, `staggerItem`, `navMenu`, `tap`
- `ScrollReveal.jsx` — reusable scroll-triggered fade-up wrapper
- CSS carousel animation uses `animation-play-state: paused` on hover — NOT Framer (avoids jump-to-zero bug)
- Only `whileTap` is safe on cards; `whileHover` sets inline styles that override CSS custom properties
- `.hero-tag` / `.hero-tag--recent` CSS classes in `index.css` — handle popular tag + recent search chip hover; do NOT use inline styles for these
- `@keyframes heartPop` defined in `ListingCard.css` — used for favourite toggle animation

### Stack
- React 19 + Vite 8 (JSX primary, TSX for shadcn components)
- Framer Motion v12
- Tailwind CSS v4 via `@tailwindcss/vite` (no tailwind.config.js)
- CSS custom properties as design token system (`src/index.css`)
- `cn()` via clsx + tailwind-merge in `src/lib/utils.ts`
- `@` path alias → `./src` (ESM: `fileURLToPath(new URL(...))`)
