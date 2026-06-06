import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { pushSubscriptionSchema } from '@/lib/validation';

/** حفظ اشتراك الإشعارات للزبون (آمن — عبر service_role) */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'بيانات غير صحيحة' }, { status: 422 });
  }
  const { code, endpoint, subscription } = parsed.data;

  // وضع المعاينة: لا تخزين
  if (!isSupabaseConfigured) return NextResponse.json({ ok: true, stored: false });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ order_code: code || null, endpoint, subscription }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ ok: false, error: 'تعذّر حفظ الاشتراك' }, { status: 500 });
  return NextResponse.json({ ok: true, stored: true });
}
