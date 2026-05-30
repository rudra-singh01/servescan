/**
 * Development seed script — run with: npm run db:seed
 */
import 'dotenv/config';

async function main() {
  console.log('Seed requires DATABASE_URL and running migrations first.');
  console.log('Use: npm run db:push && npm run db:seed');
  console.log('Demo data is created via onboarding flow in development.');
}

main().catch(console.error);
