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
