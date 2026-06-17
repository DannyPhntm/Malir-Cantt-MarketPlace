# Malir Cantt Marketplace — Backend (Phase 5.1)

Self-contained Node + Express + Prisma backend that replaces the frontend's
mock/localStorage data with a real database foundation. **The frontend is not
wired to this yet** — Phase 5.1 is the data layer + API surface only.

## Stack

- **Express** — HTTP API (`/api`)
- **Prisma ORM** — schema, migrations, type-safe queries
- **SQLite** for local dev (`dev.db`) — switch to Postgres by changing the
  `provider` in `prisma/schema.prisma` and `DATABASE_URL` in `.env`
- **zod** — request validation
- **bcryptjs** — password hashing

## Setup

```bash
cd server
npm install       # postinstall auto-runs `prisma generate` (see below)
npm run setup     # prisma migrate dev --name init + generate + seed
npm run dev       # start API on http://localhost:4000
```

Other scripts: `npm run migrate`, `npm run seed`, `npm run studio` (Prisma Studio GUI).

### Prisma Client generation (postinstall)

`npm install` triggers `scripts/postinstall.js`, which runs `prisma generate`
**safely** — it never fails the install:

- Skips when `prisma/schema.prisma` is missing.
- Skips when the `prisma` CLI isn't installed (e.g. production `npm ci --omit=dev`),
  logging a reminder to generate during the build instead.
- On any generate error it warns and continues (run `npm run generate` afterwards).
- Opt out entirely with `SKIP_PRISMA_GENERATE=1` (handy for CI that generates in a
  dedicated step).

For production: install with dev dependencies during the **build** stage (so the
CLI is present and the client is generated), e.g. `npm ci && npm run generate`
before pruning — or keep the build image's `node_modules` and run `npm start`.

## Data model

| Table | Key fields | Relationships |
|-------|-----------|---------------|
| `users` | name, email (unique), password_hash, phone, cantt_pass_number, resident_location, account_type, business_verified, email_verified | 1—N `listings`, 1—1 `business_accounts` |
| `listings` | user_id, title, description, category, price, featured_requested, featured_active, status | N—1 `users`, 1—N `listing_images` |
| `listing_images` | listing_id, image_url, display_order | N—1 `listings` (cascade delete) |
| `business_accounts` | user_id (unique), business_name, payment_status, approved | 1—1 `users` |
| `saved_listings` | user_id, listing_id (unique pair) | N—1 `users`, N—1 `listings` (cascade) |
| `email_verification_codes` | email, code, expires_at, verified | keyed by email |
| `password_reset_codes` | email, code, expires_at, used | keyed by email |

**Image rule** (enforced in `src/validators/schemas.js`): min 1 image for all
categories **except** `jobs` and `services`; max 10.

**Allowed values** (`src/lib/constants.js`): account types `personal|business`;
listing status `pending|approved|rejected|sold`; payment status
`not_required|unpaid|paid`. SQLite has no enums, so these are validated in the
app layer; on Postgres they can become native enums.

## API endpoints

Access: 🔓 public · 🔑 any authenticated user · 🛡️ admin only.

```
GET    /api/health                        🔓

POST   /api/auth/register                 🔓 create user (+ business row), issue email code
POST   /api/auth/verify-email             🔓 { email, code } -> emailVerified (+ token)
POST   /api/auth/login                    🔓 { email, password } -> { user, token }
POST   /api/auth/request-password-reset   🔓 { email }
POST   /api/auth/reset-password           🔓 { email, code, password }
GET    /api/auth/me                        🔑 current user from bearer token

GET    /api/users                         🛡️ list users
GET    /api/users/:id                      🔑 self or admin
PATCH  /api/users/:id                      🔑 self or admin

GET    /api/listings?category=&status=&userId=&featured=   🔓
GET    /api/listings/mine                  🔑 owner's listings (all statuses)
GET    /api/listings/:id                   🔓 (pending/hidden/rejected → 404 unless owner/admin)
POST   /api/listings                       🔑 create (owner = token; validates image count)
PATCH  /api/listings/:id                   🔑 owner or admin
PATCH  /api/listings/:id/status            🛡️ status + featuredActive
DELETE /api/listings/:id                   🔑 owner or admin (cascades images)

GET    /api/saved                          🔑 user's saved listings (full data)
POST   /api/saved                          🔑 { listingId } save (idempotent)
DELETE /api/saved/:listingId               🔑 unsave (idempotent)

GET    /api/stats                          🛡️ dashboard aggregate counts
GET    /api/business-accounts?approved=    🛡️ admin queue
POST   /api/business-accounts              🔑 apply (owner = token; never auto-approved)
GET    /api/business-accounts/:id          🔑
PATCH  /api/business-accounts/:id/decision 🛡️ approve/reject + payment
```

Auth: send `Authorization: Bearer <token>` (from login / verify-email). Missing
token → `401`; wrong role → `403`. Validation failures → `422 { error, fields }`;
conflicts → `409`; missing records → `404`.

## Notes for future integration

- **Auth**: JWT issued on login/verify-email (`src/lib/jwt.js`), verified by
  `requireAuth` / `requireRole` middleware (`src/middleware/auth.js`). `JWT_SECRET`
  + `JWT_EXPIRES_IN` in `.env` — set a strong secret in production. (No refresh
  tokens / rotation yet.)
- **Email/SMS**: verification + reset codes are generated and stored; the code is
  returned in the response for dev parity with the mock UI. Swap in a real email
  provider in `auth.controller.js` and stop returning the code.
- **Image storage**: `listing_images.image_url` holds a URL. Point it at S3 /
  Supabase Storage / Cloudinary; the upload endpoint slots in front of
  `createListing`.
- **Frontend wiring**: replace `ListingsContext` / `AuthContext` localStorage
  reads with `fetch` calls to these endpoints — no UI changes required.
