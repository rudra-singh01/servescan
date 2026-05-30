import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { success, handleApiError } from '@/lib/api/response';
import { getUser } from '@/lib/auth/server';
import { authRegisterSchema } from '@/lib/validations/schemas';
import { ValidationError } from '@/lib/api/errors';
import { eq } from 'drizzle-orm';

/** Save profile after Supabase signUp (works before email verification session). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = authRegisterSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', parsed.error.flatten());
    }

    const { name, email, userId: bodyUserId } = parsed.data;

    const sessionUser = bodyUserId ? null : await getUser();
    const userId = bodyUserId ?? sessionUser?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!db) {
      return new Response(JSON.stringify({ error: 'database_unavailable' }), { status: 503 });
    }

    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ username: name, email })
        .where(eq(users.id, userId))
        .returning();
      return success(updated, 200);
    }

    const [created] = await db
      .insert(users)
      .values({
        id: userId,
        username: name,
        email,
      })
      .returning();

    return success(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
