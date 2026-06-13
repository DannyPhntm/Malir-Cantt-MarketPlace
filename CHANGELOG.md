# Changelog

---

## 2026-06-12 — Favourites, Recently Viewed, UI Polish & Category Expansion

### Added
- **Favourites system** — `FavoritesContext` (React Context + localStorage under key `malir-favorites`) wraps the entire app; `useFavorites()` hook exposes `{ favorites, toggle, isFavorited, isOpen, setIsOpen }` to any component
- **FavoritesDrawer** — slide-in panel from right (Framer Motion); 420px desktop / full-width mobile; 2-column `ListingCard` grid; empty state with centred heart icon and hint text
- **Heart pop animation** on listing cards — `@keyframes heartPop` (scale 1 → 1.5 → 0.85 → 1.12 → 1, 0.55 s); `.listing-card__save--liked` fills heart red + sets `#fff1f1` button background
- **Favourites icon in Navbar** — heart SVG button (`navbar__fav-btn`, 36×36px) between "Join / Login" and "+ Add Listing"; fills solid red and shows a red count badge when favourites exist; opens FavoritesDrawer on click; present in mobile menu too
- **"Join / Login" CTA** replacing plain "Login" text link — bordered ghost button (`border: 1px solid rgba(255,255,255,0.32)`, `background: rgba(255,255,255,0.06)`); hover brightens border to 0.6 opacity + `scale(1.02)` lift
- **RecentlyViewed section** — below Featured Listings; reads `malir-recently-viewed` from localStorage; hidden when empty; "Clear" button; same 4-column card grid as Featured Listings; max 8 shown
- **Recently viewed tracking** — `saveRecentlyViewed()` called in `ListingCard` onClick (synchronous write before navigation); max 12 stored
- **Carousel listing counts** — `count?: string` field added to `CategoryCard` interface; rendered as `.carousel-card__count` (muted white, 11px) below the card title
- **Gym & Fitness category** in carousel — Unsplash gym interior photo, 95 active listings
- **Shoes & Footwear category** in carousel — Unsplash sneaker product shot, 178 active listings
- Local category images in `public/categories/` (served as static assets): `vehicles.png`, `technology.png`, `property.png`, `furniture.png`, `jobs.png`

### Changed
- **Navbar nav links truly centred** — switched from `margin: 0 auto` (centred in leftover flex space) to `position: absolute; left: 50%; transform: translateX(-50%)` so links are always centred against the full navbar width regardless of brand/actions widths
- **"Cars & Vehicles" renamed to "Vehicles"** — category name and href updated (`/category/vehicles`)
- **"Electronics" renamed to "Technology"** — category name and href updated (`/category/technology`)
- **Trust stats wording corrected** — "Daily Updated" → "Updated Daily"; "Resident Only" → "Verified Residents"
- **FeaturedListings now filters to `featured: true` only** — 4 listings shown (ids 1–4); previously showed all 6
- **Carousel category images replaced** — Jobs, Furniture, Property, Vehicles, Technology now use user-supplied high-quality local images instead of Unsplash stock

### Architecture
- `FavoritesProvider` wraps the entire app in `App.jsx`; render order: `<Navbar>` → `<FavoritesDrawer>` → `<main>`
- `src/context/FavoritesContext.jsx` — new file, single source of truth for all favourites state
- `src/components/FavoritesDrawer.jsx` + `FavoritesDrawer.css` — new files
- `src/components/RecentlyViewed.jsx` + `RecentlyViewed.css` — new files
- `FEATURED_LISTINGS` data expanded from 6 to 8 entries; `featured: true` on ids 1–4

---

## 2026-06-11 — Design System & Premium UI Refinement

### Added
- Full CSS custom property design system across 9 token groups: Brand, Surfaces, Text, Semantic, Shadows, Radius, Typography, Motion, Z-index, Spacing, Layout
- Inter variable font via Google Fonts (full optical-size and weight axis, replaces fixed-weight loading)
- Framer Motion scroll-entrance animations on Hero, Categories, and Featured Listings sections
- Checkpost barrier SVG as navbar brand mark (boom gate: vertical post, horizontal arm, counterweight, pivot dot)
- Layered radial gradient hero background with two decorative concentric ring overlays via `::before`/`::after`
- Category card icon boxes — 52px pale-green rounded-square container, inverts to solid primary green on hover
- Listing card border (`1px solid --color-border-soft`) for surface definition on off-white background
- Subtle gradient text treatment on hero accent line ("Inside Malir Cantt.")
- `prefers-reduced-motion` accessibility block in global CSS
- Z-index token scale (`--z-above`, `--z-dropdown`, `--z-navbar`, `--z-modal`)

### Changed
- Hero headline: "Buy and Sell Within / Malir Cantt" → "Find Everything / Inside Malir Cantt."
- Hero subtitle: "A trusted community marketplace…" → "Buy, sell, and connect with your community."
- Hero title enlarged to `clamp(2.6rem, 6.5vw, 4.2rem)`, line-height tightened to `1.06`
- Hero subtitle enlarged to `--text-md` (17px), contrast raised to 75% white opacity
- Navbar home icon replaced with minimalist checkpost barrier mark (brand primary green)
- Navbar height corrected to 64px (`--space-16`, on 8px grid)
- Navbar z-index and tooltip z-index now use `--z-navbar` / `--z-above` tokens
- All raw CSS transition values (`0.15s`, `0.18s`, `0.22s`) replaced with `--duration-*` tokens
- Category card padding reduced from 32px to 24px vertical (visual height preserved by larger icon box)
- Featured Listings grid gap corrected from 20px (off-grid) to 24px (`--space-6`)
- Listing card body padding unified to `--space-5` (was asymmetric 16px top / 20px sides)
- Listing card price `letter-spacing` uses `--ls-snug` token (was raw `-0.5px`)
- Listing card save button `border-radius: 50%` replaced with `var(--radius-full)`
- Hero inner `gap` reduced from 24px to 16px; search `margin-top` adjusted to preserve subtitle→search rhythm
- Popular tag label contrast: 40% → 60% white opacity, added `font-weight: medium`
- Popular tag chips: text 80% → 88%, background 8% → 10%, border 16% → 22% white opacity
- Popular tags gap: 8px → 12px (`--space-3`)
- Category card hover: lifts via Framer Motion y:-4, border highlights, box-shadow appears

### Removed
- Duplicate search bar in navbar (hero search is the single primary entry point)
- Raw hex colour values in all component CSS files
- Framer Motion `whileHover` from ListingCard (was conflicting with CSS token-based hover states)
- Unused blue accent colour tokens (`--color-accent*`)
- Brand text "Malir Marketplace" from navbar (replaced by icon-only brand mark)

---

## Initial Release

- Homepage layout
- Navbar
- Search bar
- Category section
- Initial hero section
