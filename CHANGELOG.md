# Changelog

---

## 2026-06-17 — Phase 5.6: Edit Listing + Owner Controls

Added a dedicated Edit Listing experience and gated owner actions on the listing detail page. **No UI redesign** — the edit form reuses the Add Listing cards/inputs (`AddListingPage.css`) and the `CategoryFields` component; owner controls reuse the existing detail-page button styles.

### Added
- **`/edit-listing/:id`** (`EditListingPage.jsx` + `.css`) — route-protected (`RequireAuth`; logged-out → login). Loads the listing, pre-fills general fields (title/price/description) and all category-specific fields from `details`, and locks the category (changing it would change the whole field set). **Images**: reuse existing, add, remove, and reorder (‹ › swap; first = cover), enforcing 1–10 (Jobs/Services 0–10). Saves via **PATCH** (never creates), shows a success message, and redirects to My Listings. Editing a **rejected** listing resubmits it (→ pending).
- **Owner controls on the listing detail page** — only the listing **owner** sees Edit / Mark as Sold / Archive (hide) / Delete (with confirm), plus a status chip. Status-aware (sold → Mark Available; hidden → Restore; pending/rejected → note). Public/non-owner viewers see **only** Contact Seller, WhatsApp, and a new **Save Listing** button. Admin moderation stays in the Admin Dashboard — no admin buttons added to listing pages.
- Adapter now exposes `userId` so the UI can check ownership.

### Changed
- **`PATCH /listings/:id`** now also accepts `details` (category attributes, cleaned → JSON), `images` (full set; replaced atomically via `deleteMany` + `create`; min-count enforced by category), and `status: 'pending'` so a non-admin owner can resubmit a rejected listing. `listingUpdateSchema` extended accordingly.
- **My Listings** "Edit" now links to `/edit-listing/:id` (was `/add-listing`).

### Security (verified)
- Backend ownership enforced on PATCH/DELETE: logged-out → **401**, non-owner → **403**, owner/admin → **200**. The Edit page also checks ownership client-side and renders an **Unauthorized** notice for non-owners (defence in depth; the backend is the real gate). Owner controls are hidden from non-owners in the UI. Category is not editable (schema has no `category` field, so an injected one is stripped). A non-admin owner still cannot self-approve a pending listing.

### Verified (13/13 edit-endpoint checks + `npm run build`)
- Create → edit content/details; add images; reorder (cover swap); category-lock (PATCH category ignored); vehicles can't drop below 1 image (422); 401/403/admin-200; rejected→resubmit→pending; owner can't self-approve pending (400); owner delete (204). Frontend build passes.

---

## 2026-06-17 — Phase 5.5: Admin System Completion

Completed the admin moderation system on top of the existing Phase 5.2.4–5.2.5 foundation (seed admin, JWT `requireRole('admin')`, AdminPage, `adminApi`, `RequireAdmin`). This was an **audit + fill-the-gaps** pass — no rebuild, no UI redesign; all existing `admin__*` classes and endpoints reused.

### Added
- **Dashboard (all 10 live metrics)** — `GET /stats` now also returns `listings.hidden` and `listings.featuredPending` (requested-but-not-active). The admin stat grid renders the full set: Users, Listings, Pending, Approved, Rejected, Sold, Hidden, Business pending, Featured pending, Featured active.
- **Full listing moderation in the UI** — the Listings tab gained a status sub-filter (Pending / Approved / Hidden) with contextual actions: **Approve / Feature / Reject** (pending), **Hide / Delete** (approved), **Restore / Delete** (hidden). Delete is confirm-gated. Backend already allowed these (`setListingStatus` any status; admin `deleteListing`); the UI now exposes them. `adminApi.deleteListing`.
- **Featured tab** — lists featured requests (`featuredRequested && !featuredActive`) with **Activate** (sets `featuredActive`) and **Reject** (clears `featuredRequested`). No payment — admin-controlled. `adminApi.listFeaturedRequests`.
- **User management** — `GET /users?search=` (name/email, case-insensitive) + each user now carries `_count.listings`. The Users tab gained a search box and shows the listing count. No banning/deleting (per scope).
- **`server/scripts/create-admin.js`** + `npm run create-admin` — idempotent admin creation/rotation **without wiping data** (upsert by email). Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD`, else generates a strong random password and prints it. This is the "manual database creation" path; admin accounts still cannot be created via public sign-up.

### Changed
- **`setListingStatus`** now accepts any subset of `{ status, featuredActive, featuredRequested }` (was status-required), so moderation and featured control share one clean admin endpoint. `listingStatusSchema` updated accordingly.
- **Seed** admin password is now env-driven (`ADMIN_PASSWORD`, default `admin123` for dev) and printed at seed time.

### Fixed
- **Query boolean parsing** — `?featured=` / `?featuredRequested=` used `z.coerce.boolean()`, which turned the string `'false'` into `true` (any non-empty string is truthy). Replaced with an explicit `'true'|'false'` transform so `featured=false` filters correctly (this is what the Featured tab relies on).

### Security (verified)
- Admin routes enforced server-side (`requireAuth` + `requireRole('admin')`): non-admin → **403**, no token → **401**. Frontend `RequireAdmin` redirects logged-out users to `/login?redirect=` and non-admins to `/`.
- **No self-promotion path**: `register` has no role field; `updateUserSchema` omits role/accountType/businessVerified; the `validate` middleware replaces the request body with the zod-parsed object, so injected `role: 'admin'` is stripped. Confirmed by test (register + PATCH both leave `role: 'user'`).

### Verified (end-to-end API, 23/23 checks + `npm run build`)
- Admin login; stats auth (401/403/200) with all 10 metrics; role-injection blocked on register + PATCH; approve/reject/hide/restore/delete listing (+ deleted → 404); non-admin moderation → 403; featured request list / activate / reject; business pending list / approve (auto-verifies) / non-admin → 403; user search + listing count; non-admin user list → 403. Frontend build passes (0 errors).

---

## 2026-06-17 — Phase 5.4: Real Email Verification System

Replaced the mock verification system with real email-based verification across registration, password reset, and a new profile email-change flow. Codes are now emailed (never shown on screen). **No UI redesign** — the verification screens are unchanged; only the data flow and one new ProfilePage panel were added.

### Added
- **`server/src/lib/emailer.js`** — Nodemailer SMTP transport configured entirely from env (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_SECURE`/`MAIL_FROM`), so any provider works (Mailtrap, Gmail, SES, …). When SMTP is unconfigured (local dev / CI) it falls back to a **server-side console log** — flows keep working without credentials and codes are never sent to the client. Three branded templated senders: verification, password reset, email change.
- **Email change flow** (verifies the **new** address before swapping):
  - `POST /api/auth/request-email-change` (auth) — sends a 6-digit code to the new address; rejects an address already in use.
  - `POST /api/auth/confirm-email-change` (auth) — validates the single-use code, then swaps the user's email and marks it verified.
  - `authApi.requestEmailChange` / `confirmEmailChange`; `AuthContext` actions; an inline **ProfilePage** panel (new email → code → confirm) built from existing design tokens. The email field now binds to `profile.email` so it refreshes after a change.

