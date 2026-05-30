# ScanServe — QR Digital Menu SaaS for Indian Restaurants

> **AI Coding Agent Instructions:** This is a production-grade SaaS product — not a prototype. Every decision must prioritise scalability, security, and user experience for a non-technical Indian restaurant owner audience. Read this entire document before writing a single line of code. Follow every constraint, naming convention, and architecture decision exactly as described. Where this document is silent, default to industry best practice.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Tech Stack & Justification](#2-tech-stack--justification)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Backend Architecture](#6-backend-architecture)
7. [API Specification](#7-api-specification)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Authentication & Authorisation](#9-authentication--authorisation)
10. [Feature Specifications](#10-feature-specifications)
11. [Edge Cases & Error Handling](#11-edge-cases--error-handling)
12. [Performance Requirements](#12-performance-requirements)
13. [Security Checklist](#13-security-checklist)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment & Infra](#15-deployment--infra)
16. [Coding Conventions](#16-coding-conventions)

---

## 1. Product Vision

**ScanServe** is a multi-tenant SaaS platform that enables Indian restaurant owners to create and manage a beautiful, mobile-first digital menu accessible via QR code — no app download required for end customers.

### Who uses this

| Persona | Description |
|---|---|
| **Restaurant Owner (Admin)** | Non-technical; manages menu from a mobile browser. Speaks Hindi/English mix. Expects WhatsApp-level simplicity. |
| **End Customer (Guest)** | Scans QR at table. Views menu and optionally places an order. Expects instant load, no login, works on 2G. |
| **Branch Manager** | Manages one location under a parent account. Can edit menu but not billing. |
| **Platform Super-Admin** | Internal Scanserve staff. Views all tenants, manages plans, handles escalations. |

### Core promise

A restaurant owner must be able to:
1. Sign up
2. Create their first menu
3. Download a print-ready QR code

...all in under **10 minutes**, on a mobile phone, with no technical knowledge.

---

## 2. Tech Stack & Justification

> Do not deviate from this stack without flagging it explicitly.

### Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR for public menu pages (SEO + speed), RSC for dashboard |
| Styling | **Tailwind CSS v3** | Utility-first, no runtime CSS-in-JS overhead |
| UI Components | **shadcn/ui** | Accessible, unstyled-by-default, copy-paste components |
| State Management | **Zustand** | Lightweight, no boilerplate, works well with RSC |
| Server State / Cache | **TanStack Query v5** | Consistent data fetching, optimistic updates, background sync |
| Forms | **React Hook Form + Zod** | Same Zod schemas shared with backend validation |
| Animation | **Framer Motion** | Menu transitions, loading states, micro-interactions |
| Rich Text | **Tiptap** | For menu item descriptions (optional, progressive) |
| Internationalisation | **next-intl** | English + Hindi support from day 1 |
| Image Optimisation | **Next.js `<Image />`** | Lazy loading, WebP conversion, CDN-aware |

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Stable, broad ecosystem, Vercel-native |
| API Layer | **Next.js Route Handlers** | Co-located with frontend; avoid separate Express server |
| Database | **PostgreSQL 15** (via Supabase) | ACID, row-level security, JSON columns |
| ORM | **Drizzle ORM** | Type-safe, SQL-first, no magic, fast migrations |
| Auth | **Supabase Auth** | Email/OTP, Google OAuth; RLS integration |
| File Storage | **Supabase Storage** | Integrated with Supabase Auth; CDN backed |
| Email | **Resend + React Email** | Transactional email with React templates |
| Payments | **Razorpay** | UPI, cards, net banking; webhook-first |
| Background Jobs | **Inngest** | Durable functions for async jobs (invoice gen, email queues) |
| QR Generation | **qrcode** (npm) | Server-side, returns SVG or PNG buffer |
| PDF Generation | **@react-pdf/renderer** | QR print sheet generation, GST invoices |
| Caching | **Vercel KV (Redis)** | Rate limiting, session tokens, plan cache |
| Observability | **Sentry** (errors) + **Axiom** (logs) | Full-stack error tracing |
| Analytics (internal) | **PostHog** | Event tracking, funnels, session replay |

### Infrastructure
| Layer | Choice |
|---|---|
| Hosting | **Vercel** (frontend + API routes) |
| Database | **Supabase** (managed Postgres) |
| CDN | **Vercel Edge Network** |
| CI/CD | **GitHub Actions** |
| Secrets | **Vercel Environment Variables** |
| Branch previews | **Vercel Preview Deployments** |

---

## 3. Repository Structure

```
scanserve/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group — login, signup, verify
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify/
│   ├── (dashboard)/              # Protected — restaurant owner portal
│   │   ├── layout.tsx            # Sidebar + nav shell
│   │   ├── page.tsx              # Dashboard home
│   │   ├── menu/
│   │   │   ├── page.tsx          # Menu list
│   │   │   ├── [menuId]/
│   │   │   │   ├── page.tsx      # Menu editor
│   │   │   │   └── categories/
│   │   │   └── new/
│   │   ├── qr/                   # QR management & print
│   │   ├── orders/               # Incoming orders (Pro+)
│   │   ├── analytics/            # Scan + order analytics
│   │   ├── settings/
│   │   │   ├── profile/
│   │   │   ├── billing/
│   │   │   └── team/
│   │   └── branches/             # Multi-branch (Business plan)
│   ├── (public)/                 # No auth required
│   │   └── m/[slug]/             # Public-facing menu page (Guest view)
│   ├── (admin)/                  # Super-admin panel
│   │   └── ...
│   └── api/                      # Route Handlers
│       ├── auth/
│       ├── menus/
│       ├── categories/
│       ├── items/
│       ├── orders/
│       ├── qr/
│       ├── analytics/
│       ├── billing/
│       └── webhooks/
│           ├── razorpay/
│           └── supabase/
├── components/
│   ├── ui/                       # shadcn/ui components (auto-generated)
│   ├── dashboard/                # Dashboard-specific components
│   ├── menu/                     # Menu editor components
│   ├── public/                   # Guest menu view components
│   └── shared/                   # Used in both
├── lib/
│   ├── db/
│   │   ├── index.ts              # Drizzle client
│   │   ├── schema.ts             # All table definitions
│   │   └── migrations/           # Drizzle migration files
│   ├── auth/
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── client.ts             # Browser Supabase client
│   ├── razorpay/
│   │   ├── client.ts
│   │   └── plans.ts              # Plan definitions + limits
│   ├── qr/
│   │   └── generator.ts          # QR generation utilities
│   ├── email/
│   │   └── templates/            # React Email templates
│   ├── validations/
│   │   └── schemas.ts            # All shared Zod schemas
│   ├── utils/
│   │   ├── slugify.ts
│   │   ├── format.ts             # INR formatter, date formatters
│   │   └── cn.ts                 # clsx + tailwind-merge
│   └── constants.ts              # App-wide constants
├── hooks/                        # Custom React hooks
├── store/                        # Zustand stores
├── types/                        # Global TypeScript types
├── public/
│   ├── fonts/
│   └── images/
├── emails/                       # React Email templates
├── scripts/                      # DB seed, migration helpers
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                      # Playwright
├── .env.example
├── .env.local                    # Never committed
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts                 # Auth + rate limiting
└── README.md
```

---

## 4. Environment Variables

Create `.env.local` from `.env.example`. Never commit secrets.

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ScanServe
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server only. Never expose to client.
SUPABASE_JWT_SECRET=

# Database (direct Drizzle connection)
DATABASE_URL=                       # postgres://... (pooled via pgBouncer)
DATABASE_URL_DIRECT=                # For migrations only (non-pooled)

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=        # Safe for client
RAZORPAY_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@scanserve.in

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                  # CI/CD only

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Vercel KV (Redis)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Cloudinary (menu item images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Feature Flags (simple env-based, migrate to PostHog flags when needed)
NEXT_PUBLIC_FF_TABLE_ORDERING=false
NEXT_PUBLIC_FF_UPI_PAYMENTS=false
```

---

## 5. Database Schema

> Use Drizzle ORM. Every table must have `created_at` and `updated_at`. Use UUIDs for all PKs. Enable Row Level Security (RLS) on all tables via Supabase. Write RLS policies alongside schema definitions.

```sql
-- Conceptual schema (implement in Drizzle, not raw SQL)

-- TENANTS (one per restaurant business / owner account)
tenants (
  id             UUID PK DEFAULT gen_random_uuid(),
  owner_id       UUID FK → auth.users(id) UNIQUE,
  name           TEXT NOT NULL,                  -- "Sharma Ji ka Dhaba"
  slug           TEXT UNIQUE NOT NULL,           -- "sharma-ji-ka-dhaba" (URL-safe)
  phone          TEXT,
  email          TEXT,
  plan           TEXT NOT NULL DEFAULT 'free',   -- free | starter | pro | business
  plan_expires_at TIMESTAMPTZ,
  trial_ends_at  TIMESTAMPTZ,
  is_active      BOOLEAN DEFAULT true,
  logo_url       TEXT,
  address        JSONB,                          -- { line1, city, state, pincode }
  gst_number     TEXT,
  settings       JSONB DEFAULT '{}',             -- timezone, currency, theme preferences
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)

-- BRANCHES (one tenant has 1+ branches)
branches (
  id             UUID PK DEFAULT gen_random_uuid(),
  tenant_id      UUID FK → tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  slug           TEXT NOT NULL,                  -- unique within tenant
  address        JSONB,
  phone          TEXT,
  is_active      BOOLEAN DEFAULT true,
  UNIQUE(tenant_id, slug),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)

-- TEAM MEMBERS (staff with scoped access)
team_members (
  id             UUID PK DEFAULT gen_random_uuid(),
  tenant_id      UUID FK → tenants(id) ON DELETE CASCADE,
  user_id        UUID FK → auth.users(id),
  role           TEXT NOT NULL,                  -- owner | manager | staff
  branch_id      UUID FK → branches(id),         -- NULL = all branches
  is_active      BOOLEAN DEFAULT true,
  UNIQUE(tenant_id, user_id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)

-- MENUS (a branch can have multiple menus, one active at a time)
menus (
  id             UUID PK DEFAULT gen_random_uuid(),
  tenant_id      UUID FK → tenants(id) ON DELETE CASCADE,
  branch_id      UUID FK → branches(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,                  -- "Lunch Menu", "Dinner Menu"
  slug           TEXT NOT NULL,                  -- used in public URL
  description    TEXT,
  is_active      BOOLEAN DEFAULT false,          -- only one active per branch
  is_public      BOOLEAN DEFAULT true,
  theme          JSONB DEFAULT '{}',             -- primary_color, font, logo_url overrides
  language       TEXT DEFAULT 'en',             -- en | hi | ta | te | bn
  scan_count     BIGINT DEFAULT 0,              -- cached; updated async
  UNIQUE(branch_id, slug),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)

-- CATEGORIES
categories (
  id             UUID PK DEFAULT gen_random_uuid(),
  menu_id        UUID FK → menus(id) ON DELETE CASCADE,
  tenant_id      UUID FK → tenants(id),
  name           TEXT NOT NULL,
  name_hi        TEXT,                           -- Hindi translation
  description    TEXT,
  image_url      TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)

-- MENU ITEMS
items (
  id             UUID PK DEFAULT gen_random_uuid(),
  category_id    UUID FK → categories(id) ON DELETE CASCADE,
  menu_id        UUID FK → menus(id) ON DELETE CASCADE,
  tenant_id      UUID FK → tenants(id),
  name           TEXT NOT NULL,
  name_hi        TEXT,
  description    TEXT,
  description_hi TEXT,
  price          NUMERIC(10, 2) NOT NULL,
  compare_price  NUMERIC(10, 2),                -- Crossed-out original price
  image_url      TEXT,
  is_veg         BOOLEAN,                       -- true=veg, false=non-veg, NULL=not applicable
  is_available   BOOLEAN DEFAULT true,          -- real-time toggle
  is_featured    BOOLEAN DEFAULT false,
  is_spicy       BOOLEAN DEFAULT false,
  tags           TEXT[] DEFAULT '{}',            -- ["bestseller", "new", "chef's special"]
  allergens      TEXT[] DEFAULT '{}',            -- ["nuts", "dairy", "gluten"]
  sort_order     INTEGER NOT NULL DEFAULT 0,
  calories       INTEGER,
  customisations JSONB DEFAULT '[]',             -- variants, add-ons (see spec §10.3)
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)

-- ORDERS (Pro+ plan)
orders (
  id             UUID PK DEFAULT gen_random_uuid(),
  tenant_id      UUID FK → tenants(id) ON DELETE CASCADE,
  branch_id      UUID FK → branches(id),
  menu_id        UUID FK → menus(id),
  order_number   TEXT NOT NULL,                 -- human-readable: #0001
  table_number   TEXT,
  customer_name  TEXT,
  customer_phone TEXT,
  status         TEXT NOT NULL DEFAULT 'pending', -- pending|confirmed|preparing|ready|completed|cancelled
  items          JSONB NOT NULL,                -- snapshot of ordered items at time of order
  subtotal       NUMERIC(10, 2) NOT NULL,
  tax_amount     NUMERIC(10, 2) DEFAULT 0,
  discount       NUMERIC(10, 2) DEFAULT 0,
  total          NUMERIC(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'unpaid',         -- unpaid|paid|partial|refunded
  payment_method TEXT,                          -- upi|cash|card
  razorpay_order_id TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)

-- ORDER ITEMS (normalised line items)
order_items (
  id             UUID PK DEFAULT gen_random_uuid(),
  order_id       UUID FK → orders(id) ON DELETE CASCADE,
  item_id        UUID FK → items(id),
  item_name      TEXT NOT NULL,                 -- snapshot at time of order
  item_price     NUMERIC(10, 2) NOT NULL,
  quantity       INTEGER NOT NULL,
  customisations JSONB DEFAULT '{}',
  notes          TEXT
)

-- SCANS (analytics — append only, never update)
scans (
  id             UUID PK DEFAULT gen_random_uuid(),
  menu_id        UUID FK → menus(id) ON DELETE CASCADE,
  tenant_id      UUID FK → tenants(id),
  branch_id      UUID FK → branches(id),
  table_number   TEXT,
  user_agent     TEXT,
  ip_hash        TEXT,                          -- SHA-256 of IP, never raw IP
  country        TEXT,
  city           TEXT,
  session_id     TEXT,                          -- anonymous browser session
  created_at     TIMESTAMPTZ DEFAULT now()
  -- NO updated_at — append-only
)

-- SUBSCRIPTIONS (billing history)
subscriptions (
  id                  UUID PK DEFAULT gen_random_uuid(),
  tenant_id           UUID FK → tenants(id) ON DELETE CASCADE,
  plan                TEXT NOT NULL,
  status              TEXT NOT NULL,            -- active|past_due|cancelled|trialing
  razorpay_sub_id     TEXT UNIQUE,
  razorpay_plan_id    TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
)

-- QR CODES (generated assets)
qr_codes (
  id             UUID PK DEFAULT gen_random_uuid(),
  tenant_id      UUID FK → tenants(id) ON DELETE CASCADE,
  menu_id        UUID FK → menus(id) ON DELETE CASCADE,
  branch_id      UUID FK → branches(id),
  table_number   TEXT,                          -- NULL = generic menu QR
  url            TEXT NOT NULL,                 -- the URL encoded in QR
  image_url      TEXT,                          -- stored PNG in Supabase Storage
  print_url      TEXT,                          -- PDF print sheet URL
  created_at     TIMESTAMPTZ DEFAULT now()
)
```

### Drizzle Implementation Notes

- Define all tables in `lib/db/schema.ts` using `pgTable` from `drizzle-orm/pg-core`
- Export inferred types: `type Tenant = typeof tenants.$inferSelect`
- Use `drizzle-kit generate:pg` for migrations
- Run migrations via `drizzle-kit push:pg` in local dev; via CI/CD GitHub Action in production
- Always use **transactions** when writing to multiple tables in one operation
- Index columns used in WHERE clauses: `tenant_id`, `menu_id`, `branch_id`, `slug`, `is_active`, `created_at`

### RLS Policies (Supabase)

```sql
-- Tenants: users can only see their own tenant
CREATE POLICY "tenant_isolation" ON tenants
  USING (owner_id = auth.uid());

-- Menus: members of the tenant can read; only owner/manager can write
CREATE POLICY "menu_read" ON menus
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Public menus: unauthenticated guests can read active public menus
CREATE POLICY "public_menu_read" ON menus
  FOR SELECT USING (is_public = true AND is_active = true);

-- Apply similar layered policies to: categories, items, orders, scans
```

---

## 6. Backend Architecture

### Middleware (`middleware.ts`)

```
Request → [Rate Limiter] → [Auth Checker] → [Plan Gate] → Route Handler
```

- **Rate limiter:** Redis-backed, per-IP and per-user. Limits: 60 req/min (guest), 300 req/min (authed user). Public menu endpoint: 1000 req/min per menu slug (CDN-cached).
- **Auth checker:** Verify Supabase JWT on all `/api/*` routes except `/api/webhooks/*` and public menu data endpoints.
- **Plan gate:** Middleware reads plan from cached Redis key (TTL 5 min). Rejects requests to plan-locked API routes with HTTP 402.

### Route Handler Conventions

Every route handler must follow this pattern:

```typescript
// app/api/menus/route.ts
import { withAuth } from "@/lib/auth/middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { menuCreateSchema } from "@/lib/validations/schemas";

export const GET = withAuth(withRateLimit(async (req, { user, tenant }) => {
  // 1. Parse & validate input (Zod)
  // 2. Authorisation check (does user have permission for this resource?)
  // 3. Business logic
  // 4. Return typed response
}));
```

- All responses follow a consistent envelope: `{ data, error, meta }`
- Never expose raw database errors to clients — log them, return a sanitised message
- All mutations must be idempotent where possible
- Use HTTP status codes correctly: 200, 201, 400, 401, 403, 404, 409, 422, 429, 500

### Service Layer

Separate business logic from route handlers. Place in `lib/services/`:

```
lib/services/
├── menu.service.ts
├── item.service.ts
├── order.service.ts
├── qr.service.ts
├── analytics.service.ts
└── billing.service.ts
```

No Drizzle queries in route handlers — only service calls. Route handlers handle HTTP concerns only.

### Webhook Handlers

- Razorpay webhooks: verify HMAC-SHA256 signature before processing. Idempotent via order ID.
- Supabase webhooks: verify JWT secret header.
- All webhooks respond with HTTP 200 immediately, process async via Inngest.

---

## 7. API Specification

> All endpoints are prefixed `/api/v1/`. Versioning is mandatory.

### Authentication
```
POST   /api/v1/auth/send-otp          Body: { phone | email }
POST   /api/v1/auth/verify-otp        Body: { token, phone | email }
POST   /api/v1/auth/refresh            (handled by Supabase client)
DELETE /api/v1/auth/session            Sign out
```

### Onboarding
```
POST   /api/v1/onboarding/tenant       Create tenant + default branch + free plan
POST   /api/v1/onboarding/menu         Create first menu from template
```

### Menus
```
GET    /api/v1/menus                   List all menus for tenant
POST   /api/v1/menus                   Create menu
GET    /api/v1/menus/:id               Get menu with categories + items
PATCH  /api/v1/menus/:id               Update menu metadata
DELETE /api/v1/menus/:id               Soft delete (set is_active=false)
POST   /api/v1/menus/:id/activate      Set as active menu for branch
POST   /api/v1/menus/:id/duplicate     Clone a menu
GET    /api/v1/menus/:id/export        Export menu as JSON
POST   /api/v1/menus/import            Import menu from JSON
```

### Categories
```
GET    /api/v1/menus/:menuId/categories
POST   /api/v1/menus/:menuId/categories
PATCH  /api/v1/categories/:id
DELETE /api/v1/categories/:id
POST   /api/v1/categories/reorder      Body: [{ id, sort_order }]
```

### Items
```
GET    /api/v1/categories/:categoryId/items
POST   /api/v1/categories/:categoryId/items
GET    /api/v1/items/:id
PATCH  /api/v1/items/:id
DELETE /api/v1/items/:id
PATCH  /api/v1/items/:id/availability  Body: { is_available: boolean } — fast toggle
POST   /api/v1/items/bulk              Create or update multiple items at once
POST   /api/v1/items/reorder           Body: [{ id, sort_order }]
POST   /api/v1/items/:id/image         Multipart upload → Cloudinary
```

### Public Menu (unauthenticated)
```
GET    /api/v1/public/menu/:slug               Full menu data for guest view
POST   /api/v1/public/menu/:slug/scan          Record a scan event (fire-and-forget)
POST   /api/v1/public/menu/:slug/orders        Place order (Pro+ plan)
GET    /api/v1/public/orders/:id/status        Order status polling
```

### QR Codes
```
POST   /api/v1/qr/generate             Body: { menu_id, table_number?, style? }
GET    /api/v1/qr/:id/download         Returns PNG or PDF
GET    /api/v1/qr/print-sheet          PDF with multiple QRs for all tables
```

### Orders
```
GET    /api/v1/orders                  List orders (with filters: status, date range)
GET    /api/v1/orders/:id
PATCH  /api/v1/orders/:id/status       Update order status
POST   /api/v1/orders/:id/cancel
GET    /api/v1/orders/export           CSV export
```

### Analytics
```
GET    /api/v1/analytics/overview      { scans, orders, revenue } for date range
GET    /api/v1/analytics/scans         Scan time series
GET    /api/v1/analytics/items         Top items by views and orders
GET    /api/v1/analytics/peak-hours    Hourly scan distribution
```

### Billing
```
GET    /api/v1/billing/plans           Available plans + features
GET    /api/v1/billing/subscription    Current subscription status
POST   /api/v1/billing/subscribe       Create Razorpay subscription
POST   /api/v1/billing/cancel          Cancel at period end
GET    /api/v1/billing/invoices        Invoice history
GET    /api/v1/billing/invoices/:id    Download invoice PDF
POST   /api/v1/billing/portal          Redirect to Razorpay customer portal
```

### Webhooks
```
POST   /api/v1/webhooks/razorpay       Payment events (signature verified)
POST   /api/v1/webhooks/supabase       Auth events (new user signup)
```

---

## 8. Frontend Architecture

### Page Map

| Route | Auth | Description |
|---|---|---|
| `/` | No | Marketing landing page |
| `/login` | No | Phone OTP or email login |
| `/signup` | No | New account creation |
| `/onboarding` | Yes | First-time setup wizard (3 steps) |
| `/dashboard` | Yes | Home — metrics, quick actions |
| `/menu` | Yes | Menu list |
| `/menu/new` | Yes | Create menu wizard |
| `/menu/[id]` | Yes | Menu editor (categories + items) |
| `/menu/[id]/preview` | Yes | Preview as customer |
| `/qr` | Yes | QR codes + print |
| `/orders` | Yes | Order stream (Pro+) |
| `/analytics` | Yes | Charts + reports |
| `/settings/profile` | Yes | Tenant profile + logo |
| `/settings/billing` | Yes | Plan + payment |
| `/settings/team` | Yes | Invite team (Pro+) |
| `/m/[slug]` | No | **Public guest menu** |
| `/m/[slug]/order/[id]` | No | Order confirmation for guest |

### Component Design Principles

1. **Mobile-first:** All dashboard pages must be fully usable on a 375px viewport. Restaurant owners use phones.
2. **Loading states:** Every async action shows a skeleton or spinner. No blank screens.
3. **Optimistic updates:** Toggling item availability must feel instant. Update UI immediately, revert on error.
4. **Error boundaries:** Wrap every major section. Errors in one section must not crash the whole page.
5. **Accessibility:** All interactive elements keyboard-navigable. ARIA labels on icons. Contrast ratio ≥ 4.5:1.
6. **Offline awareness:** Show a banner if the user goes offline. Queue availability toggles locally.

### Public Menu Page (`/m/[slug]`) — Critical

This page is viewed by thousands of customers. It must:

- **Render server-side** — use Next.js `generateStaticParams` for known slugs; fall back to ISR with 60s revalidation
- **Load in under 2 seconds on 3G** — target LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Work without JavaScript** — core menu browsing must work with JS disabled
- **Never require login** — 0 auth barriers for the customer
- **Support deep links** — `/m/slug#category-name` scrolls to that category
- **Handle unavailable items gracefully** — show "Currently unavailable" badge, not 404

### Design System

```
Colors (CSS variables):
  --brand:        #ea580c       (orange — primary action)
  --brand-light:  #fff7ed
  --brand-dark:   #c2410c
  --surface:      #ffffff
  --surface-alt:  #fafaf9
  --border:       #e7e5e4
  --text-primary: #0c0a09
  --text-muted:   #78716c
  --success:      #16a34a
  --warning:      #ca8a04
  --error:        #dc2626
  --veg:          #16a34a       (green dot — veg indicator)
  --nonveg:       #dc2626       (red dot — non-veg)

Typography:
  Display:   'Syne' (headings, logo, large numbers)
  Body:      'DM Sans' (all other text)
  Mono:      'JetBrains Mono' (order numbers, codes)

Spacing scale: 4px base (Tailwind defaults)
Border radius: sm=4px, md=8px, lg=12px, xl=16px, full=9999px
```

---

## 9. Authentication & Authorisation

### Auth Flow

1. User enters phone number → Supabase sends OTP via SMS (Twilio/MSG91)
2. User enters OTP → Supabase returns access + refresh token
3. Tokens stored in `httpOnly` cookies (not localStorage)
4. Middleware checks token on every `/dashboard/**` and `/api/**` request
5. On expiry, refresh token silently rotates the access token

### Authorisation Levels

```
PLAN FEATURE MATRIX:
                          Free    Starter    Pro       Business
─────────────────────────────────────────────────────────────────
Menus                       1        3         10        Unlimited
Items per menu             20    Unlimited  Unlimited  Unlimited
Categories                  3       10        Unlimited  Unlimited
QR codes                    1        5         20        Unlimited
Table-side ordering         ✗        ✗         ✓          ✓
Hindi menu                  ✗        ✓         ✓          ✓
Custom branding             ✗        ✓         ✓          ✓
Order alerts                ✗        ✗         ✓          ✓
Analytics (days)           7        30         90        365
Team members                1        2         5         20
Branches                    1        1         3         10
UPI payments at table       ✗        ✗         ✗          ✓
Priority support            ✗        ✗         ✓          ✓
```

### Plan Enforcement

- Enforce on **server-side only** — never trust client-sent plan info
- Cache plan in Redis with 5-minute TTL (key: `plan:tenant:{tenantId}`)
- Return HTTP 402 with `{ error: "plan_limit_exceeded", limit: "menus", max: 3, upgrade_url: "/settings/billing" }`
- Frontend reads this error code and shows an upgrade prompt — never a generic error

---

## 10. Feature Specifications

### 10.1 Onboarding Wizard (critical — must be perfect)

3-step wizard shown to all new users before dashboard:

**Step 1 — Restaurant Details**
- Fields: restaurant name, phone, city, cuisine type (multi-select), logo upload (optional)
- Validation: name required (3–80 chars), phone must be valid Indian mobile number
- Auto-generate slug from restaurant name (check uniqueness; append -2, -3 if taken)

**Step 2 — First Menu**
- Pre-loaded templates by cuisine type: "Indian", "Chinese", "Fast Food", "Cafe", "Bakery", "Custom"
- Selecting a template pre-fills categories and sample items the owner can edit
- Owner can skip templates and start blank

**Step 3 — QR Code**
- Show generated QR code immediately
- Offer: "Download PNG" and "Print Sheet (A4 PDF)"
- Option: send QR to WhatsApp via `https://wa.me/?text=...`

On wizard complete: redirect to `/dashboard` with a confetti animation.

### 10.2 Menu Editor

- **Drag-and-drop** reordering of categories and items (using `@dnd-kit/core`)
- **Inline editing:** click any field to edit in place — no modal required for simple edits
- **Bulk actions:** select multiple items → mark available/unavailable, change category, delete
- **Search:** live search bar that filters items across all categories
- **Auto-save:** debounce 800ms on any text change; show "Saving..." → "Saved" indicator
- **Undo:** CMD+Z / shake gesture on mobile to undo last change (Zustand state history)
- **Image upload:** drag or tap to upload; show upload progress; auto-compress to max 800px wide
- **Preview button:** opens `/m/[slug]?preview=true` in a new tab (preview mode shows draft changes)

### 10.3 Menu Item Customisations

Items can have optional customisation groups for variants and add-ons:

```json
{
  "customisations": [
    {
      "id": "size",
      "name": "Size",
      "type": "single",
      "required": true,
      "options": [
        { "id": "half", "name": "Half", "price_delta": 0 },
        { "id": "full", "name": "Full", "price_delta": 50 }
      ]
    },
    {
      "id": "addons",
      "name": "Add Ons",
      "type": "multiple",
      "required": false,
      "max": 3,
      "options": [
        { "id": "cheese", "name": "Extra Cheese", "price_delta": 30 },
        { "id": "sauce", "name": "Extra Sauce", "price_delta": 10 }
      ]
    }
  ]
}
```

### 10.4 Availability Toggle

The single most used feature. Must be:
- **Accessible from the menu editor** — one tap per item
- **Accessible from a dedicated "Availability" quick-view screen** — shows all items as a flat list with toggles; optimised for front-of-house staff to mark sold-out items fast during service
- **Instant** — optimistic update, no spinner; revert silently on error
- **Reflected immediately on the guest-facing menu** — ISR revalidation or Supabase Realtime subscription on the guest page

### 10.5 QR Code Generation

QR codes encode the URL: `https://scanserve.in/m/{slug}?t={tableNumber}&qr={qrId}`

The `qrId` allows tracking which specific QR was scanned (which table, which physical print).

Generation options:
- **Size:** Small (200px), Medium (400px), Large (800px)
- **Format:** PNG (default), SVG, PDF print sheet
- **Style:** Standard black/white, or branded with restaurant logo in centre
- **Print sheet:** A4 PDF with 6×QR on one page, each labelled with table number

### 10.6 Real-time Order Stream (Pro+)

- Use Supabase Realtime subscriptions on the `orders` table
- New orders trigger: browser notification (if permission granted), audio chime, badge on Orders nav item
- Order card shows: order number, table, items, total, time since placed
- Status update is a single-tap action per order card
- Auto-refresh every 30 seconds as fallback (in case Realtime disconnects)

### 10.7 Analytics Dashboard

- **Scan trend chart:** Daily scan count for selected date range (line chart)
- **Peak hours heatmap:** Hour-of-day × day-of-week grid (like GitHub contributions)
- **Top items:** Ranked by scan-to-order conversion (if orders enabled)
- **Device breakdown:** Mobile / tablet / desktop pie chart (from user agent)
- **Export:** CSV download of raw scan data for the selected date range
- Date range picker: Today, Last 7 days, Last 30 days, Last 90 days, Custom

---

## 11. Edge Cases & Error Handling

> Implement every case listed here. These are not optional.

### Onboarding
- Slug collision: auto-increment suffix (`sharma-dhaba` → `sharma-dhaba-2`) — never surface slug conflicts to the user
- Duplicate phone sign-up: if phone exists in `auth.users`, send login OTP, not signup
- User closes browser mid-onboarding: persist wizard state in localStorage; resume on next visit
- Logo upload fails: onboarding continues without logo — not a blocking error

### Menu & Items
- Deleting a category with items: prompt user to reassign items to another category OR delete all. Never silently delete items.
- Activating a menu while another is already active: confirm dialog; deactivate the previous menu atomically in a transaction
- Concurrent edits (two devices): last-write-wins with `updated_at` conflict detection; show "Menu was updated on another device — refresh to see latest"
- 0-item menu: prevent activation; show contextual error "Add at least 1 item to activate this menu"
- Item price = 0: valid (complimentary items); allow but warn during activation
- Image upload > 5MB: client-side validation before upload; show size limit message
- Invalid image format: accept JPEG, PNG, WebP only; reject GIF, SVG, HEIC with clear message
- Menu with only unavailable items: guest page shows "Menu items are currently unavailable. Please ask staff." — not a blank/error page
- Slug change: redirecting old slug to new slug for 90 days via a `slug_redirects` table

### Guest Menu Page
- Slug not found: custom branded 404 page, not Next.js default
- Menu is inactive/deleted: "This menu is not available right now. Please ask the restaurant for assistance."
- Restaurant account cancelled/suspended: same as above — do not expose billing reason
- XSS in menu content: all user-generated content rendered through `DOMPurify` or React's default escaping — never `dangerouslySetInnerHTML` without sanitisation
- Very long item names: truncate to 2 lines with ellipsis; full text on tap
- Zero items in category: hide the category from guest view entirely
- Network failure while loading menu: show cached version from service worker + "You're offline" banner

### Orders
- Customer places duplicate order (double-tap): enforce idempotency key (`X-Idempotency-Key` header) on the POST order endpoint
- Order placed for unavailable item: validate item availability at order placement time (server-side); return 409 with specific item names
- Payment initiated but not completed: order stays `pending`; Razorpay webhook updates to `paid`; timeout after 30 minutes → auto-cancel pending orders
- Razorpay webhook arrives twice (retry): idempotent handler — check `razorpay_order_id` in DB before processing
- Order total mismatch (price changed between menu load and order placement): server recalculates total from DB prices; reject order if delta > ₹1; return error with correct prices

### Billing
- Card decline: show Razorpay's specific decline reason (card expired, insufficient funds, etc.); do not show generic "payment failed"
- Subscription renewal fails: grace period of 3 days; send WhatsApp + email reminder daily; downgrade to free after grace period
- Downgrade from Pro to Starter: if tenant has more than 3 menus, prompt to deactivate extras before downgrading; never auto-delete
- Concurrent webhook + API call: use Postgres advisory locks on tenant billing operations
- Razorpay webhook signature validation failure: log with full payload, return 400, alert via Sentry

### Auth
- OTP expired: clear error message with "Resend OTP" button; 60-second cooldown between resends
- OTP brute force: lock after 5 failed attempts for 15 minutes; Redis-backed counter
- Concurrent sessions: allowed; session invalidation is global (all devices signed out on explicit logout)
- Phone number change: require OTP verification of new number; old number receives "number changed" SMS

### Performance & Infrastructure
- Supabase outage: menu pages served from Vercel CDN cache (stale-while-revalidate). Dashboard shows error banner.
- Vercel function timeout (10s limit): all DB queries must complete within 5s; use streaming responses for export endpoints
- Database connection pool exhaustion: pgBouncer handles pooling; handle `too many connections` error with retry and user-facing message
- Large menu (100+ items): paginate item API response (cursor-based pagination, 50 items/page); lazy-load categories on guest page

---

## 12. Performance Requirements

### Core Web Vitals (Public Menu Page)
| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 2.0s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.05 |
| TTFB (Time to First Byte) | < 200ms |

### API Response Times (p95)
| Endpoint | Target |
|---|---|
| `GET /public/menu/:slug` | < 100ms (from CDN cache) |
| `PATCH /items/:id/availability` | < 200ms |
| `POST /orders` | < 500ms |
| `GET /analytics/overview` | < 1000ms |
| Any dashboard GET | < 500ms |

### Implementation Requirements
- Enable `stale-while-revalidate` CDN caching on public menu endpoints (60s)
- Use database indexes on every foreign key and every column used in WHERE/ORDER BY
- Enable `EXPLAIN ANALYZE` in development to catch slow queries — target < 50ms per query
- Compress all API responses with `gzip` (Vercel does this automatically)
- All images served via Cloudinary with `f_auto,q_auto` transformation parameters
- Use `React.lazy` + `Suspense` for non-critical dashboard widgets
- Bundle size: keep initial JS bundle under 150KB (gzipped). Audit with `@next/bundle-analyzer`

---

## 13. Security Checklist

> Every item below must be implemented before launch.

### API Security
- [ ] All authenticated API routes verify JWT on every request (never trust session cookies alone)
- [ ] Input validation with Zod on every route handler — reject unknown fields with `strict()`
- [ ] SQL injection prevention: Drizzle ORM parameterised queries only — no raw string interpolation
- [ ] Tenant isolation: every DB query that touches tenant data includes `WHERE tenant_id = ?` — no exceptions
- [ ] Razorpay webhook signature verified via HMAC-SHA256 before any processing
- [ ] Rate limiting on all public endpoints (see §6)
- [ ] CORS: whitelist `scanserve.in` and `*.scanserve.in` only
- [ ] Remove all `X-Powered-By` headers

### Data Security
- [ ] Never store raw IP addresses — store SHA-256 hash only (GDPR/Indian IT Act compliance)
- [ ] Never log sensitive fields: OTP codes, payment card details, passwords
- [ ] PII fields (phone, email) encrypted at rest via Supabase column encryption
- [ ] File uploads scanned for malware via Cloudinary's built-in moderation
- [ ] Supabase RLS enforced on every table — test with anonymous role in CI

### Frontend Security
- [ ] All user-generated content sanitised before render
- [ ] CSP headers: restrict `script-src`, `img-src`, `connect-src` to known origins
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] No sensitive data in `localStorage` — use `httpOnly` cookies for tokens
- [ ] HTTPS enforced everywhere — HSTS header with 1-year `max-age`
- [ ] Dependency audit: run `npm audit` in CI; fail on high/critical severity

### Compliance
- [ ] Privacy policy page at `/privacy`
- [ ] Terms of service at `/terms`
- [ ] Cookie consent banner (if analytics cookies used)
- [ ] Data deletion endpoint: `DELETE /api/v1/account` — removes all tenant data within 30 days
- [ ] DPDP Act (India) 2023 compliance: do not collect or share personal data of end customers without consent

---

## 14. Testing Strategy

### Unit Tests (Jest + Testing Library)
- All Zod schemas: test valid inputs, invalid inputs, boundary conditions
- All service functions: mock Drizzle, test business logic
- All utility functions: `slugify`, `formatINR`, `calculateOrderTotal`
- Coverage target: **80% line coverage minimum**

### Integration Tests (Jest + Supertest)
- Every API route handler: test auth, plan gates, happy path, error paths
- Webhook handlers: test with real Razorpay webhook payloads
- Database operations: test with a real test database (separate Supabase project)

### End-to-End Tests (Playwright)
- Onboarding wizard — complete flow
- Create menu → add category → add item → publish → scan QR
- Toggle item availability — verify reflected on guest page
- Place an order as guest — verify in dashboard
- Upgrade plan — verify feature unlock
- Sign out + back in

### Performance Testing
- Run Lighthouse CI on every PR for the public menu page
- Fail CI if LCP > 3s or performance score < 80

### Load Testing (before launch)
- Simulate 1,000 concurrent guests reading the same menu (k6 or Artillery)
- Simulate 100 restaurant owners simultaneously editing menus
- Ensure Supabase connection pool handles peak load

---

## 15. Deployment & Infra

### Environments
| Environment | Branch | URL |
|---|---|---|
| Production | `main` | `scanserve.in` |
| Staging | `staging` | `staging.scanserve.in` |
| Preview | Every PR | `{branch}.scanserve.vercel.app` |
| Local | `*` | `localhost:3000` |

### CI/CD Pipeline (GitHub Actions)

```yaml
# On every PR:
1. Lint (ESLint + Prettier check)
2. Type check (tsc --noEmit)
3. Unit + integration tests
4. Build check
5. Lighthouse CI (public menu page)
6. Security audit (npm audit)

# On merge to main:
1. All above
2. Run DB migrations (drizzle-kit push against staging first)
3. Deploy to Vercel production
4. Run smoke tests against production
5. Notify via Slack
```

### Database Migration Strategy
- **Never** run `drizzle-kit push` directly against production
- Migrations are run via CI/CD after staging validation
- All migrations must be backwards-compatible (add columns as nullable, deploy, then backfill, then add NOT NULL)
- Maintain a migration rollback script for every migration

### Monitoring & Alerts (post-launch)
- Sentry: alert on error rate > 1% or new error type
- Axiom: alert if API p95 latency > 2× baseline for 5 minutes
- Uptime monitor (BetterStack or similar): alert if `/m/{slug}` returns non-200 for > 60s
- Daily automated report: new signups, MRR, churn, top errors

---

## 16. Coding Conventions

### TypeScript
- `strict: true` in `tsconfig.json` — no exceptions
- No `any` types — use `unknown` and narrow with type guards
- All database entity types generated by Drizzle — never manually defined
- All API request/response bodies typed with Zod schemas, inferred to TS types

### Naming Conventions
```
Files:           kebab-case           → menu-editor.tsx
Components:      PascalCase           → MenuEditor
Hooks:           camelCase, "use" prefix → useMenuEditor
Services:        camelCase, "Service" suffix → menuService
DB table:        snake_case           → menu_items
Constants:       UPPER_SNAKE_CASE     → MAX_ITEMS_FREE_PLAN
Types:           PascalCase           → type MenuItem = ...
Zustand stores:  camelCase, "use" prefix → useMenuStore
```

### Git Conventions
```
Branch: feature/add-hindi-support
        fix/toggle-availability-race-condition
        chore/upgrade-drizzle
Commit: feat: add real-time order stream
        fix: prevent duplicate order on double-tap
        chore: update Razorpay SDK
```

### Code Quality
- ESLint config: `eslint-config-next` + `@typescript-eslint/recommended`
- Prettier: single quotes, 2-space indent, trailing comma, 100 char line width
- Pre-commit hooks via Husky: lint + type-check before every commit
- No commented-out code in PRs
- Every exported function must have a JSDoc comment

### Error Handling Pattern
```typescript
// Services throw typed errors
export class PlanLimitError extends Error {
  constructor(public readonly limit: string, public readonly max: number) {
    super(`Plan limit exceeded: ${limit}`);
    this.name = "PlanLimitError";
  }
}

// Route handlers catch and map to HTTP responses
try {
  const menu = await menuService.create(input);
  return NextResponse.json({ data: menu }, { status: 201 });
} catch (e) {
  if (e instanceof PlanLimitError) {
    return NextResponse.json({ error: "plan_limit_exceeded", limit: e.limit, max: e.max }, { status: 402 });
  }
  // Unexpected error — log, return generic message
  logger.error("menu.create.unexpected", { error: e, tenantId: tenant.id });
  return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
}
```

---

## Quick Start for AI Coding Agents

```bash
# 1. Clone the repo
git clone https://github.com/your-org/scanserve.git
cd scanserve

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.example .env.local
# Fill in all required variables — the app will not start without them

# 4. Set up the database
npx drizzle-kit push:pg

# 5. Seed development data
npm run db:seed

# 6. Start development server
npm run dev
```

**Before generating any feature code, read:**
1. The relevant section of this README
2. The existing service file for that domain (to understand patterns)
3. The existing schema for affected tables
4. The Zod schemas in `lib/validations/schemas.ts`

**Never:**
- Skip input validation
- Add plan feature logic on the client side
- Write raw SQL strings inside route handlers
- Use `any` in TypeScript
- Store tokens or secrets in localStorage
- Expose Supabase service role key to the client bundle

---

*Last updated: May 2026 — ScanServe v1.0 build target*
