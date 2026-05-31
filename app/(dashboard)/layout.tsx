import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardProviders } from '@/components/dashboard/dashboard-providers';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProviders>
      <div className="flex min-h-screen bg-surface-alt">
        <DashboardSidebar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </DashboardProviders>
  );
}