### Changed
- **Registration / resend / password-reset** now **send the code by email** and **no longer return it** in the API response (`verificationCode` / `resetCode` removed from all payloads).
- **Code lifetime 15 → 10 minutes** (`CODE_TTL_MINUTES`, `.env` + default).

### Removed
- **All development code-display behaviour**: the `verify-dev-hint` block + `.verify-dev-hint` CSS in `LoginPage`, and the `devCode` / `pendingCode` plumbing in all three flows (register personal/business, forgot-password). Deleted the unused mock `src/services/emailService.js`.

### Notes
- Reuse prevention was already in place (`verified` / `used` flags) and is unchanged. The reset form's "enter password twice" (confirm + match) already existed client-side.
- To send real mail, set the `SMTP_*` vars in `server/.env`; empty values keep the console fallback. No code change needed.

### Verified (API end-to-end, 19/19 checks + frontend build)
- Register hides the code, stores a 6-digit code, TTL = 10.0 min; verify rejects wrong / accepts right / blocks reuse + issues JWT; reset hides code, single-use, login with new password works; email change is auth-gated (401 without token), code lands on the new address, confirm swaps + verifies the email, login with the new email works, and a taken email is rejected (409). `vite build` passes (0 errors). Emailer fired 3× via the console fallback (no SMTP configured).

---

## 2026-06-16 — Phase 5.3: Marketplace Search & Category Experience

Made search/browsing smarter and listings category-aware, plus a new business-only Food category. **No UI redesign.**

### Added
- **Per-listing details**: `listings.details` JSON column (migration `add_listing_details`) stores category-specific attributes (make/model/year, bedrooms, foodType…). Create accepts `details`; the adapter parses it and rebuilds the labelled `meta` chips, so **listing detail pages now show category-specific info** again (lost in the backend migration) with no UI change.
- **Food & Home Kitchen category** (`food`) — business-accounts only, enforced **server-side** (`BUSINESS_ONLY_CATEGORIES`; create → 403 for non-verified-business) and surfaced in the UI (personal users get the "Apply for Business" upgrade modal). Fields: Food Type, Specialty, Delivery/Pickup Available, Advance Order. Images 1–10. Added to Navbar, category pages, filters, add-listing, and seeded a demo listing.
- **Vehicle year range** filter (Year From / Year To) — generic `range` filter type that also lays the groundwork for future price/mileage ranges.
- Reusable typed category filters (`select` / `text` / `range`) that read from a listing's `details`.

### Changed / Fixed
- **Search bar (Task 1)**: fixed the icon/text overlap — the input used an undefined `--space-9` token which invalidated the whole `padding` rule (so left padding was lost); now `44px` left + explicit vertical centering of icon and clear button. The page autofocuses the search box (no scroll jump); Enter already submits.
- **Search (Task 2)**: case-insensitive, multi-token (every token must match), and searches title + description + category + **detail fields** + seller + area (e.g. "petrol", "honda automatic").
- **Category filters (Task 6)** now adapt per category and match against `details`: Vehicles (Year range, Fuel, Transmission), Property (Bedrooms, Bathrooms), Jobs (Job Type, Experience), Services (Service Type), Gym (Equipment Type), Shoes (Size), Food (Food Type). Active-filter chips handle ranges.
- Shoes config gained a **Gender** field; Services marked `businessOnly` (consistent with the generalised gate).

### Verified (headless browser + API, 0 console errors)
- Search bar padding/autofocus; partial + case-insensitive + detail-field + multi-token search; vehicle detail shows 9 category chips; year-range filter; Food category page + detail; Food create 403 (personal) / 201 (business); personal users see the upgrade prompt.

