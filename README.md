# ScanServe

QR digital menu SaaS for Indian restaurants — built with Next.js 16, Drizzle ORM, and Supabase.

## Quick start

```bash
cp .env.example .env.local
# Fill Supabase, DATABASE_URL, and other keys

npm install
npm run db:push      # Apply schema to Postgres
# Run lib/db/rls.sql in Supabase SQL editor

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | Playwright E2E |
| `npm run db:push` | Push Drizzle schema |
| `npm run db:studio` | Drizzle Studio |

## Architecture

- **App Router** — `(auth)`, `(dashboard)`, `(public)/m/[slug]`, `(admin)`
- **API** — `/api/v1/*` with auth, rate limiting, plan gates
- **Services** — `lib/services/*` (no DB in route handlers)
- **Spec** — See [ScanServe_README.md](./ScanServe_README.md) for full product spec

## Environment

See [.env.example](./.env.example) for all required variables.

## License

Private — All rights reserved.
