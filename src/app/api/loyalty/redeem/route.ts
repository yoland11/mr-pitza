import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LOYALTY } from '@/lib/types';

/** استبدال النقاط بكوبون خصم شخصي */
export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'الخدمة غير متاحة' }, { status: 400 });
  }
  const server = await createServerSupabase();
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'يجب تسجيل الدخول' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('points').eq('id', user.id).single();
  const points = profile?.points ?? 0;
  if (points < LOYALTY.POINTS_PER_REWARD) {
    return NextResponse.json(
      { ok: false, error: `تحتاج ${LOYALTY.POINTS_PER_REWARD} نقاط على الأقل` },
      { status: 422 },
    );
  }

  // توليد كود كوبون فريد
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RWD-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const { error: couponError } = await admin.from('coupons').insert({
    code,
    description: 'مكافأة استبدال نقاط',
    type: 'fixed',
    discount_percent: 0,
    amount: LOYALTY.REWARD_VALUE,
    min_order: 0,
    usage_limit: 1,
    per_user_limit: 1,
    customers_only: true,
    is_active: true,
  });
  if (couponError) {
    return NextResponse.json({ ok: false, error: 'تعذّر إنشاء الكوبون' }, { status: 500 });
  }

  // خصم النقاط وتسجيل الحركة
  await admin.from('profiles').update({ points: points - LOYALTY.POINTS_PER_REWARD }).eq('id', user.id);
  await admin.from('point_transactions').insert({
    user_id: user.id,
    delta: -LOYALTY.POINTS_PER_REWARD,
    reason: `استبدال نقاط بكوبون ${code}`,
  });

  return NextResponse.json({ ok: true, code, value: LOYALTY.REWARD_VALUE, remaining: points - LOYALTY.POINTS_PER_REWARD });
}
