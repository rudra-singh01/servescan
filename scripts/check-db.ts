/**
 * Quick DB connectivity check — run: npm run db:check
 */
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function main() {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_DIRECT;

  if (!url) {
    console.error('❌ DATABASE_URL_DIRECT / DATABASE_URL missing in .env.local');
    process.exit(1);
  }

  const masked = url.replace(/:([^:@/]+)@/, ':***@');
  console.log('Connecting to:', masked);

  const sql = postgres(url, {
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
    ssl: 'require',
  });

  try {
    const [row] = await sql`SELECT current_database() as db, version() as v`;
    console.log('✅ Connected — database:', row.db);
    console.log('   ', String(row.v).slice(0, 60) + '...');
    await sql.end();
    process.exit(0);
  } catch (e) {
    const err = e as Error;
    console.error('❌ Connection failed:', err.message);
    console.error('\nTips:');
    console.error('  1. Supabase → Connect → copy "Session pooler" URI (port 5432)');
    console.error('  2. Password special chars: @ → %40');
    console.error('  3. Verify REGION in host (aws-0-XXX.pooler.supabase.com)');
    process.exit(1);
  }
}

main();
