import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit does not load .env.local automatically (unlike Next.js)
config({ path: '.env.local' });
config({ path: '.env' });

let url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'DATABASE_URL_DIRECT or DATABASE_URL is missing. Add a PostgreSQL URI to .env.local (Supabase → Connect → Drizzle).',
  );
}

if (!url.includes('connect_timeout')) {
  url += url.includes('?') ? '&connect_timeout=30' : '?connect_timeout=30';
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
    // drizzle-kit uses `pg` — needs this for Supabase pooler SSL (postgres.js works without it)
    ssl: { rejectUnauthorized: false },
  },
});
