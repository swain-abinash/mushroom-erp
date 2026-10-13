# 🍄 SporeERP — Implementation Status & Developer Handover
## Document 11: What Is Built (Sprints 1–2), How It Works, and How to Continue

**Project Name:** SporeERP  
**Document Code:** DOC-11-IMPL-STATUS  
**Branch:** `initial/codesetup`  
**Last Updated:** 2026-10-14  
**Covers:** Sprint 1 (Infra/DB/Scaffolding) and Sprint 2 (Auth, Profiles & RBAC) from [00_MASTER_PROJECT_PLAN_AND_ROADMAP.md](00_MASTER_PROJECT_PLAN_AND_ROADMAP.md)

> Read this first if you are picking up the codebase. It records what is actually implemented (not just planned), the decisions that differ from the spec documents, and the rules to follow when adding features.

---

## 1. Tech Stack (as installed)

| Concern | Choice | Notes |
| :--- | :--- | :--- |
| Framework | **Next.js 16.4** (App Router, Turbopack) | `cacheComponents` + `partialPrefetching` enabled in `next.config.ts` — see §6.3 |
| UI | React 19.3, Tailwind CSS v4 | Design tokens in `app/globals.css` (forest/ivory/charcoal palette) |
| Language | TypeScript 5 (strict) | Path alias `@/*` → project root |
| ORM / DB | Prisma 6.19 → **MariaDB 11** (provider `mysql`) | Schema in `prisma/schema.prisma`, migrations in `prisma/migrations/` |
| Auth | Auth.js / NextAuth **v5 beta** | Credentials provider, JWT sessions |
| Validation | Zod 4 | Shared schemas in `lib/validations/` |
| Hashing | bcryptjs, cost factor **12** | `lib/auth/password.ts` |
| Infra (dev) | Docker Compose: MariaDB 11, Redis 7, Adminer | `docker-compose.yml` (optional — a local MariaDB install works too) |
| Not yet used | ioredis, razorpay | Installed for later sprints |

---

## 2. Local Setup (from a fresh clone)

```bash
npm install
cp .env.example .env          # then fill in the values below
```

### 2.1 Database

You need a **MariaDB** server (not MySQL 8 — see §8 troubleshooting). Either:

- **Docker:** `docker compose up -d` (MariaDB on `3306`, Redis on `6379`, Adminer on `8080`), or
- **Local install:** create the database and user once as root (on Windows with both MySQL 8 and MariaDB installed, MariaDB is typically on another port such as `3308` — connect there, see §8):

```sql
CREATE DATABASE IF NOT EXISTS sporeerp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sporeerp'@'localhost' IDENTIFIED BY '<your password>';
GRANT ALL PRIVILEGES ON sporeerp.* TO 'sporeerp'@'localhost';
-- `prisma migrate dev` creates a temporary shadow database, which needs these:
GRANT CREATE, ALTER, DROP, REFERENCES ON *.* TO 'sporeerp'@'localhost';
FLUSH PRIVILEGES;
```

### 2.2 `.env` keys

| Key | Purpose |
| :--- | :--- |
| `DATABASE_URL` | `mysql://sporeerp:<pwd>@localhost:<port>/sporeerp?connection_limit=10&pool_timeout=20` — use the port **your MariaDB** listens on |
| `REDIS_URL` | Reserved (rate limiting / caching — not wired yet) |
| `AUTH_SECRET` | **Required.** Generate with `npx auth secret` or `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL used in reset/invite links (`http://localhost:3000` locally) |
| `AUTH_TRUST_HOST` | `true` — required for `next start` / self-hosting behind Nginx |
| `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Founder admin account created by the seed (skipped if empty) |
| `RAZORPAY_*` | Sprint 5 |

### 2.3 Apply migrations, seed, run

```bash
npm run prisma:migrate:deploy   # applies every migration in prisma/migrations
npm run db:seed                 # roles, permissions, role grants, founder admin, base data
npm run dev                     # http://localhost:3000
```

Sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` → you land on `/admin/dashboard`.

### 2.4 npm scripts

| Script | What it does |
| :--- | :--- |
| `dev` / `build` / `start` / `lint` | Standard Next.js |
| `prisma:generate` | Regenerate Prisma Client |
| `prisma:migrate` | `prisma migrate dev` — create + apply a new migration from schema changes |
| `prisma:migrate:create` | Create a migration file **without** applying it (to review/edit SQL first) |
| `prisma:migrate:deploy` | Apply pending migrations (CI / production / fresh clones) |
| `prisma:migrate:status` | Show which migrations are applied |
| `prisma:studio` | Prisma Studio DB browser |
| `db:seed` | Run `prisma/seed.ts` (idempotent — safe to re-run) |

