import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { seedCoupons } from '@/lib/data/seed';
import { couponSchema } from '@/lib/validation';
import { evaluateCoupon } from '@/lib/coupons';
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
  const { code, subtotal, userId } = parsed.data;

  let coupon: Coupon | null = null;
  const admin = isSupabaseConfigured ? createAdminClient() : null;
  if (admin) {
    const { data } = await admin
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

  if (!coupon) {
    return NextResponse.json({ valid: false, error: 'الكوبون غير موجود أو غير مفعّل' }, { status: 404 });
  }

  const result = await evaluateCoupon(coupon, subtotal, { userId, admin });
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 422 });
  }

  return NextResponse.json({ valid: true, code: coupon.code, discount: result.discount });
}