---

## 2026-06-16 — Phase 5.2.6: Complete User Account System

Locked down the authenticated account area and connected the remaining pages to the backend. **No UI redesign** — additions only, in the existing style.

### Added
- **Backend**
  - **Saved listings**: `saved_listings` join table (migration `add_saved_listings`); `GET/POST /api/saved`, `DELETE /api/saved/:listingId` (all auth).
  - **Hidden-listing security**: `optionalAuth` middleware + `GET /listings/:id` returns **404** for `pending`/`hidden`/`rejected` unless the requester is the owner or an admin (`approved`/`sold` stay public).
- **Frontend**
  - `services/savedApi.js`; `lib/listingStats.js` (`computeListingStats`).
  - **Dashboard Overview**: real-data account-status chips + 7 stat tiles (Active/Pending/Sold/Hidden/Rejected/Featured/Featured-Pending) from `GET /listings/mine`, with loading + error/retry.

### Changed
- **Protected routes**: `RequireAuth` now also wraps `/dashboard`, `/profile`, `/saved-listings` (and `/my-listings`); logged-out users are redirected to login with the intended destination preserved (`?redirect=`).
- **FavoritesContext** is now backend-backed for authenticated users (optimistic save/remove with rollback; `GET /saved` on login; guest `localStorage` favourites merged into the account on login). Same `useFavorites` interface → Navbar/cards/drawer/SavedListings unchanged; SavedListings gained a loading state.
- **ProfilePage**: async save of **name / phone / resident location** (+ cantt pass) via `PATCH /users/:id` with a success banner and inline error; **email + verification fields are read-only**; email chip now reflects `emailVerified`. Changes persist across refresh (via `/auth/me`).

### Verified (headless browser + API, 0 console errors)
- Logged-out users redirected from all four account pages; profile edit persists across reload; dashboard shows real counts; saved listings save/persist/remove; hidden & pending listings 404 for the public but 200 for owner/admin.

---

## 2026-06-16 — Phase 5.2.5: My Listings Integration

Wired the My Listings page to the backend so sellers manage their real listings (replacing mock data), with owner-scoped status changes and deletion.

### Added
- **Backend**:
  - `GET /api/listings/mine` (🔑 auth) — the authenticated user's listings across **all** statuses (avoids exposing pending/hidden via the public list).
  - `hidden` added to listing statuses; `OWNER_SETTABLE_STATUSES` (`approved`/`sold`/`hidden`).
  - Owner status transitions via `PATCH /listings/:id` (owner-or-admin): `status` added to `listingUpdateSchema`; the controller only lets a non-admin change status when the listing is already in a lifecycle state (not `pending`/`rejected`). Moderation (`pending → approved`) stays admin-only on `/status`.
- **Frontend** `listingsApi`: `mine()`, `update(id, changes)`, `remove(id)`.

### Changed
- **`MyListingsPage`** — now fetches `GET /listings/mine` (adapted), with loading/error states and optimistic updates (revert on failure):
  - **Mark Sold** / **Hide** → `PATCH { status }`; **Re-activate / Make Active** → `status: 'approved'`; **Delete** → `DELETE`.
  - Status badges map backend → UI (`approved`→Active; Pending/Rejected/Sold/Hidden); filters unchanged (Active = approved).
  - Route is now **protected** (`RequireAuth`).

### Verified (headless browser, 0 console errors)
- Logged-out → redirected to login; owner's listings load; Mark Sold updates the badge and **persists across reload**; Re-activate restores Active.

### Notes
- "Edit" still links to `/add-listing` (no dedicated edit page yet). Hidden listings drop out of the public feed but remain reachable by direct detail URL.

---

## 2026-06-16 — Phase 5.2.4: JWT Auth + Role Enforcement

Replaced the user-id session with real JWTs and enforced authentication/roles on the backend — the admin and write endpoints are no longer UI-gated only.

### Added
- **JWT issuance** — `login` and `verify-email` now return a signed token (`src/lib/jwt.js`; `JWT_SECRET` / `JWT_EXPIRES_IN` in `.env`).
- **Auth middleware** (`src/middleware/auth.js`) — `requireAuth` (verifies the Bearer token → `req.user = { id, role }`) and `requireRole('admin')`.
- **`GET /api/auth/me`** — returns the current user from the token (used for session rehydration).
- Frontend: `apiClient` owns the token (`setAuthToken`/`clearAuthToken`/`getAuthToken`, `localStorage` `malir-token`) and attaches `Authorization: Bearer` on every request; `authApi.me()`.

### Changed
- **Endpoint protection**:
  - 🛡️ admin: `GET /stats`, `GET /users` (list), `GET /business-accounts` (list), `PATCH /listings/:id/status`, `PATCH /business-accounts/:id/decision`.
  - 🔑 auth + ownership: `POST /listings` (owner from token), `PATCH`/`DELETE /listings/:id` (owner or admin), `POST /business-accounts`, `GET`/`PATCH /users/:id` (self or admin), `GET /auth/me`.
  - 🔓 public: listing reads (approved feed + detail), all `/auth/*` entry points.
- `createListing` / `applyForBusiness` derive the owner from the token (body `userId` ignored; made optional in the validators).
- **AuthContext** — session is now the JWT: stored on login/verify, rehydrated via `/auth/me` on load, cleared on logout. Replaced the `malir-session` user-id with `malir-token`.