---

## 3. Database Migrations Policy

**Never use `prisma db push`.** Every schema change ships as a versioned migration file so every environment stays in sync.

| Migration | Contents |
| :--- | :--- |
| `20261014000000_init` | Full Sprint 1 schema: all 29 models / 14 enums from DOC-04 |
| `20261014000100_add_password_reset_tokens` | Sprint 2: `password_reset_tokens` table (reset + staff invite links) |

**Workflow for a schema change:**

1. Edit `prisma/schema.prisma`.
2. `npm run prisma:migrate -- --name <short_description>` (e.g. `add_product_pricing_tiers`).
3. Review the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`.
4. Commit the schema **and** the migration folder together.
5. Teammates pull and run `npm run prisma:migrate:deploy`.

If a database was previously created with `db push`, baseline it once: `npx prisma migrate resolve --applied 20261014000000_init`, then `migrate deploy`.

---

## 4. Project Structure

```
auth.ts                     Auth.js instance (Credentials provider, DB lookups) → handlers/auth/signIn/signOut
auth.config.ts              DB-free Auth.js config (JWT/session callbacks) — shared with proxy.ts
proxy.ts                    Route guard (Next 16's replacement for middleware.ts)
types/next-auth.d.ts        Adds `id` + `roles` to Session / JWT types

app/
  (customer)/               Public storefront + customer account (route group, ivory theme)
    page.tsx                Landing hero (static placeholder)
    login/ register/ forgot-password/ reset-password/ account/
    loading.tsx             Suspense fallback for the group
  admin/                    Staff ERP (charcoal theme)
    layout.tsx              Sidebar with permission-filtered nav
    dashboard/              Placeholder dashboard (shows user + roles)
    employees/              Staff management (invite / roles / deactivate)
  unauthorized/             "Access denied" page
  actions/auth.ts           Server Actions for login/register/reset/profile/sign-out
  api/
    health/                 GET  → DB ping latency
    auth/[...nextauth]/     Auth.js endpoints (session, callback, csrf, signout…)
    auth/register/          POST → register customer (JSON API)
    auth/forgot-password/   POST → request reset link (JSON API)

lib/
  db.ts                     Prisma singleton
  auth/permissions.ts       ROLES, PERMISSIONS, ROLE_PERMISSIONS matrix (source of truth for seed)
  auth/dal.ts               Data Access Layer: getCurrentUser / requireUser / requireStaff / requirePermission
  auth/password.ts          bcrypt hash/verify, secure token generation + SHA-256 hashing
  validations/auth.ts       Zod schemas for every auth/employee form & API
  api-response.ts           JSON success/error envelopes (DOC-05 §1)
  form-state.ts             Server Action form state helpers, safe callbackUrl check
  errors.ts                 ServiceError (known, user-facing failures)
  mail.ts                   Mail stub — logs emails to the server console (see §7)

services/                   Business logic (no HTTP / React here)
  auth.service.ts           register, password reset, profile, change password
  employee.service.ts       list/invite employees, assign roles, activate/deactivate
  audit.service.ts          Writes audit_logs rows

components/
  ui/button.tsx
  forms/form-controls.tsx   Field / SubmitButton / FormMessage (client)
  forms/auth-card.tsx
  auth/user-nav.tsx         Header sign-in state (server, inside Suspense)
  auth/admin-nav.tsx        Admin sidebar links + sign out (server, inside Suspense)

prisma/
  schema.prisma  migrations/  seed.ts
```

**Layering rule:** pages / Server Actions / API routes → validate with Zod → check auth via `lib/auth/dal.ts` → call a function in `services/` → services use `db` (Prisma). Services throw `ServiceError` for expected failures; callers convert them with `serviceFailure()` (forms) or `apiErrorFrom()` (JSON APIs).

---

## 5. Sprint 1 — Implemented

- [x] Next.js + TypeScript + ESLint + Prettier, `@/*` alias
- [x] Docker Compose: MariaDB 11 (utf8mb4), Redis 7, Adminer
- [x] Prisma configured with pool params in `DATABASE_URL`
- [x] Full relational schema (DOC-04) — now delivered as migration `20261014000000_init`
- [x] Route layout: `app/(customer)`, `app/admin`, `app/api`, `lib/`, `services/`, `types/`
- [x] `GET /api/health` → `{ status, database, dbLatencyMs }` (503 if DB is down)
- [x] Seed: `store_name` setting + "Fresh Mushrooms" category

---

## 6. Sprint 2 — Authentication & RBAC (Implemented)

### 6.1 Roles & permissions

Defined in `lib/auth/permissions.ts` and written to `roles`, `permissions`, `role_permissions` by `npm run db:seed`. Re-running the seed re-syncs each role's grants with the matrix.

| Role | Granted permissions |
| :--- | :--- |
| `FOUNDER_ADMIN` | All 24 |
| `FARM_MANAGER` | users:view, catalog:product:view/manage, orders:view_all/update_status/cancel_refund, inventory:* (3), production:* (3), harvest:* (2), suppliers:manage, purchases:create, expenses:record/view_all |
| `PRODUCTION_STAFF` | catalog:product:view, inventory:view_stock, production:* (3), harvest:* (2) |
| `INVENTORY_STAFF` | catalog:product:view, orders:view_all, inventory:* (3), purchases:create |
| `OPERATIONS_STAFF` | catalog:product:view, orders:view_all, orders:update_status, inventory:view_stock |
| `CUSTOMER` | catalog:product:view, orders:create_own |

Staff roles = every role except `CUSTOMER`.

### 6.2 Authentication flow

- **Credentials login** (`auth.ts`): email is lower-cased, password checked with bcrypt; unknown emails are compared against a dummy hash so timing doesn't leak which emails exist. Deactivated users (`is_active = false`) cannot sign in.
- **Session:** signed JWT in an HTTP-only cookie (`__Secure-` prefixed + `Secure` over HTTPS). The token carries `id` and `roles`.
- **After login:** redirect to `callbackUrl` if present (only same-origin relative paths are accepted), else staff → `/admin/dashboard`, customers → `/account`.
- **Register:** creates `users` + `customers` rows and the `CUSTOMER` role, then signs the user in.
- **Forgot password:** always returns the same message (no account enumeration). Creates a single-use token valid **1 hour**; only its SHA-256 hash is stored.
- **Reset password:** validates token (exists, unused, unexpired), updates the hash, marks the token used and deletes other open tokens.
- **Profile (`/account`):** edit name, phone, B2B company name and GSTIN (customers only); change password (requires current password); sign out.

### 6.3 Authorization — two layers

1. **`proxy.ts` (optimistic, no DB):** matcher `/admin/:path*`, `/account/:path*`, `/checkout/:path*`, `/api/v1/:path*`.
   - Not signed in → redirect to `/login?callbackUrl=<path>` (API routes get a `401` JSON envelope instead).
   - `/admin/*` without a staff role → `/unauthorized`.
   - `/admin/reports*`, `/admin/settings*` without `FOUNDER_ADMIN` → `/admin/dashboard?error=restricted`.
2. **`lib/auth/dal.ts` (authoritative, hits DB):** `getCurrentUser()` loads the user, active flag, roles and permissions **fresh from the database on every request** (deduped per render with React `cache`). Use:
   - `requireUser(returnTo)` — any signed-in, active user
   - `requireStaff(returnTo)` — staff role required
   - `requirePermission(PERMISSIONS.X, returnTo)` — specific permission required
   - `hasPermission(user, PERMISSIONS.X)` — conditional UI

   **Every admin page and every Server Action must call one of these** — the proxy alone is not a security boundary (Server Actions are reachable directly).

Because permissions are read from the DB each request, **role/permission edits and deactivations take effect on the user's next request with no redeploy**.

**Next.js 16 + Cache Components rule:** anything that reads the session (`auth()`, `getCurrentUser()`, `searchParams`) must render inside a `<Suspense>` boundary. Each route group has a `loading.tsx` for pages; shared chrome (header/sidebar) wraps its session-aware piece in `<Suspense>` (see `components/auth/*`). Don't `await` the session at the top of a layout. Read the session only via `getCurrentUser()` — it calls `await connection()` before `auth()`, otherwise dev mode reports Auth.js's `crypto.getRandomValues()` as an unstable prerender value. Values like `new Date()` in static UI need `"use cache"` (see the footer year in `app/(customer)/layout.tsx`).

### 6.4 Employee management (`/admin/employees`)

| Action | Permission | Behaviour |
| :--- | :--- | :--- |
| View staff list | `users:view` (Founder, Farm Manager) | Name, email, designation/department/joining date, roles, status |
| Invite staff | `users:manage_roles` (Founder) | Creates `users` (random unusable password) + `employees` + roles, issues a **72-hour** set-password link (emailed + shown on screen to share) |
| Assign roles | `users:manage_roles` | Replaces the user's staff roles; non-staff roles untouched |
| Deactivate / reactivate | `users:manage_roles` | Flips `users.is_active` and `employees.is_active`; deactivated users are locked out immediately |

Guards: you cannot remove your own `FOUNDER_ADMIN` role or deactivate yourself. All three mutations write an `audit_logs` row (`EMPLOYEE_INVITED`, `ROLES_ASSIGNED`, `EMPLOYEE_DEACTIVATED` / `EMPLOYEE_REACTIVATED`) with old/new state.

### 6.5 JSON API endpoints

| Method | Endpoint | Body | Responses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `{ name, email, phone?, password, confirmPassword }` | `201` user · `409 EMAIL_TAKEN/PHONE_TAKEN` · `422 VALIDATION_ERROR` |
| `POST` | `/api/auth/forgot-password` | `{ email }` | `200` generic message · `422` |
| `GET` | `/api/auth/session` | — | Auth.js session (`user.id`, `user.roles`) or `null` |
| `POST` | `/api/auth/callback/credentials` | Auth.js form post | Handled by Auth.js |

Envelopes follow DOC-05 §1: `{ success, data, meta: { timestamp, requestId } }` / `{ success: false, error: { code, message, details } }`.

### 6.6 Password rules

8–72 characters, at least one letter and one number (`lib/validations/auth.ts`). 72 is bcrypt's input limit.

---

## 7. Deviations From the Spec & Known Gaps

| Item | Spec said | What we did / why |
| :--- | :--- | :--- |
| Session storage | "MariaDB Adapter, database sessions" (DOC-00) | **JWT sessions, no adapter.** Auth.js does not support database sessions with the Credentials provider. Matches DOC-06 ("Stateless Signed JWT + Server-Side Permissions Validation"). |
| Middleware | `middleware.ts` (DOC-06 §4) | **`proxy.ts`** — Next.js 16 renamed the convention. Same logic. |
| "Read" cells on write permissions | e.g. Inventory Staff "Read" on `harvest:log_entry`, `suppliers:manage` | **Not granted** — a single atomic code can't mean read-only. Add `harvest:view` / `suppliers:view` codes when those modules are built. |
| Role promotion in the proxy | — | The proxy reads roles from the JWT, so a **customer promoted to staff must sign in again** before `/admin` opens. Demotions/deactivations are enforced immediately by the DAL. |
| Email delivery | Reset/invite emails | **Stub** — `lib/mail.ts` logs the message (including the link) to the server console. Replace with a real provider (SMTP/Resend/SES) before go-live. |
| Rate limiting | Redis-backed (DOC-02/06) | **Not implemented yet.** Login / register / forgot-password should get Redis rate limits. |
| Email verification | `users.email_verified` column exists | Not enforced or sent yet. |
| Customer addresses | `customer_addresses` table exists | No UI yet — planned with checkout (Sprint 4). |
| `/api/auth/session` permissions | DOC-05 says "claims and permissions" | Returns `id` + `roles` only. Server code should use `getCurrentUser().permissions`. |
| Automated tests | — | None yet. |

---

## 8. Troubleshooting

| Symptom | Cause / Fix |
| :--- | :--- |
| `RSA public key is not available client side (option serverRsaPublicKeyFile not set)` | You are connecting to a **MySQL 8** server (its `caching_sha2_password` auth) with a MariaDB client/driver. Point the client and `DATABASE_URL` at the **MariaDB** port. On machines with both installed, MySQL 8 usually owns `3306` — check MariaDB's `my.ini` for its port. |
| Prisma `P1000 Authentication failed` | Wrong port/server (see above) or the `sporeerp` user doesn't exist — run the SQL in §2.1. |
| `Unknown authentication plugin 'auth_gssapi_client'` | MariaDB on Windows replies this way when the user doesn't exist. Create the user (§2.1). |
| Auth.js `UntrustedHost` on `next start` | Set `AUTH_TRUST_HOST=true`. |
| Build error "encountered the unstable value `new Date()`" / missing Suspense | Cache Components rule — see §6.3. |
| Dev error "encountered the unstable value `crypto.getRandomValues()`" at `<UserNav />` | Auth.js generates random values before reading cookies. Always read the session through `getCurrentUser()` (it calls `await connection()` first) — never call `auth()` directly in components. |
| Reset/invite link "not received" | Expected — check the server console for `[mail]` output. |

---

## 9. Verification Record (2026-10-14)

Run against a production build (`next build` + `next start`) on MariaDB 11.6, after `prisma migrate deploy` + `db:seed` on an empty database.

**Database:** both migrations applied; `prisma migrate diff --from-url $DATABASE_URL --to-schema-datamodel prisma/schema.prisma --exit-code` → *No difference detected* (migrations and schema are in sync). Seed → 24 permissions, 6 roles, founder admin. `tsc --noEmit`, `eslint`, `next build` all clean.

**End-to-end HTTP checks: 36 / 36 passed.** Forms were submitted the way a no-JavaScript browser submits them (React's progressive-enhancement fields), so the real Server Actions ran.

| Area | Verified |
| :--- | :--- |
| Proxy | Anonymous `/admin/*` → `/login?callbackUrl=…`; anonymous `/api/v1/*` → `401` JSON; customer on `/admin` → `/unauthorized`; non-founder on `/admin/settings` → `?error=restricted` |
| Health | `GET /api/health` → `200`, `database: connected` |
| Register | JSON API `201`; duplicate email `409 EMAIL_TAKEN`; register form signs the user in and lands on `/account` |
| Login | Wrong password rejected; session cookie set; `/api/auth/session` returns `id` + `roles` |
| Profile | Profile update; change password rejects wrong current password; new password works |
| Reset | Forgot-password returns identical `200` for known/unknown emails; reset link works once, then reports invalid; new password works |
| Employees | Founder invites staff → invite link → staff sets password and signs in; Production Staff can open the dashboard but gets `/unauthorized` on `/admin/employees` |
| Live RBAC | Promoting the signed-in staff member to `FARM_MANAGER` opens `/admin/employees` **without re-login**; deactivating locks the **same session** out on the next request and blocks new sign-ins |
| Guards | Founder attempting to strip their own `FOUNDER_ADMIN` role is rejected |
| Audit | `EMPLOYEE_INVITED`, `ROLES_ASSIGNED`, `EMPLOYEE_DEACTIVATED` rows written |

Test accounts were deleted afterwards; the database holds only seed data.

> **Gotcha seen during testing:** a `redirect()` from the DAL inside a page that is already streaming (behind `loading.tsx`) arrives as HTTP `200` with a `<meta http-equiv="refresh">` to the target, not a `307`. Browsers follow it normally. Automated tests and API clients must not treat `200` as "allowed" on pages; JSON APIs should return explicit `401`/`403` envelopes instead of calling `redirect()`.

---

## 10. How to Add a Protected Feature (recipe)

1. **Permission:** if needed, add a code to `PERMISSIONS`, `PERMISSION_DESCRIPTIONS` and the relevant roles in `ROLE_PERMISSIONS` (`lib/auth/permissions.ts`), then `npm run db:seed`.
2. **Schema:** edit `prisma/schema.prisma` → `npm run prisma:migrate -- --name <change>`.
3. **Validation:** add a Zod schema in `lib/validations/<module>.ts`.
4. **Service:** add functions in `services/<module>.service.ts`; throw `ServiceError` for expected failures; log mutations with `AuditService.logEvent` (pass the transaction client when inside `db.$transaction`).
5. **Page:** `app/admin/<module>/page.tsx` → first line `await requirePermission(PERMISSIONS.X, "/admin/<module>")`.
6. **Server Action:** `"use server"` file next to the page; call `requirePermission` **inside each action**, validate, call the service, `revalidatePath`, return `FormState`.
7. **JSON API (if needed):** `app/api/v1/<module>/route.ts` (already behind the proxy's 401); still call the DAL for permission checks; respond with `apiSuccess` / `apiErrorFrom`.
8. **Nav:** add the link in `components/auth/admin-nav.tsx` with its `visible: hasPermission(...)` condition.

---

## 11. Next Up — Sprint 3 (Catalog & Storefront)

Per DOC-00: `ProductPricingTier` model (+ migration), admin product CRUD with image upload / SKU / units / MOQ, B2B price tiers, storefront catalog with filters, product detail page. Before or alongside it, consider closing the Sprint 2 gaps in §7 (rate limiting, real email provider, tests).
