# TODO

---

## Current Sprint

□ Login / registration page
  The "Join / Login" navbar button links to `/login` — a dead route.
  User accounts are a prerequisite for Add Listing and persistent Save
  functionality to work in production. Highest priority unblocked task.

□ Listing detail page
  Every listing card links to `/listing/:id` but no page exists.
  This is the most critical missing feature for the user journey —
  users cannot view, contact, or act on a listing without it.

□ Add Listing form page
  The "+ Add Listing" navbar CTA links to `/add-listing` — a dead route.
  Core marketplace functionality — the platform has no inventory without it.

---

## Up Next

□ React Router integration
  All hrefs are plain links with no routing. Once listing detail, login,
  and add-listing pages exist, React Router is needed for SPA navigation,
  back-button support, and deep linking.

□ Search and filter functionality
  The hero search bar is fully styled but non-functional.
  Basic keyword + category filter across listing titles is the MVP.

□ Footer with trust signals
  Every community marketplace needs a footer: About, Safety tips,
  Community guidelines, Contact. Builds credibility and Malir Cantt identity.

□ Loading skeleton states
  Listing cards need a shimmer/skeleton placeholder for async data.
  Currently renders nothing or jumps in from localStorage.

□ Responsive testing pass
  Full audit at 375px, 390px, 768px, 1024px, and 1440px.
  Pay attention to FavoritesDrawer on small screens, hero title clamp,
  and carousel card sizing.

---

## Completed

✓ Favourites system (FavoritesContext, localStorage persistence, heart pop animation)
✓ FavoritesDrawer (slide-in panel, card grid, empty state)
✓ Favourites icon in Navbar with count badge
✓ "Join / Login" bordered ghost CTA replacing plain Login link
✓ Recently Viewed section (localStorage, auto-hides when empty, Clear button)
✓ Carousel listing counts (count field on CategoryCard, .carousel-card__count)
✓ Nav links truly centred (absolute positioning fix)
✓ Category renames: "Cars & Vehicles" → "Vehicles", "Electronics" → "Technology"
✓ Trust stat wording: "Updated Daily", "Verified Residents"
✓ FeaturedListings filtered to featured:true only
✓ User-supplied local images for 5 categories (public/categories/)
✓ Gym & Fitness and Shoes & Footwear categories added to carousel
✓ Refine hero section (layered radial background, new headline, search enhancements)
✓ Upgrade typography (Inter variable font, full token hierarchy, tighter line-heights)
✓ Improve colour palette (CSS custom property system, single green accent, semantic tokens)
✓ Better category cards (icon box treatment, hover inversion, shadow lift)
✓ Listing card refinement (border, uniform padding, all transitions tokenised)
✓ Scroll entrance animations (Framer Motion whileInView with stagger)
✓ Navbar checkpost brand icon (boom gate SVG, brand-primary colour)
✓ Single search consolidation (removed duplicate navbar search bar)
✓ Motion tokens and reduced-motion accessibility block
✓ Z-index token scale
✓ Homepage layout
✓ Initial navbar, search, categories, hero