### Verified
- API: 401 (no token) / 403 (non-admin) / 200 (admin) across protected routes; `PATCH /listings/:id/status` user→403, admin→200; public feed open.
- Browser (0 console errors): public browse with no token; JWT stored on login; admin dashboard + stats load; **session survives reload via `/auth/me`**; admin approve authorised; logout clears the token.

### Notes
- No refresh-token rotation yet; tokens expire per `JWT_EXPIRES_IN` (default 7d). On a 401 the UI surfaces the error and rehydration clears an expired token.

---

## 2026-06-16 — Phase 5.2.4 (cont.): Admin Dashboard Integration

Extended the admin panel into a full dashboard — added statistics and a users view, and made counts refresh automatically after actions. (Approve/reject listings + business, featured requests, pending queue, and status updates landed in the first 5.2.4 entry below.)

### Added
- **Statistics** — `GET /api/stats` (aggregate counts: users; listings total/pending/approved/rejected/sold/featured; business total/pending). Rendered as stat cards atop the admin dashboard.
- **Users view** — new **Users** tab (`GET /users`) listing every account with role / account-type / verification tags (read-only).
- `adminApi.getStats()` + `adminApi.listUsers()`.

### Changed
- Admin dashboard now loads stats + listings + business + users in parallel, with loading/empty/error states across all tabs.
- **Counts update automatically**: after approving/rejecting a listing or business application, the stat cards re-fetch (pending ↓, approved ↑) and the row leaves its queue. Approved listings appear in the public feed on next load.

### Verified (headless browser, 0 console errors)
- Stats render (Users 4 / Pending 1 / Featured 1); Users tab lists accounts incl. the admin; approving a listing moves Pending 1→0 and Approved 3→4 live.

---

## 2026-06-16 — Phase 5.2.4: Admin Moderation UI

Added an admin panel so pending listings (and business applications) can be approved, completing the create → approve → public loop.

### Added
- **`/admin` page** (`AdminPage.jsx` + `.css`) — admin-only moderation panel with two tabs:
  - **Listings**: pending listings with **Approve**, **Feature** (only when `featuredRequested` — approves + activates featured), and **Reject** actions (`PATCH /listings/:id/status`).
  - **Business**: pending business applications with **Approve** / **Reject** (`PATCH /business-accounts/:id/decision`; approval flips the owner's `businessVerified`).
  - Optimistic row removal, flash confirmations, tab counts, and loading / empty / error states (reuses `LoadingState`).
- **`src/services/adminApi.js`** — moderation API calls.
- **`RequireAdmin`** route guard in `App.jsx` — requires auth **and** `user.role === 'admin'`; non-admins redirect to `/`.
- **Navbar** — an **Admin** link (desktop + mobile) shown only to admins.
- **Backend**:
  - `User.role` column (`user` | `admin`, default `user`) — migration `add_user_role`.
  - `GET /api/business-accounts?approved=true|false` — list endpoint for the admin queue.
  - Seed now creates an **admin** user (`admin@malircantt.pk` / `admin123`).

### Verified (headless browser, 0 console errors)
- Non-admin (resident) is redirected away from `/admin`; admin sees the nav link and the panel.
- Approving a pending listing removes it from the queue (and it becomes public); approving a pending business removes it from its queue.

### Notes
- The moderation endpoints are **UI-gated** (the route + nav check the role); the backend doesn't enforce the admin role yet because there are no auth tokens. Add server-side role checks when JWT sessions land.

---

## 2026-06-16 — Phase 5.2.3: Create Listing Integration

Finished wiring Add Listing to the backend. Most of the submit path landed in 5.2.2 (the create `POST`); this phase adds draft persistence, the success confirmation, and fixes the Jobs image cap. **UI preserved.**

### Added
- **Draft persistence** — the form (text fields + category-specific fields + listing tier) is saved to `localStorage` (`malir-listing-draft`) on every change and restored on reload/navigation; cleared on successful submit. Images aren't drafted (can't serialise file objects). The category-reset effect now skips its first run so a restored draft survives mount.
- **Success confirmation** — on submit the page now shows the existing (previously unused) `.add-listing__success` screen: a checkmark, "Listing submitted — **pending approval**", and **View Listing** + **Post Another** actions, instead of navigating away immediately. `handlePostAnother` resets the form.

### Changed
- **Jobs images 0–10** — `categoryConfig` Jobs `images.max` raised from **1 → 10** (Jobs/Services are both now 0–10 optional; everything else stays 1–10). Backend already permitted this.
- `AddListingPage` submit `await`s `addListing` (API `POST`, status `pending`); removed the now-unused `useNavigate`.

### Already in place (from 5.2.2 / earlier, verified this phase)
- Submit → `POST /listings`; client-side category-specific validation; featured chooser → `featuredRequested`; Services gated to approved business accounts with a "Apply for Business" upgrade modal for personal accounts.

### Verified (headless browser, signed-in seeded user)
- Jobs photos optional + "up to 10"; draft restored after reload; full vehicles submit → success screen shows "pending approval" with View Listing / Post Another; draft cleared after submit — **all pass, 0 console errors**.

---

## 2026-06-16 — Phase 5.2.2: Listings Integration

Replaced mock listings with backend data across the read paths. **UI preserved** — components are unchanged in look; only the data source moved (mock/localStorage → API), via an adapter that maps the backend shape to the shape the components already expect.

