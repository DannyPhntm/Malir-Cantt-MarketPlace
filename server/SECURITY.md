# SECURITY.md — Agency Security & Safety Rules

This file applies to all agency projects, client projects, and internal products.

Claude, Daniyal, and Affan must follow these rules unless Daniyal explicitly approves an exception.

## Highest Priority Rules

- Do not expose secrets.
- Do not commit `.env` files.
- Do not print API keys, JWT secrets, database URLs, tokens, passwords, or private credentials.
- Do not rewrite entire files unless explicitly requested or absolutely necessary.
- Do not delete, overwrite, or restructure important existing code without explaining why.
- Do not merge pull requests automatically unless Daniyal explicitly says to merge.
- Do not push directly to `main` unless explicitly approved.
- Do not make destructive production data changes unless explicitly approved.
- Do not weaken validation, authentication, authorization, or admin protections.
- Do not remove existing working features while fixing another issue.

## File Editing Rules

Claude must preserve existing work.

Before editing:
1. Inspect the relevant files.
2. Understand the current behavior.
3. Identify the smallest safe change.
4. Explain the plan if the task is large or risky.

When editing:
- Prefer targeted edits.
- Preserve existing functions, imports, styles, and logic where possible.
- Do not replace a full file just because it is easier.
- Do not remove code unless it is proven unused, broken, or explicitly requested.
- Do not rename fields/routes/components casually.
- Do not change database schema without explaining migration impact.
- Do not change public API shapes unless necessary and documented.

If a full-file rewrite is needed:
- Ask for confirmation first.
- Explain why partial editing is not safe.
- Confirm what behavior will be preserved.
- Run tests/build after.

## Git / GitHub Rules

- Work on a branch per task.
- Use clear branch names:
  - `feat/...`
  - `fix/...`
  - `chore/...`
  - `docs/...`
- Open a PR to `main`.
- Do not merge without explicit approval.
- Do not auto-merge because tests passed.
- Before merge, report:
  - changed files
  - tests run
  - migration status
  - deployment steps
  - risks/blockers
- If multiple PRs touch the same files, verify merge order first.
- If conflicts exist, resolve carefully and re-run checks.
- Never hide merge conflicts or pretend a PR is clean.

## Production Data Rules

Do not directly edit production data unless explicitly approved.

Forbidden without explicit approval:
- deleting users
- deleting businesses
- deleting shops
- deleting listings
- changing admin roles
- changing verification status
- modifying payment/waiver status
- running destructive cleanup scripts
- editing production database manually

If a script may affect production:
- first run dry-run mode
- report exactly what would change
- wait for approval
- then run with destructive flags only if approved

## Secrets Rules

Never commit or print:

- `.env`
- Railway secrets
- Vercel env vars
- Neon database URLs
- Resend API keys
- Cloudinary URLs
- JWT secrets
- GitHub tokens
- OAuth/client secrets
- email passwords
- client credentials
- private customer data

Allowed:
- `.env.example` with placeholder values only
- documentation listing variable names only

Example safe documentation:

```text
DATABASE_URL=<your database url>
JWT_SECRET=<long random secret>
cat > SKILLS.md <<'EOF'
# SKILLS.md — Claude Skills Guide

This file documents the Claude skills available to Daniyal/Affan and when Claude should use them across agency projects.

Claude should use the best-fit skill only when it clearly improves the task. Do not invoke many skills at once. Do not use a skill just because it exists.

## Core Rule

Pick skills by task.

- For existing UI improvement: use `redesign-skill` or `soft-skill`.
- For UI/accessibility review: use `web-design-guidelines`.
- For planning: use `superpowers:writing-plans`.
- For big complete code/document generation: use `output-skill`.
- For brand/identity work: use `brandkit`.
- For image-generation tasks: use image skills only when image backend is available.

Skills should never override project security rules in `SECURITY.md`.

## Design — Build / Apply Taste

Use these when creating or styling UI.

### soft-skill

High-end agency look: exact fonts, spacing, shadows, card structure, animation, and avoidance of cheap AI defaults.

Best for:
- making a page feel expensive
- premium UI polish
- layout/spacing improvements
- general visual refinement

### taste-skill

Anti-slop frontend for landing pages, portfolios, redesigns, and design-system-aware UI work.

Best for:
- landing pages
- redesigns
- portfolio-style pages
- improving generic AI-looking layouts

Note:
`taste-skill-v1` is legacy. Use only for exact backward compatibility.

### gpt-tasteskill

UX/UI + advanced GSAP motion skill.

Best for:
- marketing pages
- AIDA landing page structure
- editorial typography
- bento grids
- ScrollTrigger motion
- pinning/scrubbing effects

Use only when motion-heavy marketing work is requested.

### emil-design-eng

Emil Kowalski-style UI polish and animation philosophy.

Best for:
- easing decisions
- micro-interactions
- component craft
- premium animation decisions

### minimalist-skill

Clean editorial, warm monochrome, flat bento, muted pastels, no gradients/heavy shadows.

Best for:
- clean luxury/editorial sites
- calm modern designs
- minimal product pages

### brutalist-skill

Raw Swiss-print + military-terminal aesthetic.

Best for:
- data-heavy editorial pages
- declassified blueprint style
- rigid grids
- extreme type contrast

Use only when this aesthetic is explicitly desired.

### redesign-skill

Upgrade an existing site/app to feel premium while preserving functionality.

Best for:
- improving existing UI
- fixing generic AI-looking pages
- marketplace UI polish
- responsive spacing issues
- preserving existing logic while improving visuals

For Malir Cantt Bazaar, this is the default UI improvement skill.

### stitch-skill

Generates an agent-friendly `DESIGN.md` with typography, color, layout, and motion standards for Google Stitch.

Best for:
- preparing a design system file
- creating design instructions for future agents

## Review / Audit Skills

Use these when checking existing UI or motion quality.

### web-design-guidelines

Audits UI code against Vercel Web Interface Guidelines, accessibility, UX, and best practices.

Best for:
- “review my UI”
- “check accessibility”
- “audit this page”
- finding usability issues

Argument hint:
Use with a file path or pattern when available.

### review-animations

Strict animation/motion code review against Emil’s craft bar.

Important:
This is user-invoked only. Do not invoke automatically if skill metadata disables model invocation.

Best for:
- reviewing motion quality
- checking if animations feel premium
- validating easing/timing/micro-interactions

## Image Generation Skills

These need the Higgsfield MCP/image backend. They produce images, not code.

### imagegen-frontend-web

Creates premium website design references.

Best for:
- one horizontal image per website section
- visual references for web pages
- pre-build design exploration

### imagegen-frontend-mobile

Creates app-native mobile screen concepts inside phone mockups.

Best for:
- mobile app concepts
- mobile UI direction
- phone screen references

### image-to-code-skill

Generates design image(s), analyzes them, then builds the site to match.

Best for:
- image-first web design workflow
- matching a generated visual direction in code

### brandkit

Creates brand guideline boards, logo systems, identity decks, and premium mockups.

Best for:
- agency identity
- client brand identity
- logo systems
- brand guideline decks
- case study visuals

## Planning Skills

Superpowers plugin skills are process skills. Use for thinking and execution structure.

### superpowers:brainstorming

Turns an idea into a design/spec before building.

Best for:
- early-stage product ideas
- unclear feature direction
- client strategy sessions
- agency service ideas

### superpowers:writing-plans

Creates detailed task-by-task implementation plans.

Best for:
- complex feature planning
- security audits
- multi-step implementation
- breaking large tasks into safe phases

### superpowers:subagent-driven-development

Use when a complex plan benefits from subagent-style task execution.

Best for:
- larger multi-file implementation tasks
- parallelizable work
- structured development

### superpowers:executing-plans

Use when executing an already-written plan.

Best for:
- turning a detailed plan into implementation
- following a verified checklist

## Utility Skills

### extract-design-system

Reverse-engineers a public site's design tokens into starter files.

Important:
This runs `npx extract-design-system <url>` and downloads Chromium. It executes third-party code.

Rule:
Ask the user for confirmation before using.

Best for:
- extracting design tokens from a public site
- analyzing a design system
- creating starter theme files

### output-skill

Anti-truncation skill for complete, unabridged code output.

Best for:
- large complete files
- exhaustive generated docs
- long implementation output
- avoiding placeholders like “rest of code unchanged”

Rules:
- Do not use it for small edits.
- Use it when complete output matters.

## Project Fit — Malir Cantt Bazaar

Malir Cantt Bazaar is a premium dark-green, mobile-first local marketplace.

For this project:
- UI improvement: default to `redesign-skill`.
- Premium polish: use `soft-skill`.
- UI/accessibility audit: use `web-design-guidelines`.
- Motion polish: use `emil-design-eng`.
- Motion review: use `review-animations` only when user-invoked.
- Brand/case-study visuals: use `brandkit`.
- Large planning tasks: use `superpowers:writing-plans`.

Respect the existing design system.

Do not:
- redesign the whole site unless asked
- break live beta flows
- weaken backend security
- remove listing limits
- expose business verification documents
- merge automatically

## Skills Not Fully Cataloged Yet

This catalog is based on Daniyal’s saved skills list.

The environment may also include additional skills such as:
- impeccable
- design-motion-principles
- humanizer
- ui-ux-pro-max
- claude-mem plugin skills
- vercel plugin skills
- caveman plugin skills
- other newly installed skills

When new skills are confirmed, update this file.

Until then:
- prefer the known skills above
- do not invent skill behavior
- do not invoke unknown skills without understanding their purpose

## Required Reporting After Skill Use

Whenever Claude uses a skill, report:

- skill used
- why it was used
- files changed
- tests/checks run
- risks or follow-up tasks

## Security Override

`SECURITY.md` overrides this file.

A skill must never:
- expose secrets
- rewrite whole files without approval
- touch production data without approval
- weaken auth/security
- auto-merge PRs
- remove existing working features

---

# API Security Invariants (Malir Cantt Bazaar backend)

Added during the 2026-07-02 pre-beta audit. These are enforcement rules for the `/server` API — do not regress them.

## Listing visibility
- The public feed `GET /listings` MUST force `status='approved'` (or `sold` when explicitly requested) for non-admins. Never trust `status`/`featuredRequested` from the query for a non-admin. Only `req.user.role === 'admin'` (resolved via `optionalAuth`'s fresh DB lookup) may filter arbitrary statuses.
- Private statuses (`pending`/`hidden`/`rejected`) return **404** (not 403) to non-owner/non-admin on every path: detail route, and never surfaced via `/saved`.
- A non-admin editing an otherwise-live (`approved`) listing's material fields (title/description/price/subcategory/details/images) MUST re-enter `pending`. "Kept" image URLs on edit MUST already belong to the listing's stored image set.

## Auth
- Login MUST reject unverified accounts (`emailVerified === false`) with 403 `EMAIL_UNVERIFIED`. Email verification is mandatory, not decorative.
- `requireAuth` AND `optionalAuth` both re-read `role` + `isBlocked` from the DB per request — never trust the JWT's embedded role for authorization or ownership decisions.
- Login runs a dummy bcrypt compare on the no-such-user path (timing-equalised enumeration guard).

## Private documents (business verification / CNIC)
- Upload with Cloudinary `type: 'authenticated'` — never the default public `upload` type. Identity documents must not be fetchable by raw URL.
- Admin views only, via signed URLs (`signedDocUrl`). Never add verification/CNIC/NTN/adminNotes fields to any public/seller/shop response. Replaced doc assets are destroyed (`destroyDocAsset`).
- Revoking an approved business (approved→rejected/pending) hides their shop + live business listings.

## Input / abuse
- Every `/:id` route param is validated (`idParamSchema`/`listingIdParamSchema`) — a bad id is 422, never a Prisma 500.
- `updateUser` writes an explicit field allow-list, never `data: req.body`. Fields `role`/`accountType`/`businessVerified`/`isBlocked`/`status` are unreachable from any user body.
- Avatar + shop images go through the image pipeline (`storeImage`), not raw base64 into Postgres. Price ≤ 1e9. `details` ≤ 40 keys.
- Create/edit of listings/shops/business docs is behind `uploadLimiter` (30/hr/IP) on top of the global + auth limiters.

## Production boot guards (fail loud, never fall back silently)
- `JWT_SECRET` unset → refuse to boot (existing).
- `CLIENT_ORIGIN` unset in production → refuse to boot (no silent localhost CORS fallback).
- `RESEND_API_KEY` unset in production → refuse to boot (the dev email fallback logs verification codes to the console — must never run in prod).
