import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DriverBoard, type DriverOrder } from '@/components/driver/DriverBoard';
import { DRIVER_COOKIE, verifyDriverToken } from '@/lib/auth/driver';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import type { Order, OrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تطبيق السائق', robots: { index: false } };

export default async function DriverPage() {
  if (!isSupabaseConfigured) redirect('/driver/login');
  const store = await cookies();
  const driverId = verifyDriverToken(store.get(DRIVER_COOKIE)?.value);
  if (!driverId) redirect('/driver/login');

  const admin = createAdminClient();
  const { data: driver } = await admin.from('drivers').select('name').eq('id', driverId).single();
  if (!driver) redirect('/driver/login');

  const { data } = await admin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('driver_id', driverId)
    .not('status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: false });

  const orders: DriverOrder[] = ((data as Order[]) ?? []).map((o) => ({
    id: o.id,
    code: o.code,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    city: o.city,
    address: o.address,
    landmark: o.landmark,
    latitude: o.latitude,
    longitude: o.longitude,
    status: o.status,
    total: o.total,
    items: (o.items ?? []).map((it: OrderItem) => ({
      product_name: it.product_name,
      size_name: it.size_name,
      quantity: it.quantity,
    })),
  }));

  return <DriverBoard driverName={driver.name} orders={orders} />;
}