### Added
- **`src/services/listingsApi.js`** — `list(filters)` / `get(id)` / `create(payload)`.
- **`src/services/listingAdapter.js`** — `adaptListing`/`adaptListings`: backend → legacy UI shape (slug→display category, int→`Rs …` price + `priceRaw`, `createdAt`→`timeAgo`, `featuredActive`→`featured`, images, and a `seller` object derived from the listing's `user`).
- **`src/components/LoadingState.jsx` (+ `.css`)** — reusable centered spinner used by all listing pages (respects reduced-motion).

### Changed
- **`ListingsContext`** — API-backed. `useListings()` now exposes `{ allListings, loading, error, refresh, getListing, addListing }`. `allListings` = **approved** listings (`GET /listings?status=approved`), fetched on mount and adapted. `getListing(id)` fetches a single listing (any status). `addListing` is now **async** and `POST`s to the backend (returns the adapted, pending listing).
- **Homepage** (`FeaturedListings`) — backend-driven; **featured ads first, then standard** (capped 8); loading + empty states.
- **`ListingDetailPage`** — fetches the listing by id from the backend (works for an owner's own pending listing); loading + not-found states; images / seller / category / price / description all from the API.
- **`CategoryPage`** — filters approved listings by category; loading + error states alongside the existing empty state.
- **`AllListingsPage`** — search/filter/sort now run over backend-sourced listings; loading + error states.
- **`SellerProfilePage`** — loading state added so it no longer flashes "Seller Not Found" before data loads.
- **`AddListingPage`** — `await addListing(...)` (now an API POST); shows an inline error if posting fails.
- **Backend** — `listings` list + detail endpoints now return a richer `seller` select (name, phone, accountType, businessVerified, residentLocation, createdAt) so cards / detail / seller profile have everything the UI needs.

### Notes
- New listings are created with `status: 'pending'` (admin approval model) — they appear on their own detail page immediately but not in public feeds until approved. Featured is request-only (never auto-activated).
- Search remains client-side over the approved set (no server-side text search yet). `views` aren't tracked by the backend yet (shown as 0).
- `src/data/listings.js` is now unused (kept as a seed reference). **Requires the backend running.**
- Verified with a headless-browser smoke test (homepage featured-first, vehicles category, jobs empty state, search, listing detail, seller profile) — all pass, **0 console errors**.

---

## 2026-06-16 — Phase 5.2.1: Authentication Integration

Connected the existing auth UI to the Phase 5.1 backend. **No UI redesign** — same pages, same styling; only the data flow changed (mock/localStorage → API).

### Added
- **`src/services/apiClient.js`** — `fetch` wrapper; base URL from `VITE_API_URL` (default `http://localhost:4000/api`); throws `ApiError` carrying `{ message, status, fields }`; friendly message on network failure.
- **`src/services/authApi.js`** — typed auth/user endpoint methods.
- **Root `.env`** — `VITE_API_URL`.
- **Backend** — `POST /api/auth/resend-verification` (re-issue an email code) so the existing "Resend code" button works against the API. (validator + controller + route)

### Changed
- **`AuthContext`** — rewritten to be API-backed. Async actions (`login`, `register`, `verifyEmail`, `resendVerification`, `requestPasswordReset`, `resetPassword`, `logout`) that throw `ApiError`. Session persistence stores **only the user id** (`malir-session`) and re-fetches via `GET /users/:id` on load (4xx clears it; network error keeps it for retry). `profile` is derived from the API user into the legacy shape via `toProfile()` so ProfilePage / DashboardPage / AddListingPage are untouched; blank profile when logged out (no crash). `updateProfile` maps edits → `PATCH /users/:id`.
- **`LoginPage`** — every flow now calls the API (UI unchanged):
  - **Registration** (Personal + Business) → `POST /auth/register` with name/email/password/phone/cantt-pass/resident-location/account-type; server field errors mapped back to the right inputs; general errors shown inline.
  - **Email verification** → `EmailVerificationScreen` verifies via `POST /auth/verify-email` (injected `onVerify`), which signs the user in; "Resend code" hits `resend-verification`; the dev-code hint now shows the backend-returned code.
  - **Sign In** → `POST /auth/login`; persists session; redirects to `?redirect=…`; invalid credentials shown inline.
  - **Forgot password** → `request-password-reset` → capture code → `reset-password` (code validated with the new password); errors surfaced in the reset form.
  - Personal signup + verification auto-signs-in and redirects; Business ends on the existing **Pending Approval** screen (now also signed in).
- **`Navbar`** — shows a **Logout** button (reusing `navbar__join-btn` styling) when authenticated, in both desktop actions and the mobile menu; `logout()` clears the session and returns home.

### Removed
- Mock auth: the `malir-auth` flag and `malir-profile` object, and `LoginPage`'s dependency on `emailService` / local code generation (the `VerifiedSuccess` dead screen and unused `generateCode` helper were dropped).

### Notes
- **Requires the backend running** (`cd server && npm run dev`) plus `npm run dev` for the frontend. CORS is open on the API.
- No JWT yet — session is the persisted user id; swap to a token in a later phase without changing the UI. Sign-in is by email (the "Email or Phone" field is treated as email for now).

---

## 2026-06-16 — Phase 5.1: Database Foundation

### Added
- **`/server`** — self-contained Node + Express + Prisma (SQLite) backend. Replaces mock/localStorage data with a real, relational data layer. **Frontend is untouched** — this phase is the data model + API surface only, ready for wiring in Phase 5.2.
  - **Prisma schema** (`server/prisma/schema.prisma`) — 6 models with snake_case columns/tables (`@map`/`@@map`) and camelCase JS: `User`, `Listing`, `ListingImage`, `BusinessAccount`, `EmailVerificationCode`, `PasswordResetCode`. Indexed FKs; cascade delete on listing images.
  - **Relationships** — User 1—N Listing, Listing 1—N ListingImage (cascade), User 1—1 BusinessAccount; verification/reset codes keyed by email.
  - **Validation** (`zod`) — including the image-count rule (min 1 for all categories except `jobs`/`services`, max 10), enum-value checks (account type, listing status, payment status), phone/email/password formats. Failures → `422 { error, fields }`.
  - **REST API** — `/api/auth/*` (register, verify-email, login, request/reset password), `/api/users`, `/api/listings` (+`/status`), `/api/business-accounts` (+`/decision`), `/api/health`.
  - **Security/architecture** — bcrypt password hashing, centralized error handler (maps Prisma P2002/P2025/P2003), async wrapper, graceful shutdown, app/server split for testability.
  - **Seed** (`server/prisma/seed.js`) — 3 users (personal + approved business + pending business), 4 listings (incl. imageless Jobs/Services exercising the rule), 2 business accounts, a live verification code. Demo login: `ahmed.khan@example.com / password123`.
  - **`server/README.md`** — setup, data model table, endpoint list, and Phase 5.2+ integration notes (JWT, email provider, image storage, frontend wiring).
  - **Safe `postinstall`** (`server/scripts/postinstall.js`) — auto-runs `prisma generate` on `npm install` so new local/CI environments are ready immediately; skips gracefully when the schema or the `prisma` CLI is absent (e.g. `npm ci --omit=dev`), never fails the install, resolves the local binary (cross-platform), and honours `SKIP_PRISMA_GENERATE=1`.
- Verified end-to-end: migrate + seed, image-count enforcement (vehicle-no-image → 422, jobs-no-image → 201), register→verify→login, and business approval flipping `businessVerified`.

### Notes
- SQLite for local dev; switch to Postgres by changing the Prisma `provider` + `DATABASE_URL` (string status/type fields can then become native enums).
- No payment gateway — `payment_status` mirrors the frontend's `not_required|unpaid|paid` model; approval still gates activation.

---

## 2026-06-16 — Phase 4.4.5: Final UI Polish Before Phase 5

### Added
- **Protected Add Listing route** — `/add-listing` now requires authentication
  - `RequireAuth` wrapper in `App.jsx` redirects unauthenticated users to `/login?redirect=/add-listing`; guards every entry point (navbar desktop + mobile CTA, category empty-state CTA, direct URL)
  - `AuthContext` gained a real `isAuthenticated` flag (persisted to `localStorage` under `malir-auth`) plus `login()` / `logout()`, replacing the hardcoded `isAuthenticated: false`
  - `LoginPage` reads `?redirect=…`; the Sign In form performs a mock login via `login()` and navigates back to the redirect target (falls back to `/`). Replaces the old "Authentication coming soon" sign-in notice with a working flow
- **Branded placeholder cards for image-optional categories** — Jobs & Services listings with no photo render a premium gradient panel instead of an empty image box
  - `ListingCard` renders `ListingPlaceholder` when `!listing.image` and `categorySlug` is `jobs` or `services`: uppercase tagline ("Job Opening" / "Service"), green-tinted icon tile (briefcase / service icon), and a pill showing the job type (`condition`) / service type (`serviceType`)
  - Panel is `position: absolute; inset: 0` inside the same 4:3 `.listing-card__image-wrap`, so card heights, grid alignment, hover lift, and the Featured badge + save button overlay stay identical with or without a photo
  - Required-image categories (Vehicles, Property, Technology, Shoes, Gym) keep the existing `<img>` behaviour

### Changed
- **SellerProfilePage spacing** — profile card padding increased to `32px/40px` desktop (`--space-8 --space-10`) and `24px` mobile so the avatar and Contact Seller button no longer touch the card edges and align with the content; wrapped mobile top row gains a `--space-5` gap

### Architecture
- Authentication remains mock, but `isAuthenticated` is now genuine, persisted state — the migration path to a real session token is a single swap in `AuthContext`. Only `/add-listing` is gated for now (per scope); other account pages are left open
- Image-optional fallback is contained entirely in `ListingCard` (same DOM structure), so no page or grid needed changes to stay visually consistent

---

## 2026-06-15 — Phase 4: Seller Contact, Smart Discovery, Premium Infrastructure & UI Polish

### Added
- **Phase 4.1 — Seller Contact System** — premium seller contact on `ListingDetailPage`
  - Enhanced seller card: account-type pill (Personal/Business), verification badge, area row (pin icon), member-since row (calendar icon)
  - Two primary contact buttons: **💬 WhatsApp Seller** (opens `wa.me` with a pre-filled "Is this still available?" message; `toWhatsAppNumber()` converts local `03XX-XXXXXXX` → `92XXXXXXXXXX`) and **📞 Call Seller** (preserves the existing phone-reveal → Call/Copy privacy gate)
  - WhatsApp button uses the recognisable WhatsApp brand green (`#25d366`) — a scoped, trust-building exception to the single-accent rule
- **Phase 4.3 — Smart Discovery** — recently-viewed + related listings, refactored to be reusable and backend-ready
  - **`src/services/recentlyViewedService.js`** — centralises all recently-viewed logic (`get`/`add`/`clear`); dedupe + move-to-front on revisit; cap raised to **20**. Removed the duplicated logic previously living in both `ListingCard` and `RecentlyViewed`
  - **`RelatedListings.jsx` + `.css`** — reusable **"You May Also Like"** section; same-category only (`categorySlug` match, excludes self); replaces the inline "More in {category}" block on `ListingDetailPage` (CSS moved over 1:1, visuals unchanged)
- **Phase 4.4 — Premium Marketplace Infrastructure** — business accounts, featured listings, verification badges, admin-ready states (no payments)
  - **`src/data/premiumConfig.js`** — single source of truth: `APPLICATION_STATUS`, `PAYMENT_STATUS`, `PREMIUM_TYPE`, `ACCOUNT_TYPE`, `LISTING_TIER`, `BADGE_TYPE`, benefit lists, `PRICING` (+`getFee()`), `createPremiumRequest()`, and `SPONSORED_*` placeholders
  - **`src/services/premiumService.js`** — pure, admin-ready state transitions: `approveRequest`, `rejectRequest`, `markPaid`, `isPremiumActive`, `applyFeaturedDecision`, `applyBusinessDecision`
  - **`VerifiedBadge`** extended to 3 kinds: ✓ Email Verified, 🏠 Verified Resident, 🏢 Verified Business (sellers are never "featured" — only listings can be)
  - **`BusinessBenefitsCard.jsx`** + **`FeaturedListingOption.jsx`** — reusable components (benefits card on the Business signup form; Standard/Featured chooser on Add Listing)
  - **AddListingPage** — Services category gated to **approved** business accounts; added the Listing Visibility (Standard/Featured) card
  - **LoginPage** — `?register=business` deep link opens Register → Business; business signup shows benefits card and ends in a **Pending Approval** state via `applyForBusiness()`
  - **SellerProfilePage** — evenly-distributed Total/Active/Sold stats; contact action vertical alignment fixed

### Changed
- `ListingsContext.addListing` — standard listings stay free + instant; featured selections record a structured `featuredRequest` (pending) but **never auto-activate** `featured`
- `AuthContext` — business applications stored as a structured `businessRequest` (same shape as featured); `isApprovedBusiness` derived via `isPremiumActive` (approved **and** payment-settled)
- `BusinessRequiredModal` — copy set to "This category is reserved for verified business accounts. Apply for Business verification to access this category."; primary action → `/login?register=business`

### UI fixes (post-Phase-4 polish)
- Hero **"POPULAR:" label** — was barely legible over the photo (`rgba(255,255,255,0.65)`); now bold uppercase white with a subtle text-shadow
- **SellerProfilePage stats** — reworked from left-packed to evenly-distributed, centered 3-column (Total/Active/Sold) with vertically-centred dividers
- **SellerProfilePage Contact Seller** — removed the `padding-top` hack; the action is now vertically centred in the header row (`align-self: center`)
- **Removed the "Featured Seller" concept** — only listings can be featured, not sellers; dropped `BADGE_TYPE.FEATURED`, the badge variant, and its SellerProfilePage usage
- **Removed the navbar desktop search** (toggle next to favourites + slide-down panel + related state/CSS) — the hero/page search is the single search entry point; mobile-menu search retained
- **SellerProfilePage header polish** — avatar + contact action vertically centred on desktop (top-aligned on mobile) so they no longer hug the card corners; revealed phone number is now a contained surface panel (border + radius) instead of floating text on the edge

### Architecture
- **Payment is separated from approval**: every premium request carries two independent gates — `approvalStatus` (always required) and `paymentStatus` (`not_required` until billing is enabled). A feature activates only when `isPremiumActive` (approved **and** settled) — so future payments unlock processing without bypassing admin approval
- Featured listings and business applications share **one request shape** (`createPremiumRequest`) so a future admin panel / backend handles both identically
- Recently-viewed and related-listings logic extracted into reusable service/component modules with documented backend-migration paths

---

## 2026-06-15 — Smart Filters, Sorting & Seller Profiles

### Added
- **Phase 3.2 — Smart Filters** — collapsible filter panel in AllListingsPage (animated height via `AnimatePresence`); toggled by a "Filters (N)" button in the toolbar that shows an active-filter count badge
  - **Price range** — min/max number inputs applied via `priceRaw`; strips commas before parsing
  - **Location filter** — text input, substring-matches `listing.location`
  - **Category-specific filters** — appear dynamically when a category is selected; each category has its own field set: Vehicles (Year, Fuel Type, Transmission), Property (Type, Bedrooms), Shoes (Size EU, Condition), Gym (Equipment Type, Condition), Jobs (Job Type, Experience), Services (Service Type)
  - **Active filter chips row** — animates in below the panel; each chip removes its own filter on click; "Clear all" chip appears when 2+ filters are active
  - **`CAT_FILTER_CONFIG`** object in `AllListingsPage.jsx` — single source of truth for which filter fields each category exposes; `useEffect` resets category filters when the selected category changes
  - **Category-specific data fields** added directly to all 32 listings in `listings.js`: `year`, `fuel`, `transmission` (Vehicles); `bedrooms`, `listingType` (Property); `shoeSize` (Shoes); `equipmentType` (Gym); `experienceLevel` (Jobs); `serviceType` (Services)
- **Phase 3.3 — Sorting** — both `AllListingsPage` and `CategoryPage` now share 6 sort options: Newest (id desc), Oldest (id asc), Price Low to High, Price High to Low, Most Popular (views desc), Recently Added (timeAgo asc)
  - `parseTimeAgo()` helper converts "3 hours ago" / "2 days ago" strings to minutes for comparison — makes "Recently Added" distinct from "Newest" (id-based)
  - `CategoryPage` previously treated "Newest" as a no-op catch-all; now explicitly sorts by `b.id - a.id`; all 6 options wired in
- **Phase 3.4 — Seller Profiles** — public seller profile page at `/seller/:sellerName` (`SellerProfilePage.jsx` + `SellerProfilePage.css`)
  - **Profile card**: 72px dark-green avatar circle with initials; name + `VerifiedBadge` (md); meta pills for Account Type, Area, Member Since, Business Category (business accounts); Contact Seller button with same phone reveal pattern as ListingDetailPage (phone → Call + Copy)
  - **Stats row**: Total Listings / Active / Sold — divider-separated; ink / primary green / gold colouring
  - **Listings grid**: all seller's listings from `useListings()` (picks up user-submitted listings too) in stagger-animated `cat-grid`
  - **Graceful 404**: if no listings found for decoded seller name, shows "Seller Not Found" + Browse CTA
  - **Entry point**: "View Profile →" link added to `ListingDetailPage` seller card (below badge); navigates to `/seller/[encodeURIComponent(name)]`

### Changed
- `SORT_OPTIONS` labels renamed across both listing pages: "Newest First" → "Newest", "Oldest First" → "Oldest", "Most Viewed" → "Most Popular"
- `cat-toolbar__controls` CSS class replaces the inline `style={{ display: 'flex', gap: '12px' }}` wrapper in AllListingsPage toolbar
- `ListingDetailPage` seller card now includes `.detail__seller-profile-link` ("View Profile →") below the member-since and badge, before the divider

### Architecture
- Category-specific filter data lives directly on listing objects as plain properties (not inside a `meta` array) so `AllListingsPage` can filter with simple `l[key]` access — no join to `categoryConfig.js` required at query time
- `SellerProfilePage` derives all seller information from `allListings` (filtered by `seller.name`); no separate seller entity or API needed with mock data
- Business category on seller profile is inferred from the seller's first listing's `category` field, not stored separately

---

## 2026-06-14 — User Account Pages, Login Flow & Advanced Search

### Added
- **Phase 4E — Login / Register UI**: two-tab LoginPage (Sign In + Create Account); `RegisterPanel` with `AccountTypePicker` (Personal vs Business visual card grid) → step 2 `PersonalForm` or `BusinessForm`; `AnimatePresence mode="wait"` between steps; `PasswordField` with show/hide toggle; `MockSuccess` confirmation component; Cantt Pass hint box for resident verification badge
- **Phase 2.1 — Dashboard**: `DashboardPage` at `/dashboard`; card grid linking to My Listings, Saved Listings, Profile; quick-stats strip; links wired to real destination pages
- **Phase 2.2 — My Listings**: `MyListingsPage` at `/my-listings`; mock listings with `status` field (`active`/`sold`/`hidden`); per-card actions (Edit → `/add-listing`, Mark as Sold, Hide, Delete with two-step confirm); stats strip (Total / Active / Sold); filter tabs (All / Active / Sold / Hidden); `StatusBadge` sub-component; stagger animation
- **Phase 2.3 — Saved Listings**: `SavedListingsPage` at `/saved-listings`; reads live data from `FavoritesContext`; 3-col `SavedCard` grid (16:9 image, category pill overlay, seller name, View Listing + Remove actions); `AnimatePresence mode="popLayout"` removal animation; empty state with Browse CTA
- **Phase 2.4 — Profile Management**: `ProfilePage` at `/profile`; view/edit mode toggle; `AuthContext` extended with `updateProfile` + localStorage persistence under `malir-profile`; Personal Info, Business Profile (conditional), Account Info sections; email verified chip; success banner; `prf-card--editing` CSS class drives all input style changes without per-field JS state
- **Phase 3.1 — Advanced Search**: desktop search panel in Navbar (animated height, pre-fills from URL `?q=`); mobile search input in mobile menu; inline search form in AllListingsPage hero; real-time `localQuery` state for instant filtering, `setSearchParams` on submit for URL persistence; seller name + location included in search scope; `showSeller` prop on `ListingCard`; improved empty state with dual CTAs

### Changed
- `AuthContext` lazy-initialises `profile` from localStorage (`malir-profile`); `DEFAULT_PROFILE` provides baseline values including `email`, `joinDate`; `updateProfile(changes)` merges and persists
- `DashboardPage` cards link to real routes (`/my-listings`, `/saved-listings`, `/profile`) instead of placeholder hrefs

### Architecture
- Provider tree order confirmed: `BrowserRouter` → `AuthProvider` → `ListingsProvider` → `FavoritesProvider` → `App`; `AuthProvider` must be outermost context so all inner providers can call `useAuth()`
- `SavedListingsPage` coexists with `FavoritesDrawer` — both read from `FavoritesContext`; drawer accessible via navbar heart icon, page accessible via dashboard; no duplication of state
- Profile edit mode uses CSS cascade (`.prf-card--editing` parent class) rather than per-field `isEditing` boolean — one class toggle changes all child input styles

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
