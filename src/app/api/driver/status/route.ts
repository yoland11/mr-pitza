import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { DRIVER_COOKIE, verifyDriverToken } from '@/lib/auth/driver';
import { notifyOrderStatus } from '@/lib/whatsapp';
import type { OrderStatus } from '@/lib/types';

const ALLOWED: OrderStatus[] = ['on_the_way', 'delivered'];

export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'الخدمة غير متاحة' }, { status: 400 });
  }
  const store = await cookies();
  const driverId = verifyDriverToken(store.get(DRIVER_COOKIE)?.value);
  if (!driverId) return NextResponse.json({ ok: false, error: 'انتهت الجلسة' }, { status: 401 });

  let body: { orderId?: string; status?: OrderStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }
  const { orderId, status } = body;
  if (!orderId || !status || !ALLOWED.includes(status)) {
    return NextResponse.json({ ok: false, error: 'حالة غير مسموحة' }, { status: 422 });
  }

  const admin = createAdminClient();
  // التأكد أن الطلب مُسند لهذا السائق
  const { data: order } = await admin.from('orders').select('id, driver_id').eq('id', orderId).single();
  if (!order || order.driver_id !== driverId) {
    return NextResponse.json({ ok: false, error: 'هذا الطلب غير مُسند لك' }, { status: 403 });
  }

  await admin.from('orders').update({ status }).eq('id', orderId);
  await admin
    .from('driver_assignments')
    .update({ status: status === 'delivered' ? 'delivered' : 'picked_up', updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('driver_id', driverId);

  // عند التسليم يعود السائق متاحاً
  if (status === 'delivered') {
    await admin.from('drivers').update({ status: 'available' }).eq('id', driverId);
  }

  try {
    await notifyOrderStatus(orderId);
  } catch {
    /* تجاهل */
  }

  return NextResponse.json({ ok: true });
}
