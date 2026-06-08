import { redirect } from 'next/navigation';
import { getStaffSession, roleAllowed } from '@/lib/auth/staff';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'شاشة المطبخ', robots: { index: false } };

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!roleAllowed(session?.role, ['owner', 'manager', 'admin', 'cashier', 'kitchen', 'staff'])) {
    redirect('/admin/login?redirect=/kitchen');
  }
  return <>{children}</>;
}
