import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { seedCoupons } from '@/lib/data/seed';
import { couponSchema } from '@/lib/validation';
import type { Coupon } from '@/lib/types';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: 'بيانات غير صحيحة' }, { status: 400 });
  }
  const { code, subtotal } = parsed.data;

  // جلب الكوبون
  let coupon: Coupon | null = null;
  if (isSupabaseConfigured) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .limit(1)
      .single();
    coupon = (data as Coupon) ?? null;
  } else {
    coupon = seedCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? null;
  }

  if (!coupon || !coupon.is_active) {
    return NextResponse.json({ valid: false, error: 'الكوبون غير موجود أو غير مفعّل' }, { status: 404 });
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'انتهت صلاحية الكوبون' }, { status: 410 });
  }
  if (subtotal < coupon.min_order) {
    return NextResponse.json(
      { valid: false, error: `الحد الأدنى لاستخدام الكوبون ${coupon.min_order.toLocaleString('en-US')} د.ع` },
      { status: 422 },
    );
  }

  let discount = Math.round((subtotal * coupon.discount_percent) / 100);
  if (coupon.max_discount != null) discount = Math.min(discount, coupon.max_discount);

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discount,
    discount_percent: coupon.discount_percent,
  });
}
