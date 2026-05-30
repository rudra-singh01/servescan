import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set — database operations will fail at runtime.');
}

const client = connectionString
  ? postgres(connectionString, { prepare: false, max: 10 })
  : (null as unknown as ReturnType<typeof postgres>);

// Initialize Drizzle client with admin privileges (bypasses RLS for server-side queries)
// Use this for server components and API routes. Client-side queries use Supabase client.
export const db = client ? drizzle(client, { schema }) : (null as unknown as ReturnType<typeof drizzle>);

export { schema };
