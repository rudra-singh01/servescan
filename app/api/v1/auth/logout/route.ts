import { createClient } from '@/lib/auth/server';
import { success } from '@/lib/api/response';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return success({ loggedOut: true });
}
