import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const allowed = (process.env.SUPER_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
  if (!allowed.includes(user.email ?? '')) {
    redirect('/dashboard');
  }

  const allTenants = db ? await db.select().from(tenants).limit(50) : [];

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold">Super Admin</h1>
      <p className="text-text-muted">Platform tenant overview</p>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th className="py-2">Slug</th>
            <th className="py-2">Plan</th>
            <th className="py-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {allTenants.map((t) => (
            <tr key={t.id} className="border-b border-border">
              <td className="py-2">{t.name}</td>
              <td className="py-2">{t.slug}</td>
              <td className="py-2 capitalize">{t.plan}</td>
              <td className="py-2">{t.isActive ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
