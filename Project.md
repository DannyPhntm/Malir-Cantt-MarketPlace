# People of Malir Cantt Bazaar

## Project Vision

Build a modern, premium, community-focused bazaar exclusively for Malir Cantt residents. The website should feel trustworthy, simple, and fast rather than cluttered like traditional classified websites.

---

## Design Philosophy

The UI should prioritize:

* Clean and minimal layouts.
* Plenty of white space.
* Mobile-first responsiveness.
* Large, easy-to-read text.
* Modern rounded cards and buttons.
* Fast loading and smooth interactions.
* Professional appearance similar to modern startup products.

Avoid:

* Cluttered pages.
* Too many colors.
* Excessive animations.
* Tiny buttons or cramped layouts.

---

## Visual Inspiration

The website should take inspiration from:

* Facebook Marketplace for browsing simplicity.
* Airbnb for clean layouts.
* Apple's website for spacing and typography.
* Stripe for modern UI components.

Do NOT directly copy any website. Instead, adopt their design principles.

---

## Color Palette

Primary:

* Deep Green
* White
* Light Gray

Accent:

* Dark Gray
* Soft Blue for interactive elements.

The design should feel modern and premium.

---

## Typography

* Clean sans-serif fonts.
* Clear visual hierarchy.
* Large headings.
* Easy readability.

---

## Homepage Layout

### Navigation Bar

Should include:

* Logo
* Search bar
* Categories
* Login
* Add Listing button

Should remain simple and responsive.

---

### Hero Section

Large search functionality.

Headline:
"Buy and Sell Within Malir Cantt"

Subheadline explaining the community marketplace concept.

---

### Categories

Display category cards such as:

* Cars
* Electronics
* Property
* Furniture
* Jobs


---

### Featured Listings

Modern card grid showing:

* Image
* Price
* Title
* Location
* Time posted

---

## Product Listing Cards

Each card should include:

* Large image.
* Bold price.
* Product title.
* Category.
* Malir Cantt location.
* Save/Favorite button.

Cards should have subtle hover effects.

---

## User Experience Rules

Claude should always prefer:

* Fewer clicks.
* Simpler navigation.
* Clear call-to-action buttons.
* Consistent spacing.
* Accessible layouts.

When making design decisions, prioritize user trust and simplicity over adding features. Try to add clean sleek animations.

---

## Development Philosophy

When implementing features:

1. Keep components modular.
2. Write reusable React components.
3. Avoid unnecessary complexity.
4. Maintain responsive design.
5. Keep code organized for future scaling.

---

## MVP Features

* Homepage
* Search
* Categories
* Listings
* Listing details
* User authentication
* Add listing
* Seller Number icon with the name "Contact Seller" should pop up the sellers contact number and should allow the buyer to call it.

---

## Long-Term Features

* Messaging
* Favorites
* Notifications
* Premium listings
* Business accounts
* Admin dashboard

---

## Claude Instructions

When generating code:

* Maintain the existing design language.
* Keep components reusable.
* Preserve mobile responsiveness.
* Avoid redesigning existing sections unless specifically requested.
* Explain major architectural decisions before implementing large changes.

---

## Business verification (beta)

Applying for a business account requires proof the business is real:

- **Required:** business name, business type, business address, business phone/WhatsApp, and **one verification document photo** (bill, receipt, business card, rent/lease proof, or anything showing the business name/address).
- **Optional (beta):** owner CNIC photo, NTN / registration number.
- Verification documents are **admin-only** — they are never shown on public business, shop, or seller pages.
- Admins review the document before approving a business; approval (with payment waived for beta) unlocks shop management and business listings.

> Admin user blocking (beta): admins can reversibly block/unblock a user (Admin → Users). Enforced server-side — blocked accounts get 403 "Your account has been restricted. Please contact support." on login and all protected actions. Blocking never deletes data; admins cannot block themselves or other admins.
> Business verification documents are admin-only and used only to verify authenticity before approval. Admins review them in Admin → Business (thumbnail + link); rejection can include a reason shown to the applicant. Never exposed on public pages.

> Legal/safety: /terms, /privacy, /safety pages added (footer-linked). The platform is a connector, not a transaction guarantor; business verification documents are collected for admin review only (never public); beta payments are not processed by the platform.

> SEO: per-route meta/canonical/OG via RouteSeo + seoConfig; static /robots.txt + /sitemap.xml; JSON-LD in index.html. Public pages index; admin/dashboard/profile/login/apply-business/my-shop/etc are noindex; non-prod hosts forced noindex. Add a 1200x630 public/og-image.png for social previews. GSC: verify domain via Porkbun DNS TXT, submit sitemap. Business QR → /apply-business.
