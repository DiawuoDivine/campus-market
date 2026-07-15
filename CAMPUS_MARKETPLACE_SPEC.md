# Campus Marketplace — Project Specification & Build Instructions

> **Revision note:** This is the Bun + Express rewrite of the original Go + Fiber specification. Product scope (Section 6) is unchanged; the backend stack (Sections 2–5, 7–12) has been ported to TypeScript; Section 13 adds new feature suggestions that weren't in the original scope.

## 1. Overview

A campus-only marketplace where students buy, sell, and trade items/services within
their institution. Students authenticate using their **institutional index/student
number** (plus a secondary factor such as institutional email or a set password),
which ties every listing, chat, and transaction to a verified member of the campus
community — reducing scams and building trust.

- **Backend:** Bun + Express (REST API, monolith-first but modular for future
  extraction into services). Fiber's API was already modeled closely on Express, so
  the routing style, middleware chaining, and REST conventions from the original
  spec carry over conceptually with minimal relearning.
- **Frontend:** React + TypeScript, built with Vite, served as static assets by
  Express and bundled into a single deployable executable via `bun build --compile`
- **Database:** PostgreSQL
- **UI:** shadcn/ui (Radix + Tailwind)
- **Icons:** lucide-react
- **Auth subject:** Student Index Number (validated against a university
  registry / whitelist), backed by JWT sessions

---

## 2. Tech Stack

| Layer            | Choice                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Language         | TypeScript                                                          |
| Runtime          | Bun 1.3+ (bundles the package manager, bundler, and test runner; native SQL, Redis, and S3 clients) |
| Web Framework    | Express 5 (5.2.x)                                                   |
| ORM/Query        | Drizzle ORM via `drizzle-orm/bun-sql` (type-safe, SQL-like — the sqlc equivalent) or Prisma via a Bun driver adapter (the GORM equivalent) — pick one, Drizzle preferred |
| DB               | PostgreSQL 16                                                       |
| Migrations       | Drizzle Kit (schema-diff generated SQL migrations)                  |
| Cache/Queue      | Redis — Bun's native `RedisClient` for cache/rate-limit/pub-sub; BullMQ or a hand-rolled native-Redis queue for background jobs (see 2.1) |
| Search           | PostgreSQL full-text search initially → Meilisearch/Typesense later |
| Object Storage   | S3-compatible (MinIO locally, S3/DigitalOcean Spaces in prod) via `Bun.S3Client` or `@aws-sdk/client-s3` — pick one, `Bun.S3Client` preferred for new code |
| Auth             | JWT (access + refresh) via `jose`, index-number verification, `bcryptjs`/`argon2` password hashing (see 2.1) |
| Realtime         | WebSockets via `ws`, mounted on the same HTTP server as Express (Express has no native WS layer — the same tradeoff Fiber has with `websocket/v2`) |
| Frontend         | React 18 + TypeScript + Vite                                        |
| Frontend UI      | shadcn/ui, Tailwind CSS, lucide-react                               |
| State/Data       | TanStack Query, Zustand (or Context) for client state               |
| Forms/Validation | react-hook-form + zod (the same zod schemas can double as the backend DTOs — see Section 10) |
| Testing (BE)     | `bun:test` (built-in, Jest-style API, built-in coverage via `--coverage`), `supertest` for HTTP endpoint tests, Testcontainers or a Docker Compose Postgres service for integration tests |
| Testing (FE)     | Vitest, React Testing Library, Playwright (e2e)                     |
| Observability    | pino, OpenTelemetry JS SDK, Prometheus + Grafana (via `prom-client`) |
| CI/CD            | GitHub Actions, Docker (`oven/bun` base image), Docker Compose (dev), Kubernetes-ready |
| Docs             | OpenAPI generated from the zod DTOs via `zod-openapi` or `@asteasolutions/zod-to-openapi`, served with `swagger-ui-express`, or a hand-maintained `openapi.yaml` |

### 2.1 Notes & caveats vs. the Go version

