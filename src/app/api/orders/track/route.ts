import { NextResponse } from 'next/server';
import { findOrder } from '@/lib/data/orders';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { trackSchema } from '@/lib/validation';

/** المسافة بالكيلومتر (Haversine) */
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' },
      { status: 422 },
    );
  }
  const { phone, code } = parsed.data;

  const order = await findOrder({
    code: code || undefined,
    phone: phone || undefined,
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: 'لم يتم العثور على الطلب' }, { status: 404 });
  }

  // التتبّع المباشر: موقع السائق + الوقت المتوقّع (عند «في الطريق»)
  let driver: { lat: number; lng: number; updated_at: string | null } | null = null;
  let etaMinutes: number | null = null;
  if (isSupabaseConfigured && order.status === 'on_the_way' && order.driver_id) {
    const admin = createAdminClient();
    const { data: d } = await admin
      .from('drivers')
      .select('latitude, longitude, location_updated_at')
      .eq('id', order.driver_id)
      .single();
    if (d?.latitude != null && d?.longitude != null) {
      driver = { lat: d.latitude, lng: d.longitude, updated_at: d.location_updated_at };
      if (order.latitude != null && order.longitude != null) {
        const km = distanceKm(d.latitude, d.longitude, order.latitude, order.longitude);
        etaMinutes = Math.max(1, Math.round((km / 25) * 60)); // متوسط سرعة 25 كم/س
      }
    }
  }

  // إرجاع بيانات آمنة للعرض العام
  return NextResponse.json({
    ok: true,
    order: {
      code: order.code,
      status: order.status,
      customer_name: order.customer_name,
      delivery_method: order.delivery_method,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      total: order.total,
      created_at: order.created_at,
      city: order.city,
      reviewed: !!order.reviewed_at,
      cust_lat: order.latitude,
      cust_lng: order.longitude,
      driver,
      eta_minutes: etaMinutes,
      items: order.items?.map((i) => ({
        product_name: i.product_name,
        size_name: i.size_name,
        quantity: i.quantity,
        line_total: i.line_total,
      })),
    },
  });
}
