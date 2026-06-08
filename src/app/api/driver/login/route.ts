import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { DRIVER_COOKIE, driverCookieOptions, signDriverToken } from '@/lib/auth/driver';

export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'الخدمة غير متاحة' }, { status: 400 });
  }
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }
  const phone = (body.phone ?? '').trim();
  const code = (body.code ?? '').trim();
  if (!phone || !code) {
    return NextResponse.json({ ok: false, error: 'أدخل رقم الهاتف ورمز الدخول' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: driver } = await admin
    .from('drivers')
    .select('id, is_active')
    .eq('phone', phone)
    .eq('code', code)
    .limit(1)
    .single();

  if (!driver || !driver.is_active) {
    return NextResponse.json({ ok: false, error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(DRIVER_COOKIE, signDriverToken(driver.id), driverCookieOptions);
  return res;
}
