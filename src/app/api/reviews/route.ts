import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { findMemoryOrder } from '@/lib/data/memoryStore';
import { reviewSchema } from '@/lib/validation';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' },
      { status: 422 },
    );
  }
  const { code, rating, comment, name } = parsed.data;

  // ===== وضع المعاينة =====
  if (!isSupabaseConfigured) {
    const order = findMemoryOrder({ code });
    if (!order) return NextResponse.json({ ok: false, error: 'لم يتم العثور على الطلب' }, { status: 404 });
    if (order.status !== 'delivered') return NextResponse.json({ ok: false, error: 'يمكن التقييم بعد تسليم الطلب فقط' }, { status: 422 });
    if (order.reviewed_at) return NextResponse.json({ ok: false, error: 'تم تقييم هذا الطلب مسبقاً' }, { status: 409 });
    order.reviewed_at = new Date().toISOString();
    return NextResponse.json({ ok: true });
  }

  // ===== الإنتاج =====
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, reviewed_at, customer_name')
    .eq('code', code.toUpperCase())
    .limit(1)
    .single();

  if (!order) return NextResponse.json({ ok: false, error: 'لم يتم العثور على الطلب' }, { status: 404 });
  if (order.status !== 'delivered') return NextResponse.json({ ok: false, error: 'يمكن التقييم بعد تسليم الطلب فقط' }, { status: 422 });
  if (order.reviewed_at) return NextResponse.json({ ok: false, error: 'تم تقييم هذا الطلب مسبقاً' }, { status: 409 });

  const { error } = await supabase.from('reviews').insert({
    order_id: order.id,
    customer_name: name || order.customer_name || null,
    rating,
    comment: comment || null,
    is_approved: false,
  });
  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: false, error: 'تم تقييم هذا الطلب مسبقاً' }, { status: 409 });
    return NextResponse.json({ ok: false, error: 'تعذّر حفظ التقييم' }, { status: 500 });
  }
  await supabase.from('orders').update({ reviewed_at: new Date().toISOString() }).eq('id', order.id);

  return NextResponse.json({ ok: true });
}
