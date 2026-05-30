/**
 * Apply Drizzle migrations using postgres.js (same driver as db:check).
 * Avoids drizzle-kit push + `pg` SSL hang on Supabase.
 */
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';

config({ path: '.env.local' });

const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!url) {
  console.error('❌ DATABASE_URL_DIRECT missing in .env.local');
  process.exit(1);
}

const migrationsFolder = path.join(process.cwd(), 'lib', 'db', 'migrations');

async function main() {
  console.log('Applying migrations from:', migrationsFolder);

  const sql = postgres(url, {
    max: 1,
    connect_timeout: 30,
    ssl: 'require',
  });

  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations applied successfully');
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('❌ Migration failed:', (e as Error).message);
  process.exit(1);
});