- **Native password-hashing modules:** the `bcrypt` npm package (node-gyp native bindings) has had rough edges under Bun; `bcryptjs` (pure JS, no native bindings) is the safer default. If Argon2id specifically matters, verify `argon2`'s current Bun compatibility before depending on it in production — spike it early rather than discovering an issue at deploy time.
- **Background job queues:** BullMQ is still the most complete job-queue option in the ecosystem, but it's built on `ioredis`, not Bun's native `RedisClient` — using it means one non-native Redis dependency alongside Bun's native client for everything else (cache, rate-limit counters, chat pub/sub). A hand-rolled queue on Bun's native Redis lists is the fully-native alternative if that one dependency is worth avoiding.
- **Module privacy is convention, not compiler-enforced:** see the note under Section 4 — Go's `internal/` has no TypeScript equivalent, so cross-module import boundaries need a lint rule in CI to actually hold.

---

## 3. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │     Bun + Express Server     │
                        │                              │
   Browser  ───HTTPS──▶ │  /api/v1/*  → REST routers   │
                        │  /ws/*      → WebSocket hub   │
                        │  /*         → React SPA       │
                        │      (express.static + SPA    │
                        │           fallback)           │
                        └──────────────┬───────────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 ▼                     ▼                     ▼
           PostgreSQL              Redis                S3 / MinIO
        (users, listings,     (sessions, cache,      (listing images,
         orders, chats)       rate-limit, pubsub)     avatars, docs)
         via Bun.sql          via RedisClient          via Bun.S3Client
```

The React app is built (`vite build`) into static assets served by Express via
`express.static()` with an SPA fallback route to `index.html`. For deployment,
`bun build --compile` bundles the Express server, all npm dependencies, and the
Bun runtime itself into a single cross-platform native executable — frontend
assets are embedded using `with { type: "file" }` import attributes — so **one
binary + one Postgres instance** can still run the entire app, matching the Go
version's deployment simplicity, while the internal module structure stays
modular enough to split into microservices later if needed.

---

## 4. Enforced Bun + Express Backend Folder Structure

Follow a clean, modular, domain-driven structure. **No business logic in
`src/index.ts`.** Each domain ("module") owns its routes, service, repository,
and models — nothing reaches across domains except through interfaces.

```
campus-marketplace/
├── src/
│   ├── index.ts                    # wiring only: env validation, DI, server start
│   │
│   ├── config/                     # env loading & validation (zod-parsed env schema)
│   │   └── env.ts
│   │
│   ├── server/                     # Express app setup, route registration, graceful shutdown
│   │   ├── app.ts                  # express() instance + global middleware
│   │   ├── routes.ts               # central route registration, grouped by module + version
│   │   └── shutdown.ts             # graceful shutdown (SIGTERM/SIGINT, drain connections)
│   │
│   ├── platform/                   # cross-cutting infrastructure (shared, no domain logic)
│   │   ├── database/
│   │   │   ├── client.ts           # Drizzle instance over Bun.sql
│   │   │   └── schema/             # Drizzle schema files — source of truth for migrations
│   │   ├── cache/
│   │   │   └── redis.ts            # wrapper around Bun's native RedisClient
│   │   ├── storage/                # object storage client wrapper
│   │   │   └── s3.ts               # Bun.S3Client (or @aws-sdk/client-s3)
│   │   ├── logger/
│   │   │   └── logger.ts           # pino instance
│   │   ├── ws/                     # websocket hub (connection registry, broadcast)
│   │   │   └── hub.ts
│   │   └── mailer/                 # email (verification, notifications)
│   │       └── mailer.ts
│   │
│   ├── middleware/                 # reusable Express middleware
│   │   ├── auth.ts                 # JWT verification
│   │   ├── rateLimit.ts
│   │   ├── requestLogger.ts
│   │   ├── errorHandler.ts         # central error-mapping middleware (catches Express 5's auto-forwarded async errors)
│   │   └── rbac.ts                 # role-based access (student/admin/moderator)
│   │
│   ├── lib/                        # shared internal libraries
│   │   ├── appError.ts             # standardized error types + HTTP mapping
│   │   ├── validate.ts             # zod request-validation middleware factory
│   │   ├── response.ts             # standardized JSON response envelope
│   │   ├── jwt.ts
│   │   ├── hash.ts                 # password hashing (bcryptjs/argon2)
│   │   ├── pagination.ts
│   │   └── indexNumber.ts          # index number format validation + registry lookup
│   │
│   └── modules/                    # DOMAIN MODULES — each is self-contained
│       │
│       ├── auth/
│       │   ├── auth.routes.ts      # HTTP layer (Express Router — no SQL, no business rules)
│       │   ├── auth.service.ts     # business logic
│       │   ├── auth.repository.ts  # DB access (interface + Drizzle implementation)
│       │   ├── auth.dto.ts         # zod request/response schemas (also the type source)
│       │   ├── auth.model.ts       # domain types
│       │   └── auth.test.ts
│       │
│       ├── user/                   # profile, index-number verification, KYC status
│       │   └── ...same pattern
│       │
│       ├── listing/                # product/service listings, categories, images
│       │   └── ...same pattern
│       │
│       ├── category/
│       │   └── ...same pattern
│       │
│       ├── search/                 # search/filter/sort endpoint(s)
│       │   └── ...same pattern
│       │
│       ├── chat/                   # conversations & messages (REST + WS)
│       │   ├── chat.routes.ts
│       │   ├── chat.ws.ts
│       │   ├── chat.service.ts
│       │   ├── chat.repository.ts
│       │   ├── chat.dto.ts
│       │   ├── chat.model.ts
│       │   └── chat.test.ts
│       │
│       ├── order/                  # reservation/checkout/pickup workflow
│       │   └── ...same pattern
│       │
│       ├── review/                 # seller/buyer ratings & reviews
│       │   └── ...same pattern
│       │
│       ├── favorite/               # wishlist/saved listings
│       │   └── ...same pattern
│       │
│       ├── notification/           # in-app + email notifications
│       │   └── ...same pattern
│       │
│       ├── report/                 # flag listings/users, admin moderation queue
│       │   └── ...same pattern
│       │
│       └── admin/                  # admin dashboards, analytics, user management
│           └── ...same pattern
│
├── drizzle/                        # generated SQL migrations (drizzle-kit output)
│   ├── 0001_init.sql
│   └── meta/
├── drizzle.config.ts                # drizzle-kit config (schema path, migration dir, DB creds)
│
├── web/                             # React TS frontend (source) — unchanged from the Go version
│   ├── src/
│   │   ├── app/                    # routing, providers, layout shells
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn generated components
│   │   │   └── shared/             # app-specific reusable components
│   │   ├── features/               # mirrors backend modules
│   │   │   ├── auth/
│   │   │   ├── listings/
│   │   │   ├── chat/
│   │   │   ├── orders/
│   │   │   ├── profile/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── lib/                    # api client, utils, query client
│   │   ├── stores/                 # zustand stores
│   │   ├── types/
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── api/
│   └── openapi.yaml                 # generated from zod schemas, or hand-maintained
│
├── deployments/
│   ├── docker/
│   │   ├── Dockerfile               # FROM oven/bun
│   │   └── docker-compose.yml
│   └── k8s/                         # manifests/helm chart (future scale-out)
│
├── scripts/                         # dev scripts (seed db, drizzle generate/migrate helpers)
├── test/                            # integration/e2e test suites (bun:test + supertest)
├── .github/workflows/               # CI pipelines
├── .env.example
├── package.json                     # scripts replace the Makefile (dev/build/test/migrate/seed)
├── bun.lock
├── tsconfig.json
└── README.md
```

### Module pattern (enforced for every domain)

Each module in `src/modules/<name>` follows:

```
routes.ts       → parses request (validated via lib/validate.ts), calls service, sends response (no SQL, no business rules)
service.ts      → business logic, orchestrates repositories, enforces domain rules
repository.ts   → interface + Drizzle implementation (only place SQL/query-builder calls live)
dto.ts          → zod request/response schemas — validation AND the TypeScript type source via z.infer<>
model.ts        → core domain entity, independent of DB/HTTP concerns
*.test.ts       → unit tests against interfaces (mocked repository) via bun:test
```

**Rules to enforce:**

1. Route handlers never talk to the database directly.
2. Services depend on repository **interfaces**, not concrete classes (enables mocking in `bun:test`).
3. Cross-module calls go through exported service interfaces only, wired at composition time in `src/index.ts` — never import another module's `*.repository.ts` directly.

   > **Note:** Unlike Go's `internal/` package, TypeScript has no compiler-enforced privacy boundary between modules — this rule is a convention, not a guarantee. Enforce it in CI with an import-boundary lint rule (e.g. `eslint-plugin-boundaries` or `dependency-cruiser`) rather than relying on discipline alone.

4. All routes are registered centrally in `src/server/routes.ts`, grouped by module and API version (`/api/v1/...`).
5. Consistent response envelope from `lib/response.ts` for every endpoint (success + error shape).
6. Consistent error handling via `lib/appError.ts`, mapped to HTTP status codes in one place (`middleware/errorHandler.ts`). Express 5 automatically forwards a rejected promise from an `async` route handler to this middleware, so routes don't need the manual `try/catch` + `next(err)` boilerplate Express 4 required.

---

## 5. Authentication & Identity (Index Number Based)

- **Primary identifier:** Student Index Number (e.g. `UG/2023/0123456`), validated
  against a configurable regex/format per institution and, ideally, cross-checked
  against an uploaded/synced student registry table (`verified_students`) so only
  real, enrolled students can register.
- **Registration flow:**
  1. Student enters index number + institutional email + password.
  2. Backend validates index number format and checks it exists in `verified_students`
     (pre-loaded by admin/registrar import) and is not already claimed.
  3. Email OTP / verification link sent to institutional email to confirm ownership.
  4. Account created with `status = pending_verification` → `active` after confirmation.
- **Login:** index number (or email) + password → JWT access token (short-lived,
  ~15 min, signed via `jose`) + refresh token (httpOnly cookie, rotated, ~7–30 days).
- **Authorization:** Role-based (`student`, `moderator`, `admin`), enforced via
  `middleware/rbac.ts`.
- **Session security:** refresh token rotation + reuse detection, device/session
  listing, ability to revoke sessions, Redis-backed token blacklist for logout
  (via Bun's native `RedisClient`).
- **Trust signals:** index-number verification badge on profile; optional
  hostel/campus affiliation field for local pickup context.

---

## 6. Functional Requirements

### 6.1 User & Identity

- Register/login/logout with index number
- Email verification via institutional email
- Password reset (email OTP)
- Profile management (name, photo, bio, hostel/campus, contact preferences)
- Public seller profile page showing ratings, active listings, join date, verification badge

### 6.2 Listings

- Create/edit/delete listings (title, description, price, condition, category, images up to N, quantity)
- Multi-image upload with drag-drop, reordering, primary image selection
- Draft / published / sold / archived listing states
- Boost/feature a listing (optional monetization hook, future)
- Listing expiry (auto-archive after X days of inactivity)

### 6.3 Categories & Discovery

- Hierarchical categories (e.g. Electronics → Laptops)
- Browse by category, campus/hostel, price range, condition
- Full-text search with filters (price, category, condition, date posted) and sort (newest, price asc/desc, popularity)
- Trending / recently viewed / recommended listings

### 6.4 Favorites & Alerts

- Save/wishlist listings
- Saved search alerts (notify when a matching new listing appears)

### 6.5 Messaging

- Real-time 1:1 chat per listing (buyer ↔ seller) via WebSockets
- Message history, read receipts, typing indicators
- Image/attachment sharing in chat
- Report/block a user from within chat

### 6.6 Orders / Transactions

- "Reserve" or "Request to buy" flow with seller acceptance
- Meetup/pickup scheduling fields (campus location, time)
- Mark as sold/completed by both parties
- (Optional, phase 2) In-app escrow or payment integration (e.g. mobile money/Paystack) for non-cash transactions

### 6.7 Reviews & Trust

- Buyer/seller rate each other after a completed transaction (1–5 stars + comment)
- Average rating + review count on profile
- Verified-transaction badge on reviews (prevents fake reviews)

### 6.8 Notifications

- In-app notification center (new message, offer, price drop on saved item, listing sold, moderation action)
- Email notifications for critical events
- Push-ready architecture (web push optional later)

### 6.9 Moderation & Admin

- Report listing/user (spam, prohibited item, scam, inappropriate content)
- Admin dashboard: user management, listing moderation queue, category management, verified-student registry import (CSV), analytics (active users, listings, categories trending)
- Prohibited-items rule engine (keyword/category flags for manual review)
- Audit log of admin actions

### 6.10 Platform

- Responsive design (mobile-first, since most students browse on phones)
- Dark/light theme (shadcn theming)
- Accessibility (WCAG AA where feasible)

---

## 7. Non-Functional Requirements

| Category                 | Requirement                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scalability**          | Stateless API layer (JWT, no server-side sessions) so it can scale horizontally behind a load balancer; DB connection pooling via `Bun.sql`'s built-in pool; read replicas ready; Redis for shared cache/rate-limit/pubsub across instances; WebSocket hub designed to be Redis-pubsub-backed (via `RedisClient` pub/sub) so it works across multiple app instances                          |
| **Performance**          | P95 API latency < 200ms for reads under normal load; pagination (cursor-based) on all list endpoints; DB indexes on search/filter columns; image optimization (resize/compress on upload via `sharp`, served via CDN)                                                                                                                                                                        |
| **Availability**         | Graceful shutdown, health/readiness endpoints (`/healthz`, `/readyz`), zero-downtime deploys, DB migrations run as a separate step                                                                                                                                                                                                                                                            |
| **Security**             | `bcryptjs`/`argon2` password hashing (see 2.1), JWT signed with rotating secrets, rate limiting per IP/user (`express-rate-limit` + Redis store), input validation on every DTO (zod), parameterized queries only (Drizzle/`Bun.sql` tagged templates parameterize automatically), CSRF protection for cookie-based flows, HTTPS-only in prod, secure headers (Helmet middleware — a direct fit for Express, unlike Fiber's Helmet-equivalent), file-type/size validation on uploads, virus scan hook (optional), OWASP Top 10 mitigations |
| **Reliability**          | Idempotent write endpoints where relevant, Drizzle transactions for multi-step writes (e.g., order + notification), retries with backoff for external calls (email, storage) via a small helper (e.g. `p-retry`)                                                                                                                                                                             |
| **Observability**        | Structured logging (request ID correlation via `pino-http`/`AsyncLocalStorage`), metrics (request count/latency/error rate) via `prom-client`, tracing across routes→service→repository via the OpenTelemetry JS SDK, alerting on error-rate spikes                                                                                                                                          |
| **Maintainability**      | Enforced modular structure (Section 4), interface-driven design for testability, linting via ESLint + Prettier (or Biome as a single fast Rust-based linter/formatter), consistent commit conventions, generated API docs                                                                                                                                                                   |
| **Testability**          | ≥70% unit test coverage on the service layer (`bun test --coverage`), integration tests against a real Postgres (Testcontainers or a Docker Compose service in CI), e2e tests for critical flows (register → list item → chat → complete order)                                                                                                                                             |
| **Data Privacy**         | Index numbers and personal data treated as sensitive; least-privilege DB roles; PII encryption at rest for sensitive fields where applicable; data retention/deletion policy for closed accounts                                                                                                                                                                                              |
| **Portability**          | Fully containerized (Docker, `oven/bun` base image), 12-factor config via environment variables (Bun loads `.env`/`.env.local` automatically — no `dotenv` package needed), works locally via `docker-compose up`                                                                                                                                                                            |
| **Internationalization** | Structure text via i18n-ready keys on the frontend (e.g. `react-i18next`) even if only one locale ships initially                                                                                                                                                                                                                                                                             |
| **Extensibility**        | Modular monolith today, but module boundaries (interfaces + no cross-module DB access, enforced via lint rules — see Section 4) allow extraction into microservices later without a rewrite                                                                                                                                                                                                  |

---

## 8. Core Database Schema (starting point)

Table and column names are unchanged from the Go version — the schema is a
database-level concern, not a language-level one. In Drizzle, each table below
becomes a TypeScript schema object under `src/platform/database/schema/`;
`drizzle-kit generate` diffs it against the live database and emits the
migration SQL, so there's no more hand-pairing `.up.sql`/`.down.sql` files the
way `golang-migrate` required.

```
users               (id, index_number, email, password_hash, full_name, avatar_url,
                      campus, hostel, role, status, is_verified, rating_avg,
                      rating_count, created_at, updated_at)

verified_students    (index_number, full_name, program, enrollment_year, imported_at)

categories           (id, parent_id, name, slug, icon)

listings             (id, seller_id, category_id, title, description, price,
                      condition, quantity, status, view_count, created_at, updated_at, expires_at)

listing_images        (id, listing_id, url, position, is_primary)

favorites             (id, user_id, listing_id, created_at)

saved_searches         (id, user_id, query_params, created_at)

conversations           (id, listing_id, buyer_id, seller_id, created_at)

messages                 (id, conversation_id, sender_id, content, attachment_url, read_at, created_at)

orders                    (id, listing_id, buyer_id, seller_id, status, meetup_location,
                           meetup_time, created_at, completed_at)

reviews                   (id, order_id, reviewer_id, reviewee_id, rating, comment, created_at)

notifications              (id, user_id, type, payload, is_read, created_at)

reports                     (id, reporter_id, target_type, target_id, reason, status, created_at)

admin_audit_logs             (id, admin_id, action, target_type, target_id, meta, created_at)

sessions/refresh_tokens        (id, user_id, token_hash, device_info, expires_at, revoked_at)
```

Indexes: `listings(category_id, status, created_at)`, `listings` full-text index
on `title || description`, `messages(conversation_id, created_at)`,
`users(index_number)` unique, `users(email)` unique.

---

## 9. API Design Conventions

- Base path: `/api/v1`
- Resource-oriented REST: `GET /listings`, `POST /listings`, `GET /listings/:id`, etc.
- Auth: `Authorization: Bearer <access_token>` header; refresh via `POST /auth/refresh` (httpOnly cookie)
- Consistent envelope:

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "per_page": 20, "total": 134 },
  "error": null
}
```

- Errors:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "index number is invalid",
    "details": []
  }
}
```

- Pagination: cursor-based for feeds (`?cursor=...&limit=20`), offset-based acceptable for admin tables
- Versioned via URL prefix; breaking changes go to `/api/v2`
- WebSocket endpoint: `/ws/chat/:conversationId` (JWT passed via query param or subprotocol at handshake)

---

## 10. Frontend Notes (React + TS + shadcn + lucide-react)

- Build tool: Vite, output to `web/dist`, served by Express via `express.static('web/dist')` with an SPA fallback route that returns `index.html` for any non-API, non-WS path.
- `features/` folder mirrors backend modules for cognitive parity (auth, listings, chat, orders, profile, admin).
- API client: a typed fetch wrapper (or `ky`/`axios`) with interceptors for auth-refresh, generated types ideally from `api/openapi.yaml` (e.g., via `openapi-typescript`).
  - **Bonus over the Go version:** in a Bun-workspaces monorepo, the frontend can import the `z.infer<>` types straight from the backend's `*.dto.ts` files instead of (or alongside) OpenAPI codegen, giving compile-time-shared types with zero codegen step. Optional — the codegen path still works if you'd rather keep a stricter contract boundary between client and server.
- Data fetching/caching: TanStack Query for all server state; no manual `useEffect` fetch chains.
- Forms: `react-hook-form` + `zod` schemas, optionally the literal same schema objects the backend validates against (see above), rather than a mirrored copy.
- UI: shadcn/ui components generated per need (`npx shadcn add button card dialog ...`), Tailwind for layout, lucide-react for all icons.
- Realtime: a `useChatSocket` hook wrapping the native browser WebSocket API with reconnect/backoff logic.
- Routing: React Router (or TanStack Router) with route-level code splitting.

---

## 11. Suggested Build Order (Roadmap)

1. **Foundation:** repo scaffold, Docker Compose (Postgres, Redis, MinIO), env config loader/validator (zod-parsed), Express server skeleton, health checks, CI pipeline
2. **Auth & User module:** index-number registration/verification, login/refresh, RBAC middleware
3. **Listing + Category modules:** CRUD, image upload to storage, search/filter
4. **Frontend shell:** layout, auth pages, listing browse/detail, shadcn setup
5. **Favorites + Notifications (basic)**
6. **Chat module:** REST history + `ws` WebSocket hub, chat UI
7. **Orders + Reviews:** reservation flow, completion, rating
8. **Admin module:** moderation queue, registry import, analytics dashboard
9. **Hardening:** rate limiting, observability stack, load testing, security review
10. **Deployment:** containerize (`Dockerfile FROM oven/bun`), CI/CD to staging/prod, `bun build --compile` for the single-executable deployment path (frontend assets embedded via `with { type: "file" }`), k8s manifests if scaling beyond a single instance

---

## 12. Definition of Done (per feature)

- [ ] Route → Service → Repository implemented per module pattern
- [ ] Request validated via a zod schema (`lib/validate.ts`) and errors mapped via `lib/appError`
- [ ] Unit tests for service logic (`bun:test`, mocked repository)
- [ ] Integration test for at least the happy path (`supertest` against a real test database)
- [ ] OpenAPI spec updated
- [ ] Frontend feature wired with TanStack Query + typed API client
- [ ] Loading/empty/error states handled in UI
- [ ] Logged and traced (request ID present in logs)
- [ ] Reviewed against non-functional checklist (Section 7) where relevant

---

## 13. Suggested New Features (Not in Original Scope)

These aren't in the Section 6 requirements — they're additions worth considering
once the core build order (Section 11) is underway. Each ties back to something
already in the spec (a table, a "phase 2" note, an existing requirement) rather
than introducing unrelated infrastructure, and each is tagged with a rough effort
level so they're easy to triage against the roadmap.

### 13.1 Trust & Safety

| Feature | What it does | Why it fits | Effort |
| --- | --- | --- | --- |
| Verified safe-meetup zones | Admin-curated list of on-campus meeting points (security post, library entrance, student center); `orders.meetup_location` becomes a dropdown into this list instead of free text | Directly reduces the scam/safety risk the whole index-number verification system already exists to address | Low–Med |
| Structured dispute flow | Before a `report` escalates to a moderator, buyer and seller get a shared thread with a visible response timer and an explicit "escalate to admin" action | Most buyer/seller disagreements are misunderstandings, not fraud — resolving them without a human moderator keeps the moderation queue for cases that actually need it | Med |
| Mobile-money / Paystack escrow | Hold payment until both sides confirm pickup; auto-refund path if the buyer never confirms | Already flagged as a "phase 2" idea in Section 6.6 — worth designing the `orders` status enum (e.g. adding a `funds_held` state) now so the schema doesn't need surgery later | High |

### 13.2 Discovery & Commerce

| Feature | What it does | Why it fits | Effort |
| --- | --- | --- | --- |
| Course-code tagging | Optional `course_code` field on listings (e.g. "MATH 201") with autocomplete from a `courses` reference table | Turns "search by keyword and hope" into "search by the course you're actually taking" for textbooks and past questions — probably the highest-intent search pattern on a campus marketplace | Low |
| Category-specific attributes | Each category defines its own structured fields (Electronics → brand/model/warranty; Textbooks → edition/ISBN; Fashion → size) instead of one free-text description | Filtering on real attributes beats full-text search for almost every buyer intent | Med |
| Lost & found board | A free, non-commercial listing type reusing the existing `listings` table (`type = 'lost_found'` alongside `'for_sale'`/`'service'`) | Cheap to build on infrastructure that already exists, and a strong trust/goodwill feature a generic marketplace app wouldn't bother with | Low |

### 13.3 Community & Growth

| Feature | What it does | Why it fits | Effort |
| --- | --- | --- | --- |
| Campus ambassador / referral credits | Small credit or badge for early students who bring in verified sellers or buyers | Two-sided marketplaces live or die on the cold-start problem — cheaper than paid acquisition and fits a campus's existing social graph | Low |
| Semester clear-out board | A time-boxed, auto-surfaced view around known end-of-semester dates for dorm move-out sales | High urgency + high visibility, and it's a saved-search/filter preset on existing data, not new infrastructure | Low |
| Seller insights | Lightweight dashboard: views over time, favorite counts, days-to-sell vs. category average | Reuses `view_count` and `favorites` data already in the Section 8 schema — mostly a reporting query, not new tracking | Low–Med |

### 13.4 Platform & Technical

| Feature | What it does | Why it fits | Effort |
| --- | --- | --- | --- |
| PWA + Web Push | Installable manifest + service worker, `web-push` (VAPID) for real notifications | Section 6.8 already flags "push-ready architecture" as a later step — this makes it concrete, and matters more on a mobile-first student audience than on desktop-first apps | Med |
| Data-saver mode | Toggle that serves lower-resolution images by default and switches browse to a lighter, text-first layout | Image resizing (`sharp`) is already in Section 7's performance requirements — this reuses it rather than adding new infrastructure, and helps on limited mobile data plans | Low |
| `campus_id` groundwork | Add a nullable `campus_id` to `users` and `listings` now, even for a single-institution launch | Cheap insurance: avoids a painful migration and a moderation-queue rework if the marketplace ever expands to a second campus | Low |
